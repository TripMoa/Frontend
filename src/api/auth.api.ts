import { api } from "./api";

// 로그인된 사용자 정보 조회
export const getMyInfo = () => {
  return api.get("/users/me");
};

// 내 정보 수정
export const updateMyInfo = (data: any) => api.patch("/users/me", data);

// 로그아웃
export const logout = async () => {
  try {
    await api.post("/logout");
  } catch (error) {
    console.error("서버 로그아웃 처리 실패:", error);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
};

// 회원 탈퇴
export const withdraw = () => api.delete("/users/me");
