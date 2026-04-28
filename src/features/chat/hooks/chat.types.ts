// hooks/mate/chat.types.ts

// ─────────────────────────────────────────────
// 백엔드 API 응답과 1:1 매칭되는 타입
// ─────────────────────────────────────────────

/** 채팅 메시지 (백엔드 ChatMessageResponse 매칭) */
export interface ChatMessage {
  id: string;
  senderId: number;       // Member.Id
  senderName: string;
  senderAvatar: string;   // profileImage
  content: string;
  timestamp: string;       // ISO 문자열
  type?: string;
}

/** 채팅방 참여자 정보 (백엔드 MemberInfo 매칭) */
export interface ChatMemberInfo {
  id: number;
  name: string;
  email: string;
  profileImage: string;
  avatarEmoji: string | null;
  avatarColor: string | null;
}

/** 1:1 채팅방 (백엔드 ChatRoomResponse 매칭) */
export interface OneOnOneChat {
  id: string;
  postId: string;
  postAuthorId: number;     // author id
  applicantId: number;      // applicant id
  destination: string;
  startDate: string;
  endDate: string;
  postAuthor: ChatMemberInfo;
  applicant: ChatMemberInfo;
  messages: ChatMessage[];
  lastMessageAt: string;
  createdAt: string;
  unreadCount: number;
}

// ─────────────────────────────────────────────
// STOMP 관련 타입
// ─────────────────────────────────────────────

/** STOMP 메시지 전송 요청 */
export interface StompSendMessage {
  chatRoomId: number;
  content: string;
}

/** STOMP 연결 상태 */
export type StompConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

// ─────────────────────────────────────────────
// API 요청 타입
// ─────────────────────────────────────────────

/** 채팅방 생성 요청 */
export interface CreateRoomRequest {
  matePostId: number;
  applicantId?: number;
}

/** 메시지 전송 요청 (REST) */
export interface SendMessageRequest {
  chatRoomId: number;
  content: string;
}