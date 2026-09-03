// src/features/user/pages/OAuthSuccess.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import styles from "../styles/Login.module.css";

/**
 * OAuthSuccess 컴포넌트.
 * 소셜 로그인 성공 후 refreshToken 쿠키를 기준으로 accessToken을 재발급받고 사용자 인증 상태 복구
 * 인증 성공 시 홈으로 이동, 실패 시 로그인 페이지로 이동
 */
export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get("provider");

    // 최근 로그인 정보 저장
    if (provider) {
      localStorage.setItem("lastLoginProvider", provider.toLowerCase());
    }

    // 주소창 잔여 쿼리 제거
    window.history.replaceState({}, document.title, "/oauth2/redirect");

    const run = async () => {
      const success = await refreshAuth();

      if (success) {
        navigate("/", { replace: true });
        return;
      }

      navigate("/login", {
        replace: true,
        state: { message: "로그인 처리 중 오류가 발생했습니다." },
      });
    };

    run();
  }, [navigate, refreshAuth]);

  return (
    <div className={styles.oauthLoading}>
      <div className={styles.spinner}></div>
      <p>로그인 처리 중입니다...</p>
    </div>
  );
}
