// components/mate/chat/ChatBubble.tsx

import type { ChatMessage } from "./chat.types";

interface ChatBubbleProps {
  message: ChatMessage;
  isMyMessage: boolean;
}

export default function ChatBubble({ message, isMyMessage }: ChatBubbleProps) {
  return (
    <div className={`flex gap-3 mb-4 ${isMyMessage ? "flex-row-reverse" : ""}`}>
      {/* 아바타 */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center text-xl">
        {message.senderAvatar}
      </div>

      {/* 메시지 내용 */}
      <div className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} max-w-[70%]`}>
        {/* 보낸 사람 이름 (내 메시지가 아닐 때만) */}
        {!isMyMessage && (
          <span className="text-xs font-bold mb-1 px-2">{message.senderName}</span>
        )}
        
        {/* 메시지 버블 */}
        <div
          className={`px-4 py-3 border-2 border-black ${
            isMyMessage
              ? "bg-yellow-300 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl"
              : "bg-white rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
          }`}
          style={{
            boxShadow: isMyMessage ? "3px 3px 0 0 black" : "2px 2px 0 0 black",
          }}
        >
          <p className="text-sm break-words">{message.content}</p>
        </div>

        {/* 시간 */}
        <span className="text-xs text-gray-500 mt-1 px-2">
          {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}