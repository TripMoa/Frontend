import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../chat/hooks/useCurrentUser";

export function useAuthGuard() {
  const { id } = useCurrentUser();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const withLoginCheck = (callback: () => void) => {
    if (!id) {
      setShowLoginModal(true);
      return;
    }
    callback();
  };

  const closeLoginModal = () => setShowLoginModal(false);

  const goToLogin = () => {
    setShowLoginModal(false);
    navigate("/login");
  };

  return { withLoginCheck, showLoginModal, closeLoginModal, goToLogin };
}