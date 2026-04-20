// hooks/useAuthGuard.ts
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../chat/hooks/useCurrentUser";
import { getMyInfo } from "../../../api/auth.api";

export function useAuthGuard() {
  const { id } = useCurrentUser();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const withLoginCheck = (callback: () => void) => {
    if (!id) {
      setShowLoginModal(true);
      return;
    }
    callback();
  };

  const withProfileCheck = async (callback: () => void) => {
    if (!id) {
        setShowLoginModal(true);
        return;
    }

    try {
        const res = await getMyInfo();
        const { gender, birthDate } = res.data;

        if (!gender || !birthDate) {
        setShowProfileModal(true);
        return;
        }
        callback();
    } catch {
    }
    };

  const closeLoginModal = () => setShowLoginModal(false);
  const closeProfileModal = () => setShowProfileModal(false);

  const goToLogin = () => {
    setShowLoginModal(false);
    navigate("/login");
  };

  const goToProfileEdit = () => {
    setShowProfileModal(false);
    navigate("/setting");
  };

  return { withLoginCheck, showLoginModal, closeLoginModal, goToLogin,
    withProfileCheck, showProfileModal, closeProfileModal, goToProfileEdit
   };
}