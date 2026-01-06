// components/mate/chat/GroupChatModal.tsx

import { useEffect, useRef } from "react";
import type { GroupChat } from "./chat.types";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import { CURRENT_USER } from "../mate.constants";

interface GroupChatModalProps {
  groupChat: GroupChat;
  onSendMessage: (content: string) => void;
  onClose: () => void;
}

export default function GroupChatModal({
  groupChat,
  onSendMessage,
  onClose,
}: GroupChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupChat.messages]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white border-4 border-black rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        style={{ boxShadow: "8px 8px 0 0 black" }}
      >
        {/* 헤더 */}
        <div className="p-6 border-b-4 border-black bg-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-black">
              {groupChat.postDestination} 여행 단체방 🎉
            </h3>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-red-400 border-2 border-black rounded-full font-black text-xl hover:bg-red-500 transition-colors"
              style={{ boxShadow: "2px 2px 0 0 black" }}
            >
              ×
            </button>
          </div>
          
          {/* 참여 멤버 */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-bold text-gray-700">참여 멤버:</span>
            {groupChat.members.map((member, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-1 bg-white border-2 border-black rounded-full text-xs font-bold"
                style={{ boxShadow: "2px 2px 0 0 black" }}
              >
                <span>{member.avatar}</span>
                <span>{member.name}</span>
              </div>
            ))}
          </div>
          
          {/* 여행 일정 */}
          <div className="mt-2 text-sm text-gray-700">
            📅 {groupChat.postDates.start} ~ {groupChat.postDates.end}
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-6 bg-purple-50">
          {groupChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🎊</div>
              <p className="text-gray-500 font-bold">
                여행 메이트가 모였습니다!
                <br />
                함께 즐거운 여행을 준비해보세요.
              </p>
            </div>
          ) : (
            <>
              {groupChat.messages.map((msg) => (
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