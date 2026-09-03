// components/mate/chat/ChatSlide.tsx

import { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Send, Plus, LogOut, MapPin, Calendar, Siren } from "lucide-react";
import type { OneOnOneChat } from "../hooks/chat.types";
import type { Post, ApplicationResponse } from "../../mate/hooks/mate.types";
import { useAuth } from "../../user/pages/AuthContext";
import { markRoomAsRead } from "../../../api/chat.api";
import { getApplicantAvatar } from "../../../shared/hooks/avatar";
import { AvatarDisplay } from "../../../shared/components/AvatarDisplay";
import { ReportModal } from "../../report/components";
import { submitReport } from "../../../api/report.api";
import "../styles/ChatSlide.css";

interface ChatSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  oneOnOneChats: OneOnOneChat[];
  allPosts: Post[];
  myApplications: ApplicationResponse[];
  receivedApplications: ApplicationResponse[];
  onSendOneOnOneMessage: (chatId: string, content: string) => void;
  onCreateOneOnOneChat: (postId: string, applicantId?: number) => Promise<OneOnOneChat | null>;
  onLeaveOneOnOneChat: (chatId: string) => void;
  onMarkAsRead: (chatId: string) => void;
}

type ChatPostInfo = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  author: OneOnOneChat["postAuthor"];
};

type SelectedChat = 
  | { type: "one-on-one"; chat: OneOnOneChat; post: ChatPostInfo }
  | null;

type TabType = "active" | "available";

export function ChatSlideModal({
  isOpen,
  onClose,
  oneOnOneChats,
  allPosts,
  myApplications,
  receivedApplications,
  onSendOneOnOneMessage,
  onCreateOneOnOneChat,
  onLeaveOneOnOneChat,
  onMarkAsRead,
}: ChatSlideModalProps){
  const [selectedChat, setSelectedChat] = useState<SelectedChat>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showNewChatList, setShowNewChatList] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();
  const [readMessageCounts, setReadMessageCounts] = useState<Record<string, number>>({});
  const [showReport, setShowReport] = useState(false);

  // 모달 닫을 때 애니메이션
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setSelectedChat(null);
    }, 300);
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  // 메시지 자동 스크롤
  useEffect(() => {
    if (selectedChat) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedChat?.chat.messages]);

  // 채팅 업데이트 감지
  useEffect(() => {
    if (selectedChat && selectedChat.type === "one-on-one") {
      const updatedChat = oneOnOneChats.find(c => c.id === selectedChat.chat.id);
      if (updatedChat && updatedChat.messages.length !== selectedChat.chat.messages.length) {
        const post = getPostInfo(updatedChat);
        setSelectedChat({ type: "one-on-one", chat: updatedChat, post });
      }
    }
  }, [oneOnOneChats]);

  if (!isOpen) return null;

  const getPostInfo = (chat: OneOnOneChat): ChatPostInfo => {
    // 채팅 객체에 이미 모든 정보가 있으므로 바로 반환
    const isIamAuthor = chat.postAuthorId === userId;
    
    return {
      id: chat.postId,
      destination: chat.destination,
      startDate: chat.startDate,
      endDate: chat.endDate,
      author: isIamAuthor ? chat.postAuthor : chat.applicant
    };
  };

  const getOtherUser = (chat: OneOnOneChat) => {
    // 상대방 정보 가져오기
    const isIamAuthor = chat.postAuthorId === userId;
    return isIamAuthor ? chat.applicant : chat.postAuthor;
  };

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

  // 새 채팅 가능한 목록 (1:1만)
  const getAvailableChats = () => {
    const available: Array<{
      type: "sent" | "received";
      postId: string;
      applicantId?: number;
      destination: string;
      startDate: string;
      endDate: string;
      post: Post | null;
      otherUser: { name: string; email: string; avatarEmoji: string | null};
    }> = [];

    // 받은 신청 목록
    receivedApplications
    .filter(app => app.status?.toUpperCase() === 'APPROVED')
    .filter(app => new Date(app.endDate) >= new Date(new Date().toDateString()))
    .forEach(app => {
      const hasChat = oneOnOneChats.some(
        chat => chat.postId === String(app.matePostId) 
        && chat.applicant.email === String(app.applicantEmail)
      );
      if (!hasChat) {
        available.push({
          type: "received",
          postId: String(app.matePostId),
          applicantId: app.applicantId,
          destination: app.postDestination,
          startDate: app.startDate,
          endDate: app.endDate,
          post: null as any,
          otherUser: { 
            name: app.applicantName, 
            email: app.applicantEmail, 
            avatarEmoji: app.avatar ?? null
          }
        });
      }
    });

    return available;
  };

  const availableChats = getAvailableChats();

  const handleCreateNewChat = async (item: typeof availableChats[0]) => {
    const newRoom = await onCreateOneOnOneChat(item.postId, item.applicantId);
    if (newRoom) {
      const post = getPostInfo(newRoom);
      setSelectedChat({ type: "one-on-one", chat: newRoom, post });
    }
  };

  const handleLeaveChat = (chatId: string, chatName: string) => {
    if (window.confirm(`"${chatName}" 채팅방을 나가시겠습니까?`)) {
      onLeaveOneOnOneChat(chatId);
      
      // 현재 선택된 채팅이면 선택 해제
      if (selectedChat && selectedChat.chat.id === chatId) {
        setSelectedChat(null);
      }
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;
    onSendOneOnOneMessage(selectedChat.chat.id, messageInput);
    setMessageInput("");
  };

  const handleSelectOneOnOne = async (chat: OneOnOneChat) => {
    const post = getPostInfo(chat);
    setSelectedChat({ type: "one-on-one", chat, post });
    setReadMessageCounts(prev => ({ ...prev, [chat.id]: chat.messages.length }));
    onMarkAsRead(chat.id);
    await markRoomAsRead(chat.id);
  };

  const allChatsEmpty = oneOnOneChats.length === 0;

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="chat-slide-overlay" onClick={handleClose} />

      {/* 슬라이드 패널 */}
      <div className={`chat-slide-slidePanel ${isClosing ? "chat-slide-closing" : ""}`}>
        {!selectedChat ? (
          // 채팅 목록
          <>
            <div className="chat-slide-header">
              <div className="chat-slide-headerTitle">
                <MessageSquare size={24} />
                <div>
                  <div style={{ fontSize: "20px" }}>채팅</div>
                  <div style={{ fontSize: "12px", fontWeight: 400, opacity: 0.8, textTransform: "none", letterSpacing: "normal" }}>
                    {oneOnOneChats.length}개의 대화
                  </div>
                </div>
              </div>
              <button onClick={handleClose} className="chat-slide-closeBtn">
                <X size={20} />
              </button>
            </div>

            {/* 탭 (활성 채팅이 있을 때만) */}
            {oneOnOneChats.length > 0 && (
              <div className="chat-slide-tabContainer">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`chat-slide-tab ${activeTab === "active" ? "chat-slide-tabActive" : ""}`}
                >
                  <MessageSquare size={18} />
                  활성 채팅
                  <span className="chat-slide-badge chat-slide-badgeGreen">
                    {oneOnOneChats.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("available")}
                  className={`chat-slide-tab ${activeTab === "available" ? "chat-slide-tabActive" : ""}`}
                >
                  <Plus size={18} />
                  시작 가능
                  <span className="chat-slide-badge chat-slide-badgeYellow">
                    {availableChats.length}
                  </span>
                </button>
              </div>
            )}

            <div className="chat-slide-content">
              {allChatsEmpty && availableChats.length === 0 ? (
                // 완전히 비어있을 때
                <div className="chat-slide-emptyState">
                  <div className="chat-slide-emptyIcon">💬</div>
                  <p className="chat-slide-emptyTitle">채팅이 없습니다</p>
                  <p className="chat-slide-emptyText">메이트 신청을 하고 대화를 시작해보세요!</p>
                </div>
              ) : oneOnOneChats.length === 0 ? (
                // 활성 채팅 없고 시작 가능한 채팅만 있을 때
                <div className="chat-slide-chatList">
                  <button
                    onClick={() => setShowNewChatList(!showNewChatList)}
                    className="chat-slide-newChatBtn"
                  >
                    <Plus size={20} />
                    새 채팅 시작하기
                    <span className="chat-slide-badge chat-slide-badgeYellow">
                      {availableChats.length}
                    </span>
                  </button>

                  {showNewChatList && (
                    <div className="chat-slide-newChatList">
                      <div className="chat-slide-sectionTitle">
                        ✨ 새로 시작할 수 있는 채팅
                      </div>
                      {availableChats.map((item, idx) => (
                        <div
                          key={`${item.type}-${item.postId}-${idx}`}
                          onClick={() => handleCreateNewChat(item)}
                          className="chat-slide-newChatCard"
                        >
                          <div className="chat-slide-chatCardContent">
                            <div className="chat-slide-avatarWrapper">
                              <div className={`chat-slide-avatar chat-slide-avatarPink`}>
                                <AvatarDisplay avatar={getApplicantAvatar(null, item.otherUser.avatarEmoji)} />
                              </div>
                              <div className="chat-slide-onlineDot"></div>
                            </div>
                            <div className="chat-slide-chatInfo">
                              <div className="chat-slide-chatHeader">
                                <span className="chat-slide-chatName">
                                  {item.otherUser.name}
                                </span>
                                <span className={`chat-slide-badge ${item.type === "sent" ? "chat-slide-badgeBlue" : "chat-slide-badgeGreen"}`}>
                                  {item.type === "sent" ? "내가 신청" : "신청 받음"}
                                </span>
                              </div>
                              <div className="chat-slide-chatLocation">
                                <MapPin size={14} />
                                {item.destination}
                              </div>
                              <div className="chat-slide-chatDates">
                                <Calendar size={14} />
                                {item.startDate} ~ {item.endDate}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showNewChatList && (
                    <div className="chat-slide-emptyState">
                      <div className="chat-slide-emptyIcon">👆</div>
                      <p className="chat-slide-emptyTitle">위 버튼을 눌러</p>
                      <p className="chat-slide-emptyText">새로운 채팅을 시작해보세요!</p>
                    </div>
                  )}
                </div>
              ) : (
                // 활성 채팅 있을 때 - 탭으로 구분
                <div className="chat-slide-chatList">
                  {activeTab === "active" ? (
                    // 활성 채팅 목록
                    <>
                      {oneOnOneChats.map((chat) => {
                        const post = getPostInfo(chat);
                        const otherUser = getOtherUser(chat);
                        const lastMessage = chat.messages[chat.messages.length - 1]

                        return (
                          <div key={chat.id} className="chat-slide-chatCard">
                            <div className="chat-slide-chatCardContent" onClick={() => handleSelectOneOnOne(chat)}>
                              <div className="chat-slide-avatarWrapper">
                                <div className={`chat-slide-avatar chat-slide-avatarPink`} style={{ overflow: "hidden" }}>
                                  <AvatarDisplay 
                                    avatar={getApplicantAvatar(
                                      otherUser.profileImage, 
                                      otherUser.avatarEmoji
                                    )} 
                                  />
                              </div>
                                {chat.unreadCount > 0 && (
                                  <div style={{
                                    position: "absolute",
                                    top: "-2px",
                                    right: "-2px",
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "50%",
                                    background: "#ef4444",
                                    border: "2px solid white",
                                  }} />
                                )}
                              </div>
                              <div className="chat-slide-chatInfo">
                                <div className="chat-slide-chatHeader">
                                  <span className="chat-slide-chatName">{otherUser.name}</span>
                                  <span className="chat-slide-chatTime">{formatLastMessageTime(chat.lastMessageAt)}</span>
                                </div>
                                <div className="chat-slide-chatLocation">
                                  <MapPin size={14} />
                                  {post.destination}
                                </div>
                                {lastMessage && (
                                  <div className="chat-slide-chatMessage">
                                    <MessageSquare size={14} />
                                    {lastMessage.content}
                                  </div>
                                )}
                                <div className="chat-slide-chatDates">
                                  <Calendar size={14} />
                                  {post.startDate} ~ {post.endDate}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeaveChat(chat.id, otherUser.name);
                              }}
                              className="chat-slide-leaveBtn"
                              title="채팅방 나가기"
                            >
                              <LogOut size={18} />
                            </button>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    // 시작 가능한 채팅 목록
                    <>
                      {availableChats.length === 0 ? (
                        <div className="chat-slide-emptyState">
                          <div className="chat-slide-emptyIcon">✅</div>
                          <p className="chat-slide-emptyTitle">모든 채팅이 활성화되었습니다</p>
                          <p className="chat-slide-emptyText">새로운 메이트를 찾아보세요!</p>
                        </div>
                      ) : (
                        <>
                          <div className="chat-slide-sectionTitle">
                            ✨ 새로 시작할 수 있는 채팅
                          </div>
                          {availableChats.map((item, idx) => (
                            <div
                              key={`${item.type}-${item.postId}-${idx}`}
                              onClick={() => handleCreateNewChat(item)}
                              className="chat-slide-newChatCard"
                            >
                              <div className="chat-slide-chatCardContent">
                                <div className="chat-slide-avatarWrapper">
                                  <div className={`chat-slide-avatar chat-slide-avatarPink`}>
                                    <AvatarDisplay avatar={getApplicantAvatar(null, item.otherUser.avatarEmoji)} />
                                  </div>
                                  <div className="chat-slide-onlineDot"></div>
                                </div>
                                <div className="chat-slide-chatInfo">
                                  <div className="chat-slide-chatHeader">
                                    <span className="chat-slide-chatName">
                                      {item.otherUser.name}
                                    </span>
                                    <span className={`chat-slide-badge ${item.type === "sent" ? "chat-slide-badgeBlue" : "chat-slide-badgeGreen"}`}>
                                      {item.type === "sent" ? "내가 신청" : "신청 받음"}
                                    </span>
                                  </div>
                                  <div className="chat-slide-chatLocation">
                                    <MapPin size={14} />
                                    {item.destination}
                                  </div>
                                  <div className="chat-slide-chatDates">
                                    <Calendar size={14} />
                                    {item.startDate} ~ {item.endDate}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {(() => {
            const otherUser = getOtherUser(selectedChat.chat);
            return(
          // 채팅 화면
          <>
            <div className="chat-slide-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className={`chat-slide-avatar chat-slide-avatarPink`} style={{ width: "40px", height: "40px", fontSize: "20px" }}>
                  <AvatarDisplay avatar={getApplicantAvatar(otherUser.profileImage, otherUser.avatarEmoji)} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px" }}>{otherUser.name}</div>
                  <div style={{ fontSize: "13px", opacity: 0.8 }}>📍 {selectedChat.post.destination}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => setShowReport(true)}
                  className="chat-slide-reportBtn"
                  title="신고하기"
                >
                  <Siren size={20} />
                </button>
                <button onClick={() => setSelectedChat(null)} className="chat-slide-closeBtn">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 만료 배너 */}
            {new Date(selectedChat.post.endDate) < new Date(new Date().toDateString()) && (
              <div className="chat-slide-expiredBanner">
                <span className="expired-icon">🕊️</span>
                <div className="expired-text">
                  <span className="expired-main">여행 기간이 종료되었습니다</span>
                  <span className="expired-sub">이 채팅방은 더 이상 메시지를 보낼 수 없어요</span>
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#eff6ff" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {selectedChat.chat.messages.map((msg) => {
                  if (msg.type === "LEAVE" || msg.type === "SYSTEM") {
                    return (
                      <div key={msg.id} className="chat-slide-systemMessage">
                        {msg.content}
                      </div>
                    );
                  }
                  
                  const myId = selectedChat.chat.postAuthor.id === userId
                    ? selectedChat.chat.postAuthor.id
                    : selectedChat.chat.applicant.id;
                  const isMyMessage = msg.senderId === myId;

                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMyMessage ? "flex-end" : "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: isMyMessage ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                        {!isMyMessage && <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.7)", paddingLeft: "8px" }}>{msg.senderName}</div>}
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                          {isMyMessage && <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.5)", fontFamily: "monospace" }}>{formatTime(msg.timestamp)}</span>}
                          <div
                            style={{
                              padding: "12px 16px",
                              border: "2px solid black",
                              background: isMyMessage ? "#fef08a" : "white",
                              boxShadow: "2px 2px 0 0 black",
                              fontSize: "14px",
                              wordBreak: "break-word"
                            }}
                          >
                            {msg.content}
                          </div>
                          {!isMyMessage && <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.5)", fontFamily: "monospace" }}>{formatTime(msg.timestamp)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div style={{ padding: "16px", background: "white", borderTop: "2px solid black" }}>
              {(() => {
                const isExpired = new Date(selectedChat.post.endDate) < new Date(new Date().toDateString());
                return (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !isExpired && handleSendMessage()}
                      placeholder={isExpired ? "종료된 채팅방입니다" : "메시지 입력..."}
                      disabled={isExpired}
                      style={{
                        flex: 1,
                        padding: "12px",
                        border: "2px solid black",
                        fontFamily: "monospace",
                        fontSize: "14px",
                        opacity: isExpired ? 0.5 : 1,
                        cursor: isExpired ? "not-allowed" : "text",
                        background: isExpired ? "#f5f5f5" : "white",
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || isExpired}
                      style={{
                        padding: "12px 16px",
                        background: isExpired ? "#ddd" : "#fbbf24",
                        border: "2px solid black",
                        cursor: !messageInput.trim() || isExpired ? "not-allowed" : "pointer",
                        boxShadow: isExpired ? "none" : "3px 3px 0 0 black",
                        opacity: !messageInput.trim() || isExpired ? 0.5 : 1,
                      }}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                );
              })()}
            </div>
          </>
          );
          })()}
        </>
      )}
      </div>

      {selectedChat && (
        <ReportModal
          show={showReport}
          targetType="채팅"
          targetAuthor={getOtherUser(selectedChat.chat).name}
          onClose={() => setShowReport(false)}
          onSubmit={async (reason, detail) => {
            const otherUser = getOtherUser(selectedChat.chat);

            const targetMessage = selectedChat.chat.messages
              .filter((msg) => msg.senderId === otherUser.id)
              .at(-1);

            if (!targetMessage) {
              alert("신고할 상대방 메시지가 없습니다.");
              return;
            }

            await submitReport({
              reportedUserId: otherUser.id,
              location: "CHAT",
              targetId: Number(targetMessage.id),
              reason,
              detail,
            });

            setShowReport(false);
          }}
        />
      )}
    </>
  );
}