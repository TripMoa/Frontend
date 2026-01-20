// components/mate/ChatFAB.tsx

import { MessageSquare } from "lucide-react";
import "../../styles/ChatFAB.css";

interface ChatFABProps {
  onClick: () => void;
  unreadCount?: number;
}

export function ChatFAB({ onClick, unreadCount = 0 }: ChatFABProps): JSX.Element {
  return (
    <button className="chat-fab-fabBtn" onClick={onClick}>
      {unreadCount > 0 && (
        <span className="chat-fab-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
      )}
      <MessageSquare className="chat-fab-fabIcon" />
      <span className="chat-fab-fabText">CHAT</span>
    </button>
  );
}