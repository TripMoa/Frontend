import axios from "axios";

// Axios 인스턴스 생성
export const api = axios.create({
  baseURL: "/api",
});

/**
 * 요청 인터셉터
 * 모든 API 요청에 JWT 토큰을 Authorization 헤더로 자동 추가
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * 응답 인터셉터
 * 인증 만료 시 자동 로그아웃 처리 & 기타 에러 처리
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 401 에러: 토큰 만료 시 재발급 시도
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        // 리프레시 토큰으로 새 토큰 발급 요청 (주의: api 인스턴스가 아닌 axios를 직접 사용하여 무한 루프 방지)
        const res = await axios.post("/api/auth/refresh", { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = res.data;

        // 새 토큰들 저장
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // 실패했던 기존 요청의 헤더를 새 토큰으로 교체 후 재시도
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료되었거나 오류 발생 시 로그아웃
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // 기타 에러 처리
    if (status === 403) {
      alert("접근 권한이 없습니다.");
    } else if (status >= 500) {
      alert("서버 오류가 발생했습니다.");
    }

    return Promise.reject(error);
  },
);
