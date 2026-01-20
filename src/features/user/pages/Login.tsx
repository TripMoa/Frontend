import React from 'react';
import { TicketLayout } from '../components/common/TicketLayout';
import { TicketInfo } from '../components/common/TicketInfo';
import { LoginForm } from '../components/LoginForm';

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
      rightContent={<LoginForm />}
    />
  );
};

export default Login;