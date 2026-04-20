import { PenSquare, Inbox, User } from "lucide-react";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { LoginPromptModal } from "./LoginPromptModal";
import "../styles/MateHeader.css";

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
  mySentCount, 
  receivedPendingCount,
}: MateHeaderProps){

  const { withLoginCheck, showLoginModal, closeLoginModal, goToLogin } = useAuthGuard();

  return (
    <>
    <div className="header">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-[32px] font-black font-mono uppercase tracking-wide leading-tight">
          FIND YOUR TRAVEL COMPANION
        </h1>

        <div className="flex gap-3">
          <button 
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 transition-colors font-bold text-sm uppercase tracking-wide button"
            onClick={() => withLoginCheck(onWriteClick)}
          >
            <PenSquare className="w-4 h-4" />
            WRITE
          </button>

          <button 
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 transition-colors font-bold text-sm uppercase tracking-wide relative button"
            onClick={() => withLoginCheck(onMySentClick)}
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
            onClick={() => withLoginCheck(onReceivedClick)}
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

    {showLoginModal && (
      <LoginPromptModal onClose={closeLoginModal} onLogin={goToLogin} />
    )}
    </>
  );
}