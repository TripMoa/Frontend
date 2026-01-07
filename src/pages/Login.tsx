import React from 'react';
import { TicketLayout, TicketInfo, LoginForm } from '../components/user';

const Login: React.FC = () => {
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
        <LoginForm socialOnly />
      }
    />
  );
};

export default Login;
