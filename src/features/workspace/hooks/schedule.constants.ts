// src/features/workspace/constants/schedule_constants.ts

export const CATEGORY_COLOR: Record<string, string> = {
  관광: "#1976d2",
  맛집: "#e53935",
  카페: "#6d4c41",
  쇼핑: "#7b1fa2",
  숙소: "#2e7d32",
  교통: "#546e7a",
};

export const CATEGORY_LIST = ["관광", "맛집", "카페", "쇼핑", "숙소", "교통"] as const;
export type CategoryType = typeof CATEGORY_LIST[number];

export const getCategoryIcon = (cat: string): string =>
  (({
    맛집: "🍴",
    카페: "☕",
    관광: "🏛️",
    쇼핑: "🛍️",
    숙소: "🏨",
    교통: "✈️",
  } as Record<string, string>)[cat] ?? "📍");

export const CATEGORY_TO_BACKEND: Record<string, string> = {
  관광: "관광지",
  맛집: "맛집",
  카페: "카페",
  쇼핑: "쇼핑",
  숙소: "숙소",
  교통: "출발지",
};

export const CATEGORY_FROM_BACKEND: Record<string, string> = {
  관광지: "관광",
  맛집: "맛집",
  카페: "카페",
  쇼핑: "쇼핑",
  숙소: "숙소",
  출발지: "교통",
};

export const TRANSPORT_TO_BACKEND: Record<string, string> = {
  walk: "도보",
  public: "대중교통",
  car: "택시",
};

export const PACE_TO_BACKEND: Record<string, string> = {
  efficiency: "tight",
  balanced: "normal",
  relaxed: "relaxed",
};

// STORAGE_KEYS, STORAGE_SCHEMA_VERSION 제거 — localStorage 완전 제거됨