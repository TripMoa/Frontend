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
  isPublic: boolean;
  tripId?: number | null;

  // 계획한 동선 스냅샷 - parseRoute()로 변환해서 사용
  route?: string | null;

  // 경비 공개 여부
  showExpense?: boolean;

  // 여행 인원 ("외 n명" 표시용)
  memberCount?: number | null;

  // 수정·삭제 가능 여부 (작성자 또는 여행 멤버)
  canEdit?: boolean | null;

  expenses?: StoryExpenses;
}

// 후기 경비 (memberCount 있으면 TRAVEL LOG 요약)
export interface StoryExpenses {
  transportation: number | null;
  accommodation: number | null;
  food: number | null;
  attraction: number | null;
  shopping: number | null;
  etc?: number | null;
  memberCount?: number | null;
  total: number;
}

// 동선 스냅샷 타입
export interface RouteItem {
  order: number;
  time?: string | null;
  title: string;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
  travelMinutes?: number | null;
}
 
export interface RouteDay {
  day: number;
  items: RouteItem[];
}
 
// route JSON 문자열 → 배열 (비어 있거나 깨졌으면 빈 배열)
export const parseRoute = (route?: string | null): RouteDay[] => {
  if (!route) return [];
  try {
    const parsed = JSON.parse(route);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// 동선 스냅샷 타입
export interface RouteItem {
  order: number;
  time?: string | null;
  title: string;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
  travelMinutes?: number | null;
}

export interface RouteDay {
  day: number;
  items: RouteItem[];
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
  isPublic?: boolean;
  tripId?: number | null;

  expenses?: {
    transportation: number;
    accommodation: number;
    food: number;
    attraction: number;
    shopping: number;
    total: number;
  };
}

// 서버 전송 전 tags 배열을 쉼표로 구분된 문자열로 변환 
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

// 후기 작성 페이지 동선 미리보기
export const getRoutePreview = (tripId: number) => {
  return api.get<{ route: string | null }>(`/stories/route-preview`, { params: { tripId } });
};

// 후기 작성 페이지 경비 미리보기 (TRAVEL LOG 카테고리별 합계)
export const getExpensePreview = (tripId: number) => {
  return api.get<StoryExpenses>(`/stories/expense-preview`, { params: { tripId } });
};

// 특정 여행의 리뷰 작성 여부 확인
export const checkReviewExists = (tripId: number) => {
  return api.get(`/stories/review-check?tripId=${tripId}`);
};
