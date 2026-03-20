import { api } from "./api";

export interface Draft {
  id: number;
  userId: number;
  title: string;
  description: string;
  destination: string;
  duration: string;
  budget: string;
  tags: string[];
  images: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDraftData {
  title: string;
  description: string;
  destination: string;
  duration: string;
  budget: string;
  tags: string;
  images: string;
}

// 임시저장 목록 조회
export const getDrafts = () => {
  return api.get("/drafts");
};

// 임시저장
export const createDraft = (data: CreateDraftData) => {
  return api.post("/drafts", data);
};

// 임시저장 수정
export const updateDraft = (id: number, data: Partial<CreateDraftData>) => {
  return api.patch(`/drafts/${id}`, data);
};

// 임시저장 삭제
export const deleteDraft = (id: number) => {
  return api.delete(`/drafts/${id}`);
};

// 임시저장 게시
export const publishDraft = (id: number) => {
  return api.post(`/drafts/${id}/publish`);
};