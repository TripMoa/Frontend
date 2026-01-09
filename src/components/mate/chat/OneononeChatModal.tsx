// components/mate/chat/OneOnOneChatModal.tsx

import { useEffect, useRef } from "react";
import type { Post } from "../../../hooks/mate/mate.types";
import type { ChatMessage } from "./chat.types";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import { CURRENT_USER } from "../../../hooks/mate/mate.constants";

interface OneOnOneChatModalProps {
  post: Post;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onClose: () => void;
}

export default function OneOnOneChatModal({
  post,
  messages,
  onSendMessage,
  onClose,
}: OneOnOneChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 추가될 때마다 스크롤 하단으로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white border-4 border-black rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        style={{ boxShadow: "8px 8px 0 0 black" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black bg-pink-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center text-2xl">
              {post.author.avatar}
            </div>
            <div>
              <h3 className="text-xl font-black">{post.author.name}님과의 채팅</h3>
              <p className="text-sm text-gray-700">{post.destination} 여행</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-red-400 border-2 border-black rounded-full font-black text-xl hover:bg-red-500 transition-colors"
            style={{ boxShadow: "2px 2px 0 0 black" }}
          >
            ×
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-6 bg-blue-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-500 font-bold">
                아직 메시지가 없습니다.
                <br />
                방장님께 여행에 대해 질문해보세요!
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isMyMessage={msg.senderId === CURRENT_USER.email}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="p-4 border-t-4 border-black bg-white">
          <ChatInput
            onSend={onSendMessage}
            placeholder="메시지를 입력하세요..."
          />
        </div>
      </div>
    </div>
  );
}