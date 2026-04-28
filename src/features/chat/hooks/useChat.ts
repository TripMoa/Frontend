// hooks/mate/useChat.ts
//
// 채팅 통합 훅
// REST API (목록조회, 방생성) + STOMP (실시간 메시지) 결합
// 컴포넌트에서는 이 훅 하나만 import 해서 사용

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchMyChatRooms,
  fetchChatRoom,
  createChatRoom,
  sendMessageRest,
  ChatApiError,
  leaveChatRoom
} from "../../../api/chat.api";
import { useStompClient } from "./useStompClient";
import type {
  OneOnOneChat,
  ChatMessage,
  StompConnectionStatus,
} from "./chat.types";
import { useAuth } from "../../user/pages/AuthContext";

// ─────────────────────────────────────────────
// 반환 타입
// ─────────────────────────────────────────────

interface UseChatReturn {
  /** 채팅방 목록 */
  chatRooms: OneOnOneChat[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** WebSocket 연결 상태 */
  connectionStatus: StompConnectionStatus;

  // ── Actions ──
  /** 채팅방 목록 새로고침 */
  refreshRooms: () => Promise<void>;
  /** 채팅방 생성 (메이트 신청 시) */
  createRoom: (matePostId: number, applicantId?: number) => Promise<OneOnOneChat | null>;
  /** 메시지 전송 (STOMP 우선, 실패 시 REST 폴백) */
  sendMessage: (chatRoomId: string, content: string) => void;
  /** 특정 채팅방 상세 조회 (최신 메시지 로드) */
  openRoom: (roomId: string) => Promise<OneOnOneChat | null>;
  /** 에러 초기화 */
  clearError: () => void;
  /** 메세지 읽음 로직 */
  markAsRead: (roomId: string) => void;
  leaveRoom: (roomId: string) => Promise<void>;
}

// ─────────────────────────────────────────────
// 훅 구현
// ─────────────────────────────────────────────

export function useChat(): UseChatReturn {
  const [chatRooms, setChatRooms] = useState<OneOnOneChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRoomsRef = useRef(chatRooms);
  const { isAuthenticated } = useAuth();

  // chatRooms 레퍼런스 최신 유지
  useEffect(() => {
    chatRoomsRef.current = chatRooms;
  }, [chatRooms]);

  // ─────────────────────────────────────────
  // STOMP 실시간 메시지 수신 처리
  // ─────────────────────────────────────────

  const handleIncomingMessage = useCallback(
    (roomId: string, message: ChatMessage) => {
      setChatRooms((prev) =>
        prev.map((room) => {
          if (room.id !== roomId) return room;

          // 중복 메시지 방지
          if (room.messages.some((m) => m.id === message.id)) return room;

          return {
            ...room,
            messages: [...room.messages, message],
            lastMessageAt: message.timestamp,
            unreadCount: room.unreadCount + 1,
          };
        })
      );
    },
    []
  );

  // 구독할 채팅방 ID 목록
  const roomIds = chatRooms.map((room) => room.id);

  // STOMP 클라이언트 훅
  const {
    status: connectionStatus,
    sendMessage: stompSend,
    subscribeRoom,
  } = useStompClient({
    roomIds,
    onMessage: handleIncomingMessage,
    autoConnect: true,
  });

  // ─────────────────────────────────────────
  // REST API 호출
  // ─────────────────────────────────────────

  /**
   * 채팅방 목록 조회
   */
  const refreshRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rooms = await fetchMyChatRooms();
      setChatRooms(rooms);
    } catch (err) {
      if (err instanceof ChatApiError && err.isAuthError) {
        setError("로그인이 필요합니다");
      } else {
        setError("채팅방 목록을 불러오지 못했습니다");
      }
      console.error("[useChat] 채팅방 목록 조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 채팅방 생성
   */
  const createRoom = useCallback(
    async (matePostId: number, applicantId?: number): Promise<OneOnOneChat | null> => {
      try {
        const newRoom = await createChatRoom({ matePostId, applicantId });

        // 이미 존재하는 방이면 기존 목록에서 찾아서 반환
        const existing = chatRoomsRef.current.find((r) => r.id === newRoom.id);
        if (existing) return existing;

        // 새 방을 목록 맨 앞에 추가
        setChatRooms((prev) => [newRoom, ...prev]);

        // 새 방 STOMP 구독
        subscribeRoom(newRoom.id);

        return newRoom;
      } catch (err) {
        if (err instanceof ChatApiError) {
          setError(
            err.status === 400
              ? "채팅방을 생성할 수 없습니다"
              : "채팅방 생성에 실패했습니다"
          );
        }
        console.error("[useChat] 채팅방 생성 실패:", err);
        return null;
      }
    },
    [subscribeRoom]
  );

  /**
   * 특정 채팅방 열기 (최신 메시지 로드)
   */
  const openRoom = useCallback(
    async (roomId: string): Promise<OneOnOneChat | null> => {
      try {
        setChatRooms((prev) => 
            prev.map((r) => r.id === roomId ? {...r, unreadCount: 0 } : r)
        );

        const room = await fetchChatRoom(roomId);
        // 로컬 상태 업데이트
        setChatRooms((prev) =>
          prev.map((r) => (r.id === roomId ? room : r))
        );

        return room;
      } catch (err) {
        console.error("[useChat] 채팅방 조회 실패:", err);
        setError("채팅방을 열 수 없습니다");
        return null;
      }
    },
    []
  );

  /**
   * 메시지 전송
   * STOMP 연결 시 → STOMP 사용 (실시간)
   * STOMP 미연결 시 → REST API 폴백
   */
  const sendMessage = useCallback(
    async (chatRoomId: string, content: string) => {
      if (!content.trim()) return;

      if (connectionStatus === "connected") {
        // STOMP 실시간 전송
        stompSend({
          chatRoomId: Number(chatRoomId),
          content: content.trim(),
        });
      } else {
        // ⚡ REST 폴백
        console.warn("[useChat] STOMP 미연결 → REST 폴백 전송");
        try {
          const message = await sendMessageRest(chatRoomId, content.trim());

          // 로컬 상태에 메시지 추가
          setChatRooms((prev) =>
            prev.map((room) => {
              if (room.id !== chatRoomId) return room;
              return {
                ...room,
                messages: [...room.messages, message],
                lastMessageAt: message.timestamp,
              };
            })
          );
        } catch (err) {
          console.error("[useChat] 메시지 전송 실패:", err);
          setError("메시지 전송에 실패했습니다");
        }
      }
    },
    [connectionStatus, stompSend]
  );

  const clearError = useCallback(() => setError(null), []);

  const markAsRead = useCallback((roomId: string) => {
    setChatRooms((prev) => 
      prev.map((r) => r.id === roomId ? { ...r, unreadCount: 0 } : r)
    );
  }, []);

  const leaveRoom = useCallback(async (roomId: string) => {
    try {
        await leaveChatRoom(roomId);
        setChatRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err) {
        console.error("[useChat] 채팅방 나가기 실패:", err);
        setError("채팅방 나가기에 실패했습니다");
    }
  }, []);


  // ─────────────────────────────────────────
  // 초기 로드
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshRooms();
  }, [refreshRooms]);

  return {
    chatRooms,
    isLoading,
    error,
    connectionStatus,
    refreshRooms,
    createRoom,
    sendMessage,
    openRoom,
    clearError,
    markAsRead,
    leaveRoom
  };
}