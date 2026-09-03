import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/user/pages/AuthContext";
import type { AgeVerificationStatus } from "../../types";

interface AccessGuardProfile {
  ageVerified?: boolean;
  ageVerificationStatus?: AgeVerificationStatus;
}

export function useAccessGuard(profile?: AccessGuardProfile | null) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdultModal, setShowAdultModal] = useState(false);
  const [showUnderageModal, setShowUnderageModal] = useState(false);

  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false);
  }, []);

  const closeAdultModal = useCallback(() => {
    setShowAdultModal(false);
  }, []);

  const closeUnderageModal = useCallback(() => {
    setShowUnderageModal(false);
  }, []);

  const moveToLogin = useCallback(() => {
    setShowLoginModal(false);
    navigate("/login");
  }, [navigate]);

  const moveToMypageForVerification = useCallback(() => {
    setShowAdultModal(false);
    navigate("/setting");
  }, [navigate]);

  // 비로그인 상태에서 로그인 필요한 경우
  const requireLogin = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return false;
    }
    return true;
  }, [isAuthenticated]);

  // 로그인 상태에서 성인 인증 필요한 경우 (미성년자 차단 + 인증 안된 성인)
  const requireAdultVerified = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return false;
    }

    // 미성년자 먼저 차단
    if (profile?.ageVerificationStatus === "UNDERAGE") {
      setShowUnderageModal(true);
      return false;
    }

    // 인증 안된 성인
    if (!profile?.ageVerified) {
      setShowAdultModal(true);
      return false;
    }

    return true;
  }, [isAuthenticated, profile]);

  return {
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
  };
}
