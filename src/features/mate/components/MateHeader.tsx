import { ActionPromptModal } from "../../../shared/components";
import { useAccessGuard } from "../../../shared/hooks";
import { useUserProfile } from "../../user/hooks";

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
    showUnderageModal,
    closeLoginModal,
    closeAdultModal,
    closeUnderageModal,
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
    <div className="mate-ph">
      <div className="mate-ph__text">
        <h1 className="mate-ph__title">FIND YOUR<br />TRAVEL COMPANION</h1>
        <p className="mate-ph__desc">여행 일정이 맞는 동행을 찾아보세요 · 만 19세 이상 성인 인증 필요</p>
      </div>

      <div className="mate-ph__actions">
        <span className="mate-badge-wrap">
          <button
            type="button"
            className="mate-bt"
            onClick={handleMySentClick}
            aria-label={mySentCount > 0 ? `MY SENT, 보낸 신청 ${mySentCount}개` : undefined}
          >
            MY SENT
          </button>
          {mySentCount > 0 && <span className="mate-count mate-count--info" aria-hidden="true">{mySentCount}</span>}
        </span>
        <span className="mate-badge-wrap">
          <button
            type="button"
            className="mate-bt"
            onClick={handleReceivedClick}
            aria-label={receivedPendingCount > 0 ? `RECEIVED, 대기 중인 신청 ${receivedPendingCount}개` : undefined}
          >
            RECEIVED
          </button>
          {receivedPendingCount > 0 && <span className="mate-count" aria-hidden="true">{receivedPendingCount}</span>}
        </span>
        <button type="button" className="mate-bt mate-bt--r" onClick={handleWriteClick}>
          WRITE
        </button>
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

    <ActionPromptModal
      open={showUnderageModal}
      title=">> ACCESS DENIED"
      headline="Age Restricted"
      description="만 19세 이상만 이용할 수 있는 서비스입니다."
      cancelText="닫기"
      confirmText="확인"
      onClose={closeUnderageModal}
      onConfirm={closeUnderageModal}
    />
    
    </>
  );
}