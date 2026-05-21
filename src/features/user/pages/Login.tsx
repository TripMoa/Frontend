// src/features/user/pages/Login.tsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TicketLayout } from "../components/common/TicketLayout";
import { TicketInfo } from "../components/common/TicketInfo";
import { LoginForm } from "../components/LoginForm";
import { AccountSuspendedNotice } from "../components/AccountSuspendedNotice";
import { ActionPromptModal } from "../../../shared/components/ActionPromptModal";

const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSuspendedNotice, setShowSuspendedNotice] = useState(false);
  const [showLoginFailModal, setShowLoginFailModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get("error");

    if (!error) return;

    if (error === "cancelled") {
      // 취소는 조용히 처리하거나 안내 메시지만
      navigate("/login", { replace: true });
      return;
    }

    if (error === "SUSPENDED") {
      setShowSuspendedNotice(true);
      navigate("/login", { replace: true });
      return;
    }

    setShowLoginFailModal(true);
    navigate("/login", { replace: true });
  }, [location.search, navigate]);

  return (
    <>
      <TicketLayout
        leftContent={
          <TicketInfo
            fromCode="OUT"
            fromName="Offline"
            toCode="IN"
            toName="Online"
            tagline="Social login only"
          />
        }
        rightContent={
          showSuspendedNotice ? (
            <AccountSuspendedNotice
              onBack={() => {
                setShowSuspendedNotice(false);
                navigate("/login", { replace: true });
              }}
            />
          ) : (
            <LoginForm />
          )
        }
      />

      <ActionPromptModal
        open={showLoginFailModal}
        title="로그인 실패"
        headline="로그인에 실패했습니다."
        description="잠시 후 다시 시도해주세요."
        hideCancel
        confirmText="확인"
        onClose={() => setShowLoginFailModal(false)}
        onConfirm={() => setShowLoginFailModal(false)}
      />
    </>
  );
};

export default Login;
