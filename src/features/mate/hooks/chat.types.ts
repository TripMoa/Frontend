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
  startDate: string;         
  endDate: string;           
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

export interface ChatBadge {
  chatId: string;
  unreadCount: number;
}