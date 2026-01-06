// components/mate/ChatFAB.tsx

import { MessageSquare } from "lucide-react";
import styles from "../../../styles/mate/ChatFAB.module.css";

interface ChatFABProps {
  onClick: () => void;
  unreadCount?: number;
}

export function ChatFAB({ onClick, unreadCount = 0 }: ChatFABProps): JSX.Element {
  return (
    <button className={styles.fabBtn} onClick={onClick}>
      {unreadCount > 0 && (
        <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
      )}
      <MessageSquare className={styles.fabIcon} />
      <span className={styles.fabText}>CHAT</span>
    </button>
  );
}