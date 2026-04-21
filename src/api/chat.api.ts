// api/chatApi.ts
//
// 백엔드 REST API 호출 함수
// 엔드포인트: /api/chat/rooms, /api/chat/rooms/:id/messages

import type {
  OneOnOneChat,
  ChatMessage,
  CreateRoomRequest,
  SendMessageRequest,
} from "../features/chat/hooks/chat.types";
import { getAccessToken } from "./api";

// ─────────────────────────────────────────────
// 기본 설정
// ─────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const CHAT_API = `${BASE_URL}/api/chat`;

/**
 * 공통 fetch 래퍼
 * - JWT 토큰 자동 첨부
 * - 에러 핸들링 통일
 */
async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // localStorage, cookie, zustand store 등
  const token = getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: "include", // 쿠키 방식이면 필요
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new ChatApiError(response.status, errorBody || response.statusText);
  }

  // 204 No Content 등 빈 응답 처리
  if (response.status === 204) return null as T;

  return response.json();
}

/** 채팅 API 에러 클래스 */
export class ChatApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`Chat API Error [${status}]: ${body}`);
    this.name = "ChatApiError";
    this.status = status;
    this.body = body;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }
}

// ─────────────────────────────────────────────
// 채팅방 API
// ─────────────────────────────────────────────

/**
 * 내 채팅방 목록 조회
 * GET /api/chat/rooms
 */
export async function fetchMyChatRooms(): Promise<OneOnOneChat[]> {
  return fetchWithAuth<OneOnOneChat[]>(`${CHAT_API}/rooms`);
}

/**
 * 특정 채팅방 상세 조회
 * GET /api/chat/rooms/:roomId
 */
export async function fetchChatRoom(roomId: string): Promise<OneOnOneChat> {
  return fetchWithAuth<OneOnOneChat>(`${CHAT_API}/rooms/${roomId}`);
}

/**
 * 채팅방 생성 (메이트 신청 시)
 * POST /api/chat/rooms
 */
export async function createChatRoom(
  request: CreateRoomRequest
): Promise<OneOnOneChat> {
  return fetchWithAuth<OneOnOneChat>(`${CHAT_API}/rooms`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ─────────────────────────────────────────────
// 메시지 API
// ─────────────────────────────────────────────

/**
 * 특정 채팅방 메시지 목록 조회
 * GET /api/chat/rooms/:roomId/messages
 */
export async function fetchMessages(roomId: string): Promise<ChatMessage[]> {
  return fetchWithAuth<ChatMessage[]>(`${CHAT_API}/rooms/${roomId}/messages`);
}

/**
 * 메시지 전송 (REST 방식 - WebSocket 없이도 동작)
 * POST /api/chat/rooms/:roomId/messages
 *
 * ※ 실시간 통신은 STOMP를 사용하되,
 *   폴백(fallback)이나 초기 로딩 시 REST 사용
 */
export async function sendMessageRest(
  roomId: string,
  content: string
): Promise<ChatMessage> {
  return fetchWithAuth<ChatMessage>(`${CHAT_API}/rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({ chatRoomId: Number(roomId), content }),
  });
}

export async function markRoomAsRead(roomId: string): Promise<void> {
    const token = getAccessToken();
    const response = await fetch(`${CHAT_API}/rooms/${roomId}/read`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`읽음 처리 실패: ${response.status}`);
    }
}

export async function leaveChatRoom(roomId: string): Promise<void> {
    const token = getAccessToken();
    const response = await fetch(`${CHAT_API}/rooms/${roomId}/leave`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`채팅방 나가기 실패: ${response.status}`);
    }
}