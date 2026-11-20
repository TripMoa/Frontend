import { api } from "./api";

export interface Comment {
  id: number;
  storyId: number;
  author: {
    id: number;
    name: string;
    avatar: string;
  };
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
}

// 댓글 목록 조회
export const getComments = (storyId: number) => {
  return api.get(`/stories/${storyId}/comments`);
};

// 댓글 작성
export const createComment = (storyId: number, data: CreateCommentData) => {
  return api.post(`/stories/${storyId}/comments`, data);
};

// 댓글 수정
export const updateComment = (commentId: number, data: CreateCommentData) => {
  return api.patch(`/comments/${commentId}`, data);
};

// 댓글 삭제
export const deleteComment = (commentId: number) => {
  return api.delete(`/comments/${commentId}`);
};