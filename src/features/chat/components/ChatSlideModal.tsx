import { useState, useEffect, useRef } from "react";
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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setSelectedChat(null);
    }, 300);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  useEffect(() => {
    if (selectedChat) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedChat?.chat.messages]);

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

  const today = new Date(new Date().toDateString());
  const isEnded = (endDate: string) => new Date(endDate) < today;

  const avatarOf = (profileImage: string | null, avatarEmoji: string | null, small = false) => (
    <span className={`chat-av ${small ? "chat-av--sm" : ""}`} aria-hidden="true">
      <AvatarDisplay avatar={getApplicantAvatar(profileImage, avatarEmoji)} />
    </span>
  );

  const badgeOf = (type: "sent" | "received") => (
    <span className={`chat-bd ${type === "sent" ? "chat-bd--info" : "chat-bd--ok"}`}>
      {type === "sent" ? "내가 신청" : "신청 받음"}
    </span>
  );

  const renderAvailableRow = (item: typeof availableChats[0], idx: number) => (
    <div
      key={`${item.type}-${item.postId}-${idx}`}
      className="chat-rm"
      role="button"
      tabIndex={0}
      onClick={() => handleCreateNewChat(item)}
      onKeyDown={(e) => { if (e.key === "Enter") handleCreateNewChat(item); }}
    >
      <span className="chat-rm__av">{avatarOf(null, item.otherUser.avatarEmoji)}</span>
      <div className="chat-rm__in">
        <div className="chat-rm__name"><span>{item.otherUser.name}</span>{badgeOf(item.type)}</div>
        <span className="chat-rm__last">📍 {item.destination} · {item.startDate} – {item.endDate}</span>
      </div>
      <span className="chat-x chat-x--plain">시작 ›</span>
    </div>
  );

  const isExpiredChat = !!selectedChat && isEnded(selectedChat.post.endDate);

  return (
    <>
    <div
      className={`chat-panel ${isClosing ? "is-closing" : ""}`}
      role="dialog"
      aria-label="채팅"
    >
      {!selectedChat ? (
        <>
          <div className="chat-h">
            <span className="chat-h__t">채팅</span>
            <button type="button" onClick={handleClose} className="chat-x">닫기</button>
          </div>

          {oneOnOneChats.length > 0 && (
            <div className="chat-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "active"}
                onClick={() => setActiveTab("active")}
                className={`chat-tab ${activeTab === "active" ? "is-on" : ""}`}
              >
                대화 중 {oneOnOneChats.length}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "available"}
                onClick={() => setActiveTab("available")}
                className={`chat-tab ${activeTab === "available" ? "is-on" : ""}`}
              >
                시작 가능 {availableChats.length}
              </button>
            </div>
          )}

          <div className="chat-lst">
            {allChatsEmpty && availableChats.length === 0 ? (
              <div className="chat-empty">
                <span className="chat-empty__icon" aria-hidden="true">💬</span>
                <b>아직 채팅이 없어요</b>
                동행 신청이 승인되면 여기서 대화할 수 있어요
              </div>
            ) : oneOnOneChats.length === 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowNewChatList(!showNewChatList)}
                  className="chat-new"
                  aria-expanded={showNewChatList}
                >
                  + 새 채팅 시작하기 ({availableChats.length})
                </button>
                {showNewChatList ? (
                  availableChats.map(renderAvailableRow)
                ) : (
                  <div className="chat-empty">
                    <b>위 버튼을 눌러</b>
                    승인한 동행과 채팅을 시작해 보세요
                  </div>
                )}
              </>
            ) : activeTab === "active" ? (
              oneOnOneChats.map((chat) => {
                const post = getPostInfo(chat);
                const otherUser = getOtherUser(chat);
                const lastMessage = chat.messages[chat.messages.length - 1];

                return (
                  <div
                    key={chat.id}
                    className="chat-rm"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectOneOnOne(chat)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSelectOneOnOne(chat); }}
                  >
                    <span className="chat-rm__av">
                      {avatarOf(otherUser.profileImage, otherUser.avatarEmoji)}
                      {!isEnded(post.endDate) && <span className="chat-dot" aria-hidden="true" />}
                    </span>
                    <div className="chat-rm__in">
                      <div className="chat-rm__name">
                        <span>{otherUser.name}</span>
                        {badgeOf(chat.postAuthorId === userId ? "received" : "sent")}
                      </div>
                      <span className="chat-rm__last">📍 {post.destination} · {post.startDate} – {post.endDate}</span>
                      {lastMessage && <span className="chat-rm__last chat-rm__last--ink">{lastMessage.content}</span>}
                    </div>
                    <div className="chat-rm__side">
                      <span className="chat-rm__time">{formatLastMessageTime(chat.lastMessageAt)}</span>
                      {chat.unreadCount > 0 && (
                        <span className="chat-un" aria-label={`안 읽은 메시지 ${chat.unreadCount}개`}>
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveChat(chat.id, otherUser.name);
                      }}
                      className="chat-x chat-x--neg"
                    >
                      나가기
                    </button>
                  </div>
                );
              })
            ) : availableChats.length === 0 ? (
              <div className="chat-empty">
                <b>새로 시작할 채팅이 없어요</b>
                승인한 동행과는 모두 대화 중이에요
              </div>
            ) : (
              availableChats.map(renderAvailableRow)
            )}
          </div>

          <div className="chat-ft">채팅방을 선택하면 대화가 열려요 · 신고하기는 대화방 안에서</div>
        </>
      ) : (
        (() => {
          const otherUser = getOtherUser(selectedChat.chat);
          const myId = selectedChat.chat.postAuthor.id === userId
            ? selectedChat.chat.postAuthor.id
            : selectedChat.chat.applicant.id;

          return (
            <>
              <div className="chat-h">
                <button type="button" className="chat-x chat-x--back" onClick={() => setSelectedChat(null)} aria-label="채팅 목록으로">‹</button>
                {avatarOf(otherUser.profileImage, otherUser.avatarEmoji, true)}
                <span className="chat-h__t chat-h__t--room">
                  {otherUser.name}
                  <small>📍 {selectedChat.post.destination}</small>
                </span>
                <button type="button" className="chat-x chat-x--neg" onClick={() => setShowReport(true)}>신고</button>
                <button type="button" className="chat-x" onClick={handleClose}>닫기</button>
              </div>

              {isExpiredChat && (
                <div className="chat-ex">🕊️ 여행 기간이 종료되었습니다 · 이 채팅방은 더 이상 메시지를 보낼 수 없어요</div>
              )}

              <div className="chat-ms">
                {selectedChat.chat.messages.map((msg) => {
                  if (msg.type === "LEAVE" || msg.type === "SYSTEM") {
                    return <div key={msg.id} className="chat-sy">{msg.content}</div>;
                  }

                  const isMyMessage = msg.senderId === myId;

                  return (
                    <div key={msg.id} className={`chat-mg ${isMyMessage ? "chat-mg--me" : ""}`}>
                      <span className="chat-mg__nm" title={isMyMessage ? undefined : msg.senderName}>
                        {isMyMessage ? "나" : msg.senderName}
                      </span>
                      <span className="chat-mg__text"><span>{msg.content}</span></span>
                      <time className="chat-mg__time">{formatTime(msg.timestamp)}</time>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-sd">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isExpiredChat && handleSendMessage()}
                  placeholder={isExpiredChat ? "종료된 채팅방입니다" : "메시지 입력..."}
                  disabled={isExpiredChat}
                  aria-label="메시지 입력"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isExpiredChat}
                >
                  보내기
                </button>
              </div>
            </>
          );
        })()
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