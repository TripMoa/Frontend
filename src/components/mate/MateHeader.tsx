import { PenSquare, Inbox, User, MessageSquare } from "lucide-react";
import "../../styles/mate/MateHeader.css";

interface MateHeaderProps {
  onWriteClick: () => void;
  onMySentClick: () => void;
  onReceivedClick: () => void;
  mySentCount: number;
  receivedPendingCount: number;
  onChatListClick: () => void;
  unreadChatCount?: number;
}

export function MateHeader({ 
  onWriteClick, 
  onMySentClick, 
  onReceivedClick, 
  onChatListClick,
  mySentCount, 
  receivedPendingCount,
  unreadChatCount = 0, 
}: MateHeaderProps): JSX.Element {
  return (
    <div className="header">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-[32px] font-black font-mono uppercase tracking-wide leading-tight">
          FIND YOUR TRAVEL COMPANION
        </h1>

        <div className="flex gap-3">
          <button 
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 transition-colors font-bold text-sm uppercase tracking-wide button"
            onClick={onWriteClick}
          >
            <PenSquare className="w-4 h-4" />
            WRITE
          </button>

          <button 
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 transition-colors font-bold text-sm uppercase tracking-wide relative button"
            onClick={onMySentClick}
          >
            <Inbox className="w-4 h-4" />
            MY SENT
            {mySentCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs w-5 h-5 flex items-center justify-center font-bold">
                {mySentCount}
              </span>
            )}
          </button>

          <button 
            className="flex items-center gap-2 px-5 py-2.5 transition-colors font-bold text-sm uppercase tracking-wide relative button buttonDark"
            onClick={onReceivedClick}
          >
            <User className="w-4 h-4" />
            RECEIVED
            {receivedPendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center font-bold">
                {receivedPendingCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}