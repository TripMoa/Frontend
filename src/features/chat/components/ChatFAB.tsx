import "../styles/ChatSlide.css";

interface ChatFABProps {
  onClick: () => void;
  unreadCount?: number;
}

export function ChatFAB({ onClick, unreadCount = 0 }: ChatFABProps){
  return (
    <button type="button" className="chat-fab" onClick={onClick}>
      채팅
      {unreadCount > 0 && (
        <span className="chat-un">{unreadCount > 99 ? "99+" : unreadCount}</span>
      )}
    </button>
  );
}
