import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyInfo } from "../../../api/auth.api";

/**
 * OAuthSuccess 컴포넌트
 * 소셜 로그인 성공 후 URL에 담긴 JWT 토큰 저장
 * 실제 로그인 상태를 확인한 뒤 홈으로 이동하는 페이지
 */
export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    const provider = params.get("provider");

    // 액세스 토큰과 리프레시 토큰이 모두 있는지 확인
    if (!token || !refreshToken) {
      alert("로그인 정보가 부족합니다. 다시 로그인 해주세요.");
      navigate("/login", { replace: true });
      return;
    }

    // 토큰 모두 저장
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refreshToken);

    // 최근 로그인 정보 저장
    if (provider) {
      localStorage.setItem("lastLoginProvider", provider.toLowerCase());
    }

    getMyInfo()
      .then(() => {
        navigate("/", { replace: true });
      })
      .catch(() => {
        alert("로그인 처리 중 오류가 발생했습니다.");

        // 실패 시 모든 토큰 삭제하여 세션 초기화
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  return <p>로그인 처리 중입니다...</p>;
}
