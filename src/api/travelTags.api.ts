import { api } from './api';

// 태그 데이터 타입
export interface Tag {
  id: number;
  name: string;
}

// 전체 태그 목록 조회
export const getTags = () => {
  return api.get<Tag[]>('/tags');
};