// src/features/workspace/hooks/useTripRealtime.ts
//
// 여행 실시간 연결 (STOMP /sub/trip/{tripId}).
// - 같은 여행의 다른 멤버가 일정·장소를 바꾸면 서버가 "바뀌었다"는 알림을 보내고, 이 훅이 onMessage 로 넘겨준다.
// - 내 탭이 일으킨 변경(originId === CLIENT_ID)은 걸러서 넘기지 않는다 (이미 내 화면에 반영돼 있다).
// - 연결이 (다시) 붙을 때, 그리고 오래 숨어 있던 탭이 다시 보일 때 onResync 를 불러 놓친 변경을 맞춘다.
// - 채팅 훅(useStompClient)과는 별도 연결이다 — 채팅 쪽 코드는 건드리지 않는다.

import { useEffect, useRef, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { CLIENT_ID, getAccessToken, tryRefreshAuth } from "../../../api/api";
import { API_BASE_URL } from "../../../shared/config/env";
import type { TripChangeMessage } from "./tripChange";

const WS_URL = `${API_BASE_URL}/ws`;

// 구독이 거절되는 등 계속 실패하는 연결은 포기한다 (이 시간 안에 이 횟수만큼 오류가 나면)
const GIVE_UP_ERRORS = 3;
const GIVE_UP_WINDOW_MS = 60_000;
// 이 시간 넘게 숨어 있던 탭이 다시 보이면 한 번 맞춘다
const RESYNC_AFTER_HIDDEN_MS = 10_000;

// idle: 아직 연결 시도 전(또는 정리됨), connected: 구독 중, disconnected: 끊겨서 재연결을 기다리는 중, error: 계속 거절돼 포기함
export type RealtimeStatus = "idle" | "connected" | "disconnected" | "error";

interface Options {
  tripId: number | null;
  /** 다른 탭·멤버가 일으킨 변경 알림 */
  onMessage: (message: TripChangeMessage) => void;
  /** 연결이 붙었을 때(재연결 포함)·숨어 있던 탭이 다시 보일 때 — 놓친 변경을 서버 기준으로 맞추라는 신호 */
  onResync: () => void;
}

export function useTripRealtime({ tripId, onMessage, onResync }: Options): { status: RealtimeStatus } {
  const [status, setStatus] = useState<RealtimeStatus>("idle");

  // 콜백이 바뀌어도 연결을 다시 만들지 않도록 최신 값을 ref 로 들고 있는다
  const onMessageRef = useRef(onMessage);
  const onResyncRef = useRef(onResync);
  useEffect(() => {
    onMessageRef.current = onMessage;
    onResyncRef.current = onResync;
  }, [onMessage, onResync]);

  useEffect(() => {
    if (!tripId) return;

    let disposed = false;
    const errorTimes: number[] = [];
    let hiddenAt: number | null = null;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      // 연결할 때마다 그 시점의 액세스 토큰을 쓴다 (재연결 때 만료된 옛 토큰을 보내지 않도록)
      beforeConnect: async () => {
        if (!getAccessToken()) await tryRefreshAuth();
        const token = getAccessToken();
        client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      },

      onConnect: () => {
        if (disposed) return;
        setStatus("connected");
        client.subscribe(`/sub/trip/${tripId}`, (frame: IMessage) => {
          let message: TripChangeMessage;
          try {
            message = JSON.parse(frame.body) as TripChangeMessage;
          } catch {
            return;
          }
          if (message.originId && message.originId === CLIENT_ID) return;   // 내 탭이 한 변경은 이미 화면에 있다
          onMessageRef.current(message);
        });
        // 연결이 없던 동안·연결 직전에 일어난 변경을 맞춘다
        onResyncRef.current();
      },

      onWebSocketClose: () => {
        if (!disposed) setStatus("disconnected");
      },

      onStompError: () => {
        if (disposed) return;
        // 토큰이 만료돼 거절됐을 수 있으니 갱신해 두면 자동 재연결 때 새 토큰으로 붙는다
        void tryRefreshAuth();
        const now = Date.now();
        errorTimes.push(now);
        while (errorTimes.length && now - errorTimes[0] > GIVE_UP_WINDOW_MS) errorTimes.shift();
        if (errorTimes.length >= GIVE_UP_ERRORS) {
          setStatus("error");
          void client.deactivate();   // 계속 거절되는 연결은 더 시도하지 않는다
        }
      },
    });

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt >= RESYNC_AFTER_HIDDEN_MS) onResyncRef.current();
      hiddenAt = null;
    };
    document.addEventListener("visibilitychange", onVisibility);

    client.activate();

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void client.deactivate();
      setStatus("idle");
    };
  }, [tripId]);

  return { status };
}
