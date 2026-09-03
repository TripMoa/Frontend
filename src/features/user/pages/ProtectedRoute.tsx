// src/features/user/pages/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

// 인증이 필요한 라우트를 보호하는 컴포넌트
const ProtectedRoute = () => {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            gap: "1.2rem",
            fontFamily: "monospace",
          }}
        >
          {/* 스피너 */}
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "2px solid rgba(255,255,255,0.1)",
              borderTop: "2px solid currentColor",
              borderRadius: "50%",
              animation: "spin 0.75s linear infinite",
            }}
          />
          {/* 상태 텍스트 */}
          <span
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              opacity: 0.5,
              animation: "blink 1.4s ease-in-out infinite",
            }}
          >
            AUTHENTICATING...
          </span>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          message: "로그인 이후 이용 가능합니다.",
        }}
      />
    );
  }

  // 로그인 상태면 원래 가려던 페이지를 보여줌
  return <Outlet />;
};

export default ProtectedRoute;
