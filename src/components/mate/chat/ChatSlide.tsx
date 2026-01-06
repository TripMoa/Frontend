// components/mate/chat/ChatSlideModal.tsx (탭 + 나가기 기능)

import { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Users, Send, Plus, LogOut } from "lucide-react";
import type { OneOnOneChat, GroupChat } from "./chat.types";
import type { Post, MyApplication, ReceivedApplication } from "../mate.types";
import { CURRENT_USER } from "../mate.constants";
import styles from "../../../styles/mate/ChatSlide.module.css";

interface ChatSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  oneOnOneChats: OneOnOneChat[];
  groupChats: GroupChat[];
  allPosts: Post[];
  myApplications: MyApplication[];
  receivedApplications: ReceivedApplication[];
  approvedApplicants: string[];
  onSendOneOnOneMessage: (chatId: string, content: string) => void;
  onSendGroupMessage: (chatId: string, content: string) => void;
  onCreateOneOnOneChat: (postId: string, otherUserId: string) => void;
  onCreateGroupChat: (postId: string) => void;
  onLeaveOneOnOneChat: (chatId: string) => void;
  onLeaveGroupChat: (chatId: string) => void;
}

type SelectedChat = 
  | { type: "one-on-one"; chat: OneOnOneChat; post: Post }
  | { type: "group"; chat: GroupChat }
  | null;

type TabType = "personal" | "group";

export function ChatSlideModal({
  isOpen,
  onClose,
  oneOnOneChats,
  groupChats,
  allPosts,
  myApplications,
  receivedApplications,
  approvedApplicants,
  onSendOneOnOneMessage,
  onSendGroupMessage,
  onCreateOneOnOneChat,
  onCreateGroupChat,
  onLeaveOneOnOneChat,
  onLeaveGroupChat,
}: ChatSlideModalProps): JSX.Element | null {
  const [selectedChat, setSelectedChat] = useState<SelectedChat>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showNewChatList, setShowNewChatList] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // 새 채팅 가능한 목록
  const getAvailableChats = () => {
    const available: Array<{
      type: "sent" | "received" | "group";
      postId: string;
      post: Post;
      otherUser?: { name: string; email: string; avatar: string };
      groupMembers?: number;
    }> = [];

    myApplications.forEach(app => {
      const post = getPostInfo(app.postId);
      if (!post) return;
      const hasChat = oneOnOneChats.some(
        chat => chat.postId === app.postId && chat.applicantId === CURRENT_USER.email
      );
      if (!hasChat) {
        available.push({
          type: "sent",
          postId: app.postId,
          post,
          otherUser: { name: post.author.name, email: post.author.email, avatar: post.author.avatar }
        });
      }
    });

    receivedApplications.forEach(app => {
      const post = getPostInfo(app.postId);
      if (!post) return;
      const hasChat = oneOnOneChats.some(
        chat => chat.postId === app.postId && chat.postAuthorId === CURRENT_USER.email && chat.applicantId === app.applicant.email
      );
      if (!hasChat) {
        available.push({
          type: "received",
          postId: app.postId,
          post,
          otherUser: { name: app.applicant.name, email: app.applicant.email, avatar: app.applicant.avatar }
        });
      }
    });

    const myPostIds = allPosts.filter(p => p.author.email === CURRENT_USER.email).map(p => p.id);
    myPostIds.forEach(postId => {
      const approvedAppsForPost = receivedApplications.filter(
        app => app.postId === postId && approvedApplicants.includes(app.id)
      );
      if (approvedAppsForPost.length > 0) {
        const hasGroupChat = groupChats.some(chat => chat.postId === postId);
        if (!hasGroupChat) {
          const post = getPostInfo(postId);
          if (post) {
            available.push({
              type: "group",
              postId,
              post,
              groupMembers: approvedAppsForPost.length + 1
            });
          }
        }
      }
    });

    return available;
  };

  const availableChats = getAvailableChats();
  const availablePersonalChats = availableChats.filter(c => c.type !== "group");
  const availableGroupChats = availableChats.filter(c => c.type === "group");

  const handleCreateNewChat = (item: typeof availableChats[0]) => {
    if (item.type === "group") {
      onCreateGroupChat(item.postId);
      setShowNewChatList(false);
      setTimeout(() => {
        const newGroupChat = groupChats.find(chat => chat.postId === item.postId);
        if (newGroupChat) {
          setSelectedChat({ type: "group", chat: newGroupChat });
        }
      }, 100);
    } else if (item.otherUser) {
      onCreateOneOnOneChat(item.postId, item.otherUser.email);
      setShowNewChatList(false);
      setTimeout(() => {
        const newChat = oneOnOneChats.find(
          chat => chat.postId === item.postId && 
          (chat.applicantId === item.otherUser!.email || chat.postAuthorId === item.otherUser!.email)
        );
        if (newChat) {
          const post = getPostInfo(item.postId);
          if (post) {
            setSelectedChat({ type: "one-on-one", chat: newChat, post });
          }
        }
      }, 100);
    }
  };

  const handleLeaveChat = (chatId: string, type: "personal" | "group", chatName: string) => {
    if (window.confirm(`"${chatName}" 채팅방을 나가시겠습니까?`)) {
      if (type === "personal") {
        onLeaveOneOnOneChat(chatId);
      } else {
        onLeaveGroupChat(chatId);
      }
      
      // 현재 선택된 채팅이면 선택 해제
      if (selectedChat && 
          ((selectedChat.type === "one-on-one" && selectedChat.chat.id === chatId) ||
           (selectedChat.type === "group" && selectedChat.chat.id === chatId))) {
        setSelectedChat(null);
      }
    }
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

  const allChatsEmpty = oneOnOneChats.length === 0 && groupChats.length === 0;

  return (
    <>
      {/* 배경 오버레이 */}
      <div className={styles.overlay} onClick={handleClose} />

      {/* 슬라이드 패널 */}
      <div className={`${styles.slidePanel} ${isClosing ? styles.closing : ""}`}>
        {!selectedChat ? (
          // 채팅 목록
          <>
            <div className={styles.header}>
              <h2 className={styles.headerTitle}>
                <MessageSquare size={24} />
                채팅
              </h2>
              <button onClick={handleClose} className={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>

            {/* 탭 */}
            <div className={styles.tabContainer}>
              <button
                onClick={() => setActiveTab("personal")}
                className={`${styles.tab} ${activeTab === "personal" ? styles.tabActive : ""}`}
              >
                <MessageSquare size={18} />
                개인 채팅 ({oneOnOneChats.length})
              </button>
              <button
                onClick={() => setActiveTab("group")}
                className={`${styles.tab} ${activeTab === "group" ? styles.tabActive : ""}`}
              >
                <Users size={18} />
                단체 채팅 ({groupChats.length})
              </button>
            </div>

            <div className={styles.content}>
              {allChatsEmpty && availableChats.length === 0 ? (
                <div className={styles.emptyState}>
                  <MessageSquare className={styles.emptyIcon} />
                  <p className={styles.emptyTitle}>채팅이 없습니다</p>
                  <p className={styles.emptyText}>메이트 신청을 해보세요</p>
                </div>
              ) : (
                <div className={styles.chatList}>
                  {/* 새 채팅 시작 버튼 */}
                  {((activeTab === "personal" && availablePersonalChats.length > 0) ||
                    (activeTab === "group" && availableGroupChats.length > 0)) && (
                    <button
                      onClick={() => setShowNewChatList(!showNewChatList)}
                      className={styles.newChatBtn}
                    >
                      <Plus size={20} />
                      새 채팅 시작하기 (
                      {activeTab === "personal" ? availablePersonalChats.length : availableGroupChats.length})
                    </button>
                  )}

                  {/* 새 채팅 목록 */}
                  {showNewChatList && (
                    <div className={styles.newChatList}>
                      <div className={styles.sectionTitle}>새로 시작할 수 있는 채팅</div>
                      {(activeTab === "personal" ? availablePersonalChats : availableGroupChats).map((item, idx) => (
                        <div
                          key={`${item.type}-${item.postId}-${idx}`}
                          onClick={() => handleCreateNewChat(item)}
                          className={styles.newChatCard}
                        >
                          <div className={styles.chatCardContent}>
                            {item.type === "group" ? (
                              <div className={`${styles.avatar} ${styles.avatarPurple}`}>
                                <Users size={24} />
                              </div>
                            ) : (
                              <div className={`${styles.avatar} ${styles.avatarPink}`}>
                                {item.otherUser?.avatar || "👤"}
                              </div>
                            )}
                            <div className={styles.chatInfo}>
                              <div className={styles.chatHeader}>
                                <span className={styles.chatName}>
                                  {item.type === "group" ? `${item.post.destination} 여행` : item.otherUser?.name}
                                </span>
                              </div>
                              <div className={styles.chatLocation}>📍 {item.post.destination}</div>
                              <div>
                                <span className={`${styles.badge} ${item.type === "sent" ? styles.badgeBlue : item.type === "received" ? styles.badgeGreen : styles.badgePurple}`}>
                                  {item.type === "sent" ? "내가 신청" : item.type === "received" ? "신청 받음" : `${item.groupMembers}명`}
                                </span>
                                <span className={`${styles.badge} ${styles.badgeYellow}`}>NEW</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 구분선 */}
                  {((activeTab === "personal" && availablePersonalChats.length > 0 && oneOnOneChats.length > 0) ||
                    (activeTab === "group" && availableGroupChats.length > 0 && groupChats.length > 0)) && (
                    <>
                      <div className={styles.divider} />
                      <div className={styles.sectionTitle}>진행 중인 채팅</div>
                    </>
                  )}

                  {/* 개인 채팅 목록 */}
                  {activeTab === "personal" && oneOnOneChats.map((chat) => {
                    const post = getPostInfo(chat.postId);
                    const isMyChat = chat.applicantId === CURRENT_USER.email;
                    const otherUser = isMyChat ? post?.author : null;
                    const lastMessage = chat.messages[chat.messages.length - 1];

                    return (
                      <div key={chat.id} className={styles.chatCard}>
                        <div className={styles.chatCardContent} onClick={() => handleSelectOneOnOne(chat)}>
                          <div className={`${styles.avatar} ${styles.avatarPink}`}>
                            {otherUser?.avatar || "👤"}
                          </div>
                          <div className={styles.chatInfo}>
                            <div className={styles.chatHeader}>
                              <span className={styles.chatName}>{otherUser?.name || "Unknown"}</span>
                              <span className={styles.chatTime}>{formatLastMessageTime(chat.lastMessageAt)}</span>
                            </div>
                            <div className={styles.chatLocation}>📍 {post?.destination || "Unknown"}</div>
                            {lastMessage && <div className={styles.chatMessage}>{lastMessage.content}</div>}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveChat(chat.id, "personal", otherUser?.name || "Unknown");
                          }}
                          className={styles.leaveBtn}
                          title="채팅방 나가기"
                        >
                          <LogOut size={18} />
                        </button>
                      </div>
                    );
                  })}

                  {/* 단체 채팅 목록 */}
                  {activeTab === "group" && groupChats.map((chat) => {
                    const lastMessage = chat.messages[chat.messages.length - 1];

                    return (
                      <div key={chat.id} className={styles.chatCard}>
                        <div className={styles.chatCardContent} onClick={() => handleSelectGroup(chat)}>
                          <div className={`${styles.avatar} ${styles.avatarPurple}`}>
                            <Users size={24} />
                          </div>
                          <div className={styles.chatInfo}>
                            <div className={styles.chatHeader}>
                              <span className={styles.chatName}>{chat.postDestination} 여행</span>
                              <span className={styles.chatTime}>{formatLastMessageTime(chat.lastMessageAt)}</span>
                            </div>
                            <div className={styles.chatLocation}>👥 {chat.members.length}명</div>
                            {lastMessage && (
                              <div className={styles.chatMessage}>
                                <strong>{lastMessage.senderName}:</strong> {lastMessage.content}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveChat(chat.id, "group", `${chat.postDestination} 여행`);
                          }}
                          className={styles.leaveBtn}
                          title="채팅방 나가기"
                        >
                          <LogOut size={18} />
                        </button>
                      </div>
                    );
                  })}

                  {/* 탭별 빈 상태 */}
                  {activeTab === "personal" && oneOnOneChats.length === 0 && availablePersonalChats.length === 0 && (
                    <div className={styles.emptyState}>
                      <MessageSquare className={styles.emptyIcon} />
                      <p className={styles.emptyTitle}>개인 채팅이 없습니다</p>
                      <p className={styles.emptyText}>메이트에게 신청해보세요</p>
                    </div>
                  )}
                  {activeTab === "group" && groupChats.length === 0 && availableGroupChats.length === 0 && (
                    <div className={styles.emptyState}>
                      <Users className={styles.emptyIcon} />
                      <p className={styles.emptyTitle}>단체 채팅이 없습니다</p>
                      <p className={styles.emptyText}>신청을 승인하고 그룹을 만들어보세요</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          // 채팅 화면 (동일)
          <>
            <div className={styles.header}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {selectedChat.type === "one-on-one" ? (
                  <>
                    <div className={`${styles.avatar} ${styles.avatarPink}`} style={{ width: "40px", height: "40px", fontSize: "20px" }}>
                      {selectedChat.post.author.avatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "16px" }}>{selectedChat.post.author.name}</div>
                      <div style={{ fontSize: "13px", opacity: 0.8 }}>📍 {selectedChat.post.destination}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`${styles.avatar} ${styles.avatarPurple}`} style={{ width: "40px", height: "40px" }}>
                      <Users size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "16px" }}>{selectedChat.chat.postDestination} 여행</div>
                      <div style={{ fontSize: "13px", opacity: 0.8 }}>👥 {selectedChat.chat.members.length}명</div>
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setSelectedChat(null)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#eff6ff" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {(selectedChat.type === "one-on-one" ? selectedChat.chat.messages : selectedChat.chat.messages).map((msg) => {
                  const isMyMessage = msg.senderId === CURRENT_USER.email;

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
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="메시지 입력..."
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "2px solid black",
                    fontFamily: "monospace",
                    fontSize: "14px"
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  style={{
                    padding: "12px 16px",
                    background: "#fbbf24",
                    border: "2px solid black",
                    cursor: messageInput.trim() ? "pointer" : "not-allowed",
                    boxShadow: "3px 3px 0 0 black",
                    opacity: messageInput.trim() ? 1 : 0.5
                  }}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}