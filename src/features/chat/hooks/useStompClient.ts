// hooks/mate/useStompClient.ts

import { useEffect, useRef, useCallback, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { ChatMessage, StompConnectionStatus, StompSendMessage } from "./chat.types";

const WS_URL = "http://localhost:8080/ws";

interface UseStompClientOptions {
  roomIds: string[];
  onMessage: (roomId: string, message: ChatMessage) => void;
  onStatusChange?: (status: StompConnectionStatus) => void;
  autoConnect?: boolean;
}

interface UseStompClientReturn {
  status: StompConnectionStatus;
  sendMessage: (payload: StompSendMessage) => void;
  connect: () => void;
  disconnect: () => void;
  subscribeRoom: (roomId: string) => void;
  unsubscribeRoom: (roomId: string) => void;
}

export function useStompClient({
  roomIds,
  onMessage,
  onStatusChange,
  autoConnect = true,
}: UseStompClientOptions): UseStompClientReturn {
  const [status, setStatus] = useState<StompConnectionStatus>("disconnected");
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, { unsubscribe: () => void }>>(new Map());
  const onMessageRef = useRef(onMessage);

  // 콜백 레퍼런스 최신 유지
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // 상태 업데이트 + 외부 콜백 호출
  const updateStatus = useCallback(
    (newStatus: StompConnectionStatus) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  // 채팅방 구독
  const subscribeRoom = useCallback(
    (roomId: string) => {
      const client = clientRef.current;
      if (!client?.connected) return;

      // 이미 구독 중이면 스킵
      if (subscriptionsRef.current.has(roomId)) return;

      const subscription = client.subscribe(
        `/sub/chat/room/${roomId}`,
        (frame: IMessage) => {
          try {
            const message: ChatMessage = JSON.parse(frame.body);
            onMessageRef.current(roomId, message);
          } catch (err) {
          }
        }
      );

      subscriptionsRef.current.set(roomId, subscription);
    },
    []
  );

  // 채팅방 구독 해제
  const unsubscribeRoom = useCallback((roomId: string) => {
    const subscription = subscriptionsRef.current.get(roomId);
    if (subscription) {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(roomId);
    }
  }, []);

  // STOMP 클라이언트 생성 + 연결
  const connect = useCallback(() => {
    // 이미 연결 중이면 스킵
    if (clientRef.current?.connected) return;

    updateStatus("connecting");

    const token = localStorage.getItem("accessToken");
    const client = new Client({
      // SockJS 사용 (WebSocketConfig의 withSockJS()에 대응)
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,

      // STOMP 연결 시 JWT 토큰 전달
      connectHeaders: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },

      // 재연결 설정
      reconnectDelay: 5000,        // 5초 후 재연결 시도
      heartbeatIncoming: 10000,    // 서버 -> 클라 heartbeat
      heartbeatOutgoing: 10000,    // 클라 -> 서버 heartbeat

      // 연결 성공
      onConnect: () => {
        updateStatus("connected");
        // 전달받은 roomIds 전부 구독
        roomIds.forEach((roomId) => subscribeRoom(roomId));
      },

      // 연결 실패 시 무한 재시도 방지
      onWebSocketClose: () => {
        updateStatus("disconnected");
        subscriptionsRef.current.clear();
      },

      onStompError: (frame) => {
        updateStatus("error");
        // 인증 에러면 재연결 중지
        client.deactivate();
      },
    });

    client.activate();
    clientRef.current = client;
  }, [roomIds, subscribeRoom, updateStatus]);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      // 모든 구독 해제
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current.clear();

      clientRef.current.deactivate();
      clientRef.current = null;
      updateStatus("disconnected");
    }
  }, [updateStatus]);

  // 메세지 전송 /pub/chat/message 로 발행
  const sendMessage = useCallback((payload: StompSendMessage) => {
    const client = clientRef.current;

    if (!client?.connected) {
      return;
    }

    client.publish({
      destination: "/pub/chat/message",
      body: JSON.stringify(payload),
    });
  }, []);

  // lifecycle
  // 자동 연결
  const hasRooms = roomIds.length > 0;
  useEffect(() => {
    if (autoConnect && roomIds.length > 0) { connect(); }

    return () => { disconnect(); };
  }, [autoConnect, hasRooms]); // roomIds 변경 시 재연결하지 않음 (구독만 업데이트)

  // roomIds가 바뀌면 구독 목록 동기화
  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected) return;

    const currentRoomIds = new Set(subscriptionsRef.current.keys());
    const newRoomIds = new Set(roomIds);

    // 새로 추가된 방 구독
    roomIds.forEach((roomId) => {
      if (!currentRoomIds.has(roomId)) {
        subscribeRoom(roomId);
      }
    });

    // 제거된 방 구독 해제
    currentRoomIds.forEach((roomId) => {
      if (!newRoomIds.has(roomId)) {
        unsubscribeRoom(roomId);
      }
    });
  }, [roomIds, subscribeRoom, unsubscribeRoom]);

  return {
    status,
    sendMessage,
    connect,
    disconnect,
    subscribeRoom,
    unsubscribeRoom,
  };
}