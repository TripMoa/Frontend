import { useEffect, useState } from "react";
import { Shield, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserSetting";
import { MODAL_MESSAGES } from "../hooks/User.constant";
import styles from "../styles/UserSetting.module.css";

import MyInfoTab from "../components/MyInfoTab";
import AccountSettingsTab from "../components/AccountSettingsTab";
import ReportManagementTab from "../components/ReportManagementTab";
import VerifyModal from "../components/modal/VerifyModal";
import DeleteAccountModal from "../components/modal/DeleteAccountModal";
import { ActionPromptModal } from "../../../shared/components/ActionPromptModal";

const TABS = ["내 정보", "계정 및 설정", "신고 관리"] as const;
type TabType = (typeof TABS)[number];

export default function UserSettings() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialTab: TabType =
    location.state?.activeTab === "계정 및 설정" ? "계정 및 설정" : "내 정보";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBirthDateModal, setShowBirthDateModal] = useState(false);

  const [saveConfirmModal, setSaveConfirmModal] = useState({
    open: false,
    description: "",
  });

  const [leaveConfirmModal, setLeaveConfirmModal] = useState(false);

  const [noticeModal, setNoticeModal] = useState<{
    open: boolean;
    title: string;
    headline: string;
    description: string;
    onConfirm?: () => void;
  }>({
    open: false,
    title: "",
    headline: "",
    description: "",
  });

  const showNotice = (
    title: string,
    headline: string,
    description: string,
    onConfirm?: () => void,
  ) => {
    setNoticeModal({ open: true, title, headline, description, onConfirm });
  };

  const closeNotice = () => {
    const onConfirm = noticeModal.onConfirm;
    setNoticeModal((prev) => ({ ...prev, open: false, onConfirm: undefined }));
    onConfirm?.();
  };

  const {
    profile,
    updateProfile,
    savedAgeStatus,
    savedBirthDate,
    hasChanges,
    isSaving,
    isFormValid,
    isEmailValid,
    isBirthValid,
    MBTI_TYPES,
    saveProfile,
    regenerateAvatar,
    triggerPhotoUpload,
    toggleTravelStyle,
    verify,
    deleteAccount,
    fileInputRef,
    handlePhotoChange,
    travelStyleOptions,
    calculateAge,
  } = useUserProfile();

  useEffect(() => {
    if (location.state?.activeTab === "계정 및 설정") {
      setActiveTab("계정 및 설정");
      navigate(location.pathname, {
        replace: true,
        state: {
          closeTo: location.state?.closeTo,
        },
      });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasChanges) return;

      e.preventDefault();
      e.returnValue = "저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  const executeSave = async () => {
    const success = await saveProfile();

    if (success) {
      showNotice(
        "저장 완료",
        "변경사항이 저장되었습니다",
        MODAL_MESSAGES.SAVE.SUCCESS,
      );
    } else {
      showNotice(
        "저장 실패",
        "저장에 실패했습니다",
        "저장에 실패했습니다. 다시 시도해주세요.",
      );
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    const willBeLocked: string[] = [];
    if (!profile.nameLocked && profile.name) willBeLocked.push("이름");
    if (!profile.genderLocked && profile.gender) willBeLocked.push("성별");
    if (!profile.birthLocked && profile.birthDate) {
      willBeLocked.push("생년월일");
    }

    if (willBeLocked.length > 0) {
      setSaveConfirmModal({
        open: true,
        description: `${willBeLocked.join(
          ", ",
        )} 정보는 저장 후 수정이 불가능합니다. 정말 저장하시겠습니까?`,
      });
      return;
    }

    await executeSave();
  };

  const handleVerify = async () => {
    if (!profile) return;

    const result = await verify();

    if (result === "NEED_BIRTH_DATE") {
      setShowVerifyModal(false);
      setShowBirthDateModal(true);
      return;
    }

    if (result === "UNDERAGE") {
      setShowVerifyModal(false);
      showNotice(
        "이용 불가",
        "이용 연령 제한",
        "만 19세 미만은 서비스를 이용할 수 없습니다.",
      );
      return;
    }

    if (result === "SUCCESS") {
      setShowVerifyModal(false);
      showNotice(
        "인증 완료",
        "성인 인증이 완료되었습니다",
        MODAL_MESSAGES.VERIFY.SUCCESS,
      );
      return;
    }

    if (result === "FAIL") {
      setShowVerifyModal(false);
      showNotice(
        "인증 실패",
        "성인 인증에 실패했습니다",
        "성인 인증 처리에 실패했습니다. 다시 시도해주세요.",
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      navigate("/login", { replace: true });
    } catch (error: any) {
      setShowDeleteModal(false);

      const message =
        error?.response?.data?.message ||
        "정산이 완료되지 않은 여행 또는 지출/입금 내역이 있어 회원 탈퇴를 진행할 수 없습니다.";

      showNotice("탈퇴 불가", "회원 탈퇴를 진행할 수 없습니다", message);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setLeaveConfirmModal(true);
      return;
    }

    navigate(location.state?.closeTo ?? "/", { replace: true });
  };

  if (!profile) {
    return (
      <div className={styles.page}>
        <div className={styles.ticket}>
          <p style={{ textAlign: "center", padding: "40px" }}>
            프로필 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  const isUnderage =
    savedAgeStatus === "UNDERAGE" ||
    (savedAgeStatus === "UNVERIFIED" &&
      !!savedBirthDate &&
      calculateAge(savedBirthDate) < 19);

  return (
    <div className={styles.page}>
      <div className={styles.ticket}>
        <div className={styles.header}>
          {savedAgeStatus === "VERIFIED" && (
            <div className={styles.verifiedBadge}>
              <Shield size={14} />
              <span>인증 완료</span>
            </div>
          )}

          {isUnderage && (
            <div className={styles.restrictedBadge}>
              <Shield size={14} />
              <span>이용 제한</span>
            </div>
          )}
          <button
            className={styles.closeButton}
            onClick={handleClose}
            title="닫기"
            type="button"
          >
            <X size={24} />
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>MY PAGE</h1>

            <div className={styles.tabContainer}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.tabItem} ${
                    activeTab === tab ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === "내 정보" && (
          <MyInfoTab
            profile={profile}
            updateProfile={updateProfile}
            isEmailValid={isEmailValid}
            isBirthValid={isBirthValid}
            MBTI_TYPES={MBTI_TYPES}
            regenerateAvatar={regenerateAvatar}
            triggerPhotoUpload={triggerPhotoUpload}
            toggleTravelStyle={toggleTravelStyle}
            fileInputRef={fileInputRef}
            handlePhotoChange={handlePhotoChange}
            travelStyleOptions={travelStyleOptions}
          />
        )}

        {activeTab === "내 정보" && hasChanges && (
          <button
            type="button"
            className={`${styles.saveButton} ${isSaving ? styles.saving : ""}`}
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? "저장 중..." : "변경사항 저장"}
          </button>
        )}

        {activeTab === "계정 및 설정" && (
          <AccountSettingsTab
            profile={profile}
            onOpenVerifyModal={() => setShowVerifyModal(true)}
            onOpenBirthDateModal={() => setShowBirthDateModal(true)}
            onOpenDeleteModal={() => setShowDeleteModal(true)}
          />
        )}

        {activeTab === "신고 관리" && <ReportManagementTab />}
      </div>

      <VerifyModal
        open={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onConfirm={handleVerify}
      />

      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />

      <ActionPromptModal
        open={showBirthDateModal}
        title="생년월일 입력 필요"
        headline="생년월일을 먼저 입력해주세요"
        description="성인 인증을 위해 프로필에 생년월일을 먼저 등록해야 합니다."
        cancelText="취소"
        confirmText="내 정보"
        onClose={() => setShowBirthDateModal(false)}
        onConfirm={() => {
          setShowBirthDateModal(false);
          setActiveTab("내 정보");
        }}
      />

      <ActionPromptModal
        open={noticeModal.open}
        title={noticeModal.title}
        headline={noticeModal.headline}
        description={noticeModal.description}
        confirmText="확인"
        hideCancel
        onClose={closeNotice}
        onConfirm={closeNotice}
      />

      <ActionPromptModal
        open={saveConfirmModal.open}
        title="저장 확인"
        headline="저장 후 수정할 수 없는 정보가 있습니다"
        description={saveConfirmModal.description}
        cancelText="취소"
        confirmText="저장"
        onClose={() => setSaveConfirmModal({ open: false, description: "" })}
        onConfirm={async () => {
          setSaveConfirmModal({ open: false, description: "" });
          await executeSave();
        }}
      />

      <ActionPromptModal
        open={leaveConfirmModal}
        title="나가기 확인"
        headline="저장하지 않은 변경사항이 있습니다"
        description="수정 중인 변경사항이 있습니다. 저장하지 않고 나가시겠습니까?"
        cancelText="취소"
        confirmText="나가기"
        onClose={() => setLeaveConfirmModal(false)}
        onConfirm={() => {
          setLeaveConfirmModal(false);
          navigate(location.state?.closeTo ?? "/", { replace: true });
        }}
      />
    </div>
  );
}
