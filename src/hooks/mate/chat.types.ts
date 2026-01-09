// hooks/mate/chat.types.ts

import type { Author } from "./mate.types";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
}

export interface OneOnOneChat {
  id: string;
  postId: string;
  postAuthorId: string;
  applicantId: string;   
  destination: string;     
  dates: {
    start: string;         
    end: string;           
  };
  postAuthor: {            
    name: string;
    email: string;
    avatar: string;
  };
  applicant: {             
    name: string;
    email: string;
    avatar: string;
  };
  messages: ChatMessage[];
  lastMessageAt: string;
  createdAt: string;
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