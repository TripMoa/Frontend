import { api } from "./api";

// 여행 스토리 데이터 타입
export interface Story {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  images: string[];
  author: {
    id: number;
    name: string;
    avatar: string;
  };
  destination: string;
  duration: string;
  budget: string;
  date: string;
  likes: number;
  comments: number;
  follows: number;
  views: number;
  tags: string[];
  isLiked: boolean;
  isFollowed: boolean;
  createdAt: string;
  updatedAt: string;

  type: 'FREE' | 'REVIEW';

  expenses?: {
    transportation: number;
    accommodation: number;
    food: number;
    attraction: number;
    shopping: number;
    total: number;
  };
}

// 스토리 목록 조회 시 사용할 필터 및 페이지네이션 파라미터 타입
export interface StoryListParams {
  destination?: string;
  duration?: string;
  minBudget?: string;
  maxBudget?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

// 스토리 생성 및 수정 시 서버로 전송할 데이터 타입
export interface CreateStoryData {
  title: string;
  description: string;
  imageUrl: string;
  images: string[];
  destination: string;
  duration: string;
  budget: string;
  tags: string[];

  expenses?: {
    transportation: number;
    accommodation: number;
    food: number;
    attraction: number;
    shopping: number;
    total: number;
  };
}

// 서버 전송 전 tags 배열을 쉼표로 구분된 문자열로 변환 (백엔드 스펙 대응)
const convertTagsToString = (data: CreateStoryData | Partial<CreateStoryData>) => {
  if (data.tags && Array.isArray(data.tags)) {
    return {
      ...data,
      tags: data.tags.join(',')
    };
  }
  return data;
};

// API 함수

// 필터 조건에 맞는 스토리 목록 조회
export const getStories = (params?: StoryListParams) => {
  return api.get("/stories", { params });
};

// 특정 스토리 상세 조회
export const getStory = (id: number) => {
  return api.get(`/stories/${id}`);
};

// 새 스토리 생성
export const createStory = (data: CreateStoryData) => {
  const convertedData = convertTagsToString(data);
  return api.post("/stories", convertedData);
};

// 특정 스토리 수정
export const updateStory = (id: number, data: Partial<CreateStoryData>) => {
  const convertedData = convertTagsToString(data);
  return api.patch(`/stories/${id}`, convertedData);
};

// 특정 스토리 삭제
export const deleteStory = (id: number) => {
  return api.delete(`/stories/${id}`);
};

// 내가 작성한 스토리 목록 조회
export const getMyStories = () => {
  return api.get("/stories/my");
};

// 특정 스토리 좋아요 토글
export const toggleLike = (id: number) => {
  return api.post(`/stories/${id}/like`);
};

// 좋아요한 스토리 목록 조회
export const getLikedStories = () => {
  return api.get("/stories/liked");
};

// 특정 여행 일정 저장
export const saveItinerary = (id: number) => {
  return api.post(`/stories/${id}/follow`);
};

// 특정 여행 일정 저장 취소
export const unsaveItinerary = (id: number) => {
  return api.delete(`/stories/${id}/follow`);
};

// 저장한 여행 일정 목록 조회
export const getSavedItineraries = () => {
  return api.get("/stories/followed");
};

// 특정 스토리 조회수 증가
export const incrementStoryViews = (id: number) => {
  return api.post(`/stories/${id}/view`);
};