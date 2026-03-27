// src/api/auth.api.ts

import { api } from "./api";
import type {
  CheckEmailRequest,
  CheckEmailResponse,
  UserResponse,
  UserUpdateRequestDto,
} from "../types/auth.types";

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

// 로그아웃
export const logout = async () => {
  try {
    await api.post<void>("/logout");
  } catch (error) {
    console.error("서버 로그아웃 처리 실패:", error);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    // localStorage.clear();
  }
};

// 회원 탈퇴
export const withdraw = async () => {
  const response = await api.delete<void>("/users/me");

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userId");
  // localStorage.clear();

  return response;
};
