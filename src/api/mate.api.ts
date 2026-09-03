import { api } from "./api";

// 전체 메이트 포스트 조회
export const getMatePosts = () => {
  return api.get("/mate/");
};

// 메이트 상세 조회
export const getMatePostDetail = (id: number) => {
  return api.get(`/mate/${id}`);
};

// 메이트 작성
export const createMatePost = (data: any) => {
  return api.post("/mate/", data);
};

// 메이트 삭제
export const deleteMatePost = (id: number) => {
  return api.delete(`/mate/${id}`);
};

// 내가 받은 메이트 신청서 조회
export const getReceivedApplications = () => {
  return api.get("/mate/applications/received");
};

// 내가 보낸 메이트 신청서 조회
export const getSentApplications = () => {
  return api.get("/mate/applications/sent");
};

// 특정 메이트 신청
export const applyMatePost = (id: number, data: any) => {
  return api.post(`/mate/${id}/apply/applicant`, data);
};

// 메이트 신청 승인
export const approveMateApplication = (applyId: number) => {
  return api.put(`/mate/applications/${applyId}/approve`);
};

// 메이트 신청 거절
export const rejectMateApplication = (applyId: number) => {
  return api.put(`/mate/applications/${applyId}/reject`);
};

// 좋아요 개수 조회
export const getLikeCount = (postId: number) => {
  return api.get(`/mate/${postId}/like`);
};

// 좋아요 토글
export const toggleLike = (postId: number) => {
  return api.post(`/mate/${postId}/like`);
};