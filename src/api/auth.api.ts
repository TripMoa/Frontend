// src/api/auth.api.ts

import { api, clearAuthState, notifyAuthLogout } from "./api";
import type {
  CheckEmailRequest,
  CheckEmailResponse,
  UserResponse,
  UserUpdateRequestDto,
} from "../types/auth.types";

const LOGOUT_SYNC_KEY = "logout-event";

// 로그인된 사용자 정보 조회
export const getMyInfo = () => {
  return api.get<UserResponse>("/users/me");
};

// 이메일 가입 여부 확인
export const checkEmail = (data: CheckEmailRequest) => {
  return api.post<CheckEmailResponse>("/users/check-email", data);
};

// 내 정보 수정
export const updateMyInfo = (data: UserUpdateRequestDto) => {
  return api.patch<void>("/users/me", data);
};

// 로그아웃 상태를 다른 탭에도 동기화
const broadcastLogoutToOtherTabs = (reason: "manual" | "withdraw") => {
  localStorage.setItem(
    LOGOUT_SYNC_KEY,
    JSON.stringify({
      reason,
      timestamp: Date.now(),
    }),
  );
};

// 로그아웃
export const logout = async () => {
  try {
    await api.post<void>("/logout");
  } catch {
    // 서버 로그아웃 실패해도 클라이언트 상태는 초기화
  } finally {
    clearAuthState();
    broadcastLogoutToOtherTabs("manual");
    notifyAuthLogout("manual");
  }
};

// 회원 탈퇴
export const withdraw = async () => {
  await api.delete("/users/me");
  clearAuthState();
  broadcastLogoutToOtherTabs("withdraw");
  notifyAuthLogout("withdraw");
};
