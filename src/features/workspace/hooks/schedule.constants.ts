// src/features/workspace/constants/schedule_constants.ts
// 카테고리 관련 상수를 한 곳에서 관리합니다.
// 모든 컴포넌트는 여기서 import하세요.

// ─── 프론트엔드 표시용 카테고리 ──────────────────────────────
export const CATEGORY_COLOR: Record<string, string> = {
  관광: "#1976d2",
  맛집: "#e53935",
  카페: "#6d4c41",
  쇼핑: "#7b1fa2",
  숙소: "#2e7d32",
  교통: "#546e7a",   // 공항, 기차역, 버스터미널 등 이동 거점
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
    교통: "✈️",   // 공항/기차역/버스터미널 대표 아이콘
  } as Record<string, string>)[cat] ?? "📍");

// ─── 프론트 → 백엔드 카테고리 변환 ─────────────────────────
// 프론트: "관광" / 백엔드: "관광지"  (불일치 버그 방지)
// 프론트: "교통" / 백엔드: "출발지"  (일정 생성 시 출발/도착 기준점으로 처리)
export const CATEGORY_TO_BACKEND: Record<string, string> = {
  관광: "관광지",
  맛집: "맛집",
  카페: "카페",
  쇼핑: "쇼핑",
  숙소: "숙소",
  교통: "출발지",
};

// ─── 백엔드 → 프론트 카테고리 변환 ─────────────────────────
export const CATEGORY_FROM_BACKEND: Record<string, string> = {
  관광지: "관광",
  맛집: "맛집",
  카페: "카페",
  쇼핑: "쇼핑",
  숙소: "숙소",
  출발지: "교통",
};

// ─── 이동 수단 변환 ──────────────────────────────────────────
export const TRANSPORT_TO_BACKEND: Record<string, string> = {
  walk: "도보",
  public: "대중교통",
  car: "택시",
};

// ─── 페이스(pace) 변환 ───────────────────────────────────────
export const PACE_TO_BACKEND: Record<string, string> = {
  efficiency: "tight",
  balanced: "normal",
  relaxed: "relaxed",
};

// ─── localStorage 스키마 버전 ────────────────────────────────
export const STORAGE_SCHEMA_VERSION = 2;
export const STORAGE_KEYS = {
  TIMELINE: "tripmoa_timeline_data",
  DATE_LOGS: "tripmoa_date_logs",
  SAVED_PLACES: "saved_places",
  SCHEMA_VERSION: "tripmoa_schema_version",
} as const;