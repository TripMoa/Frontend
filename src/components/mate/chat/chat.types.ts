// components/mate/chat/chat.types.ts

import type { Author } from "../mate.types";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface OneOnOneChat {
  id: string;
  postId: string;
  postAuthorId: string;
  applicantId: string;
  messages: ChatMessage[];
  createdAt: string;
  lastMessageAt: string;
}

export interface GroupChat {
  id: string;
  postId: string;
  postDestination: string;
  postDates: { start: string; end: string };
  members: Author[];
  messages: ChatMessage[];
  createdAt: string;
  lastMessageAt: string;
}

export interface ChatBadge {
  chatId: string;
  unreadCount: number;
}