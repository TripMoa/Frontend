// mate.constants.ts

import type { Author, Post, ReceivedApplication } from "./mate.types";

export const POSTS_PER_PAGE = 5;

export const ALL_TAGS = ["맛집탐방", "액티비티", "힐링", "문화탐방", "쇼핑", "자연", "사진", "야경"];

// 프론트엔드 표시용 옵션들
export const GENDER_OPTIONS = ["전체", "남성", "여성", "무관"];
export const AGE_OPTIONS = ["전체", "20대", "30대", "40대", "50대+"];
export const TRANSPORT_OPTIONS = ["비행기", "버스", "기차", "자차", "도보"];
export const TRAVEL_TYPE_OPTIONS = ["맛집탐방", "액티비티", "힐링", "문화탐방", "쇼핑", "자연", "사진", "야경"];
export const AGE_GROUP_OPTIONS = ["20대", "30대", "40대", "50대+"];

// 백엔드 enum 매핑 (한글 -> 영문 enum)
export const TRANSPORT_MAP: { [key: string]: string } = {
  "비행기": "airplane",
  "버스": "bus",
  "기차": "train",
  "자차": "mycar",
  "도보": "walk",
  "렌트카": "rentalcar",
  "택시": "taxi"
};

export const GENDER_PREFERENCE_MAP: { [key: string]: string } = {
  "남성": "male",
  "여성": "female",
  "무관": "any"
};

export const AGE_GROUP_MAP: { [key: string]: string } = {
  "20대": "20s",
  "30대": "30s",
  "40대": "40s",
  "50대+": "50s+"
};

// 역매핑 (영문 enum -> 한글)
export const TRANSPORT_REVERSE_MAP: { [key: string]: string } = {
  "AIRPLANE": "비행기",
  "BUS": "버스",
  "TRAIN": "기차",
  "CAR": "자차",
  "WALK": "도보"
};

export const GENDER_PREFERENCE_REVERSE_MAP: { [key: string]: string } = {
  "MALE": "남성",
  "FEMALE": "여성",
  "ANY": "무관"
};

export const AGE_GROUP_REVERSE_MAP: { [key: string]: string } = {
  "TWENTIES": "20대",
  "THIRTIES": "30대",
  "FORTIES": "40대",
  "FIFTIES_PLUS": "50대+"
};

// 공항 코드 매핑 (필요한 경우 사용)
export const AIRPORT_MAP: { [key: string]: string } = {
  ICN: "인천",
  GMP: "김포",
  PUS: "부산",
  CJU: "제주",
  SEL: "서울",
};

export const getAirportDisplay = (code: string): string => {
  return AIRPORT_MAP[code] || code;
};

// 현재 사용자 정보 가져오기 (API에서 가져오는 것으로 변경 필요)
export const getCurrentUserId = (): number => {
  const userId = localStorage.getItem('userId');
  return userId ? parseInt(userId) : 0;
};

export const CURRENT_USER_ID = getCurrentUserId();

/**
 * 여행 기간 계산 (startDate와 endDate로부터 "N박 M일" 형식 생성)
 * @param startDate - 시작일 (YYYY-MM-DD 형식)
 * @param endDate - 종료일 (YYYY-MM-DD 형식)
 * @returns "N박 M일" 형식의 문자열
 * 
 * @example
 * calculateDuration("2024-03-15", "2024-03-20") // "5박 6일"
 * calculateDuration("2024-03-15", "2024-03-15") // "당일치기"
 */
export const calculateDuration = (startDate: string, endDate: string): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 날짜가 유효하지 않은 경우
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "정보 없음";
    }
    
    // 밀리초를 일수로 변환
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 당일치기
    if (diffDays === 0) {
      return "당일치기";
    }
    
    // 음수인 경우 (종료일이 시작일보다 이전)
    if (diffDays < 0) {
      return "정보 없음";
    }
    
    // N박 M일 계산
    const nights = diffDays;
    const days = diffDays + 1;
    
    return `${nights}박 ${days}일`;
  } catch (error) {
    return "정보 없음";
  }
};

/**
 * 여행 기간을 일수로만 반환
 * @param startDate - 시작일 (YYYY-MM-DD 형식)
 * @param endDate - 종료일 (YYYY-MM-DD 형식)
 * @returns 일수
 */
export const calculateDays = (startDate: string, endDate: string): number => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays + 1; // 일수는 박수 + 1
  } catch (error) {
    return 0;
  }
};

// 정렬 옵션
export const SORT_OPTIONS = [
  { group: "정렬 기준", options: [
    { value: "default", label: "기본 순서" },
    { value: "budget-high", label: "예산 높은 순" },
    { value: "budget-low", label: "예산 낮은 순" },
    { value: "views", label: "조회수 높은 순" },
    { value: "likes", label: "좋아요 많은 순" },
  ]},
  { group: "나의 활동", options: [
    { value: "liked-only", label: "좋아요 누른 항목" },
    { value: "applied-only", label: "내가 신청한 항목" },
    { value: "removed-only", label: "패스한 항목" },
  ]},
];

export const getSortLabel = (value: string): string => {
  for (const group of SORT_OPTIONS) {
    const found = group.options.find(opt => opt.value === value);
    if (found) return found.label;
  }
  return "기본 순서";
};