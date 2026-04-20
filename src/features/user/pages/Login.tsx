import React, { useEffect } from "react";
import { TicketLayout } from "../components/common/TicketLayout";
import { TicketInfo } from "../components/common/TicketInfo";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../../../features/user/pages/AuthContext";

const Login: React.FC = () => {
  const { logoutMessage, clearLogoutMessage } = useAuth();

  useEffect(() => {
    if (!logoutMessage) return;

    alert(logoutMessage);
    clearLogoutMessage();
  }, [logoutMessage, clearLogoutMessage]);

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
      rightContent={<LoginForm />}
    />
  );
};

export default Login;
