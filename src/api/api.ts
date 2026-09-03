// src/api/api.ts

import axios from "axios";
import type { RefreshTokenResponse } from "../types/auth.types";

type RetryableConfig = {
  _retry?: boolean;
  headers?: Record<string, string>;
  url?: string;
};

export type AuthLogoutReason =
  | "manual"
  | "withdraw"
  | "refresh-expired"
  | "remote-tab"
  | "suspended";

// refreshToken 쿠키 자동 전송
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// accessToken 메모리 관리
let accessTokenMemory: string | null = null;

export const getAccessToken = () => accessTokenMemory;

export const setAccessToken = (token: string) => {
  accessTokenMemory = token;
};
export const clearAccessToken = () => {
  accessTokenMemory = null;
};

// 인증 관련 클라이언트 상태 초기화
export const clearAuthState = () => {
  clearAccessToken();

  localStorage.removeItem("tripData");

  Object.keys(localStorage)
    .filter((key) => key.startsWith("tripmoa_current_notice_group_id"))
    .forEach((key) => localStorage.removeItem(key));
};

// 인증 상태 변경 이벤트 발행
export const notifyAuthLogout = (reason: AuthLogoutReason = "manual") => {
  window.dispatchEvent(
    new CustomEvent("auth:logout", {
      detail: { reason },
    }),
  );
};

// 공유 Promise : 동시에 여러 401 발생 -> refresh 중복 방지
let refreshPromise: Promise<RefreshTokenResponse> | null = null;

/**
 * 요청 인터셉터
 * 모든 API 요청에 JWT 토큰을 Authorization 헤더로 자동 추가
 */
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * refresh 요청은 반드시 여기서만 수행
 * - 토큰 저장/정리까지만 담당
 * - 전역 로그아웃 이벤트는 여기서 발행하지 않음
 */
const refreshTokens = async (): Promise<RefreshTokenResponse> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshTokenResponse>(
        "/api/auth/refresh",
        {},
        { withCredentials: true },
      )
      .then((res) => {
        const { accessToken, authenticated, reason } = res.data;

        if (authenticated === false && reason === "SUSPENDED") {
          clearAuthState();
          notifyAuthLogout("suspended");
          throw new Error("Suspended");
        }

        if (!accessToken || authenticated === false) {
          clearAuthState();
          throw new Error("Unauthenticated");
        }

        setAccessToken(accessToken);
        return res.data;
      })
      .catch((error) => {
        clearAuthState();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

/**
 * 앱 시작 시 명시적으로 1회 인증 복구가 필요할 때 사용할 함수
 * bootstrap 경로에서는 실패해도 이벤트 발행하지 않음
 */
export const tryRefreshAuth = async (): Promise<boolean> => {
  try {
    await refreshTokens();
    return true;
  } catch {
    return false;
  }
};

/**
 * 응답 인터셉터
 * 인증 만료 시 토큰 재발급 후 재시도
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as typeof error.config &
      RetryableConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");

    if (status === 401 && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;

      try {
        const { accessToken } = await refreshTokens();

        const headers = (originalRequest.headers ?? {}) as Record<
          string,
          string
        >;
        headers.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers = headers;

        return api(originalRequest);
      } catch (refreshError) {
        clearAuthState();
        notifyAuthLogout("refresh-expired");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
