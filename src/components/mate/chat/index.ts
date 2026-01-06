// components/mate/chat/index.ts

export { default as ChatBubble } from "./ChatBubble";
export { default as ChatInput } from "./ChatInput";
export { default as OneOnOneChatModal } from "./OneononeChatModal";
export { default as GroupChatModal } from "./GroupChatModal";

export type {
  ChatMessage,
  OneOnOneChat,
  GroupChat,
  ChatBadge,
} from "./chat.types";