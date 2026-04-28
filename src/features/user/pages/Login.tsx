// src/features/user/pages/Login.tsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TicketLayout } from "../components/common/TicketLayout";
import { TicketInfo } from "../components/common/TicketInfo";
import { LoginForm } from "../components/LoginForm";
import { AccountSuspendedNotice } from "../components/AccountSuspendedNotice";

const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSuspendedNotice, setShowSuspendedNotice] = useState(false);

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

    alert("로그인에 실패했습니다.");
    navigate("/login", { replace: true });
  }, [location.search, navigate]);

  return (
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
  );
};

export default Login;
