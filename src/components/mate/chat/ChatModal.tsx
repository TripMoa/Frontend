// components/mate/ChatModal.tsx

import { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Users, Send, Search } from "lucide-react";
import type { OneOnOneChat, GroupChat } from "./chat/chat.types";
import type { Post } from "../mate.types";
import { CURRENT_USER } from "../mate.constants";
import styles from "../../styles/mate/Mate.module.css";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  oneOnOneChats: OneOnOneChat[];
  groupChats: GroupChat[];
  allPosts: Post[];
  onSendOneOnOneMessage: (chatId: string, content: string) => void;
  onSendGroupMessage: (chatId: string, content: string) => void;
}

type SelectedChat = 
  | { type: "one-on-one"; chat: OneOnOneChat; post: Post }
  | { type: "group"; chat: GroupChat }
  | null;

export function ChatModal({
  isOpen,
  onClose,
  oneOnOneChats,
  groupChats,
  allPosts,
  onSendOneOnOneMessage,
  onSendGroupMessage,
}: ChatModalProps): JSX.Element | null {
  const [selectedChat, setSelectedChat] = useState<SelectedChat>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 모달이 닫힐 때 선택된 채팅 초기화
  useEffect(() => {
    if (!isOpen) {
      setSelectedChat(null);
      setSearchQuery("");
    }
  }, [isOpen]);

  // 메시지 자동 스크롤
  useEffect(() => {
    if (selectedChat) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedChat?.type === "one-on-one" ? selectedChat?.chat.messages : selectedChat?.type === "group" ? selectedChat?.chat.messages : []]);

  // 채팅 업데이트 감지
  useEffect(() => {
    if (selectedChat) {
      if (selectedChat.type === "one-on-one") {
        const updatedChat = oneOnOneChats.find(c => c.id === selectedChat.chat.id);
        if (updatedChat && updatedChat.messages.length !== selectedChat.chat.messages.length) {
          const post = getPostInfo(selectedChat.chat.postId);
          if (post) {
            setSelectedChat({ type: "one-on-one", chat: updatedChat, post });
          }
        }
      } else if (selectedChat.type === "group") {
        const updatedChat = groupChats.find(c => c.id === selectedChat.chat.id);
        if (updatedChat && updatedChat.messages.length !== selectedChat.chat.messages.length) {
          setSelectedChat({ type: "group", chat: updatedChat });
        }
      }
    }
  }, [oneOnOneChats, groupChats]);

  if (!isOpen) return null;

  const getPostInfo = (postId: string) => allPosts.find(p => p.id === postId);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "오후" : "오전";
    const displayHours = hours % 12 || 12;
    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, "0")}`;
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    const minutes = Math.floor(diff / (1000 * 60));
    return minutes > 0 ? `${minutes}분 전` : "방금";
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;
    if (selectedChat.type === "one-on-one") {
      onSendOneOnOneMessage(selectedChat.chat.id, messageInput);
    } else {
      onSendGroupMessage(selectedChat.chat.id, messageInput);
    }
    setMessageInput("");
  };

  const handleSelectOneOnOne = (chat: OneOnOneChat) => {
    const post = getPostInfo(chat.postId);
    if (post) setSelectedChat({ type: "one-on-one", chat, post });
  };

  const handleSelectGroup = (chat: GroupChat) => {
    setSelectedChat({ type: "group", chat });
  };

  const filteredOneOnOneChats = oneOnOneChats.filter(chat => {
    if (!searchQuery) return true;
    const post = getPostInfo(chat.postId);
    const isMyChat = chat.applicantId === CURRENT_USER.email;
    const otherUserName = isMyChat ? post?.author.name : "Unknown";
    return post?.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUserName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredGroupChats = groupChats.filter(chat => {
    if (!searchQuery) return true;
    return chat.postDestination.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const allChatsEmpty = oneOnOneChats.length === 0 && groupChats.length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]" onClick={onClose}>
      <div 
        className="bg-white border-4 border-black w-full max-w-6xl h-[85vh] flex flex-col"
        style={{ boxShadow: "12px 12px 0 0 black" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-black text-white p-5 flex items-center justify-between border-b-4 border-black">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3">
            <MessageSquare className="w-7 h-7" />
            채팅
          </h2>
          <button
            onClick={onClose}
            className="bg-white text-black px-4 py-2 border-2 border-white font-bold hover:bg-yellow-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 메인 영역 */}
        {!selectedChat ? (
          // 채팅 목록
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b-2 border-black bg-gray-50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/50" />
                <input
                  type="text"
                  placeholder="채팅방 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-black font-mono text-base focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {allChatsEmpty ? (
                <div className="p-16 text-center">
                  <MessageSquare className="w-20 h-20 mx-auto mb-6 text-black/30" />
                  <p className="font-bold text-black/60 text-xl uppercase">채팅이 없습니다</p>
                  <p className="text-base text-black/40 mt-3">메이트 신청을 해보세요</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-5xl mx-auto">
                  {filteredOneOnOneChats.map((chat) => {
                    const post = getPostInfo(chat.postId);
                    const isMyChat = chat.applicantId === CURRENT_USER.email;
                    const otherUser = isMyChat ? post?.author : null;
                    const lastMessage = chat.messages[chat.messages.length - 1];

                    return (
                      <div
                        key={chat.id}
                        onClick={() => handleSelectOneOnOne(chat)}
                        className="bg-white border-2 border-black p-5 cursor-pointer hover:translate-y-[-2px] transition-all"
                        style={{ boxShadow: "4px 4px 0 0 black" }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-pink-200 border-2 border-black flex items-center justify-center text-3xl flex-shrink-0">
                            {otherUser?.avatar || "👤"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-lg truncate">{otherUser?.name || "Unknown"}</span>
                              <span className="text-xs text-black/50 font-mono flex-shrink-0 ml-2">
                                {formatLastMessageTime(chat.lastMessageAt)}
                              </span>
                            </div>
                            <div className="text-sm text-black/60 mb-1 truncate">📍 {post?.destination || "Unknown"}</div>
                            {lastMessage && <div className="text-base text-black/60 truncate">{lastMessage.content}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredGroupChats.map((chat) => {
                    const lastMessage = chat.messages[chat.messages.length - 1];

                    return (
                      <div
                        key={chat.id}
                        onClick={() => handleSelectGroup(chat)}
                        className="bg-white border-2 border-black p-5 cursor-pointer hover:translate-y-[-2px] transition-all"
                        style={{ boxShadow: "4px 4px 0 0 black" }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-purple-200 border-2 border-black flex items-center justify-center flex-shrink-0">
                            <Users className="w-8 h-8" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-lg truncate">{chat.postDestination} 여행</span>
                              <span className="text-xs text-black/50 font-mono flex-shrink-0 ml-2">
                                {formatLastMessageTime(chat.lastMessageAt)}
                              </span>
                            </div>
                            <div className="text-sm text-black/60 mb-1">👥 {chat.members.length}명</div>
                            {lastMessage && (
                              <div className="text-base text-black/60 truncate">
                                <span className="font-bold">{lastMessage.senderName}:</span> {lastMessage.content}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          // 채팅 화면
          <div className="flex-1 flex flex-col">
            {/* 채팅 헤더 */}
            <div className="bg-white border-b-2 border-black p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedChat.type === "one-on-one" ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-pink-200 border-2 border-black flex items-center justify-center text-2xl">
                      {selectedChat.post.author.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{selectedChat.post.author.name}</div>
                      <div className="text-base text-black/60">📍 {selectedChat.post.destination}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-purple-200 border-2 border-black flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">{selectedChat.chat.postDestination} 여행 단체방</div>
                      <div className="text-base text-black/60">👥 {selectedChat.chat.members.length}명</div>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedChat(null)}
                className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors"
                style={{ boxShadow: "2px 2px 0 0 black" }}
              >
                목록으로
              </button>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-blue-50">
              {(selectedChat.type === "one-on-one" ? selectedChat.chat.messages : selectedChat.chat.messages).map((msg) => {
                const isMyMessage = msg.senderId === CURRENT_USER.email;

                return (
                  <div key={msg.id} className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-lg flex flex-col gap-1 ${isMyMessage ? "items-end" : "items-start"}`}>
                      {!isMyMessage && <div className="text-xs font-bold text-black/70 px-2">{msg.senderName}</div>}
                      <div className="flex items-end gap-2">
                        {isMyMessage && <span className="text-xs text-black/50 font-mono">{formatTime(msg.timestamp)}</span>}
                        <div
                          className={`px-5 py-3 border-2 border-black ${isMyMessage ? "bg-yellow-300" : "bg-white"}`}
                          style={{ boxShadow: "3px 3px 0 0 black" }}
                        >
                          <p className="text-base break-words">{msg.content}</p>
                        </div>
                        {!isMyMessage && <span className="text-xs text-black/50 font-mono">{formatTime(msg.timestamp)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 메시지 입력 */}
            <div className="bg-white border-t-2 border-black p-5">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-5 py-4 border-2 border-black font-mono text-base focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-8 py-4 bg-yellow-400 border-2 border-black font-bold hover:translate-y-[-2px] active:translate-y-[0px] transition-all disabled:opacity-50"
                  style={{ boxShadow: "4px 4px 0 0 black" }}
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}