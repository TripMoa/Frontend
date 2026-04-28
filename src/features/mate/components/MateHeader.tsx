import { PenSquare, Inbox, User } from "lucide-react";
import { ActionPromptModal } from "../../../shared/components";
import { useAccessGuard } from "../../../shared/hooks";
import { useUserProfile } from "../../user/hooks";
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

  const { profile } = useUserProfile();

  const {
    showLoginModal,
    showAdultModal,
    closeLoginModal,
    closeAdultModal,
    moveToLogin,
    moveToMypageForVerification,
    requireLogin,
    requireAdultVerified,
  } = useAccessGuard(profile);

  const handleWriteClick = () => {
    if (requireAdultVerified()) onWriteClick();
  };

  const handleMySentClick = () => {
    if (requireLogin()) onMySentClick();
  };

  const handleReceivedClick = () => {
    if (requireLogin()) onReceivedClick();
  };

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
            onClick={handleWriteClick}
          >
            <PenSquare className="w-4 h-4" />
            WRITE
          </button>

          <button 
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 transition-colors font-bold text-sm uppercase tracking-wide relative button"
            onClick={handleMySentClick}
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
            onClick={handleReceivedClick}
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

    <ActionPromptModal
      open={showLoginModal}
      title=">> LOGIN REQUIRED"
      headline="Members Only"
      description="이 기능은 로그인 후 이용할 수 있습니다"
      cancelText="취소"
      confirmText="로그인"
      onClose={closeLoginModal}
      onConfirm={moveToLogin}
    />

    <ActionPromptModal
      open={showAdultModal}
      title=">> PROFILE INCOMPLETE"
      headline="Complete Your Profile"
      description="성인 인증이 필요한 서비스입니다."
      cancelText="닫기"
      confirmText="프로필 설정하기"
      onClose={closeAdultModal}
      onConfirm={moveToMypageForVerification}
    />
    </>
  );
}