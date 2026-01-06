// mate.constants.ts

import type { Author, Post, ReceivedApplication } from "./mate.types";

export const STORAGE_KEYS = {
  REMOVED_POSTS: "mate_removedPosts",
  SELECTED_TAGS: "mate_selectedTags",
  LOCATION_FILTER: "mate_locationFilter",
  DATE_FILTER: "mate_dateFilter",
  GENDER_FILTER: "mate_genderFilter",
  AGE_FILTER: "mate_ageFilter",
  SORT_BY: "mate_sortBy",
  CURRENT_PAGE: "mate_currentPage",
  USER_POSTS: "mate_userPosts",
  LIKED_POSTS: "mate_likedPosts",
  APPROVED_APPLICANTS: "mate_approvedApplicants",
  REJECTED_APPLICANTS: "mate_rejectedApplicants",
  POST_STATS: "mate_postStats",
  MY_APPLICATIONS: "mate_myApplications",
  RECEIVED_APPLICATIONS: "mate_receivedApplications",
  ONE_ON_ONE_CHATS: "mate_oneOnOneChats",
  GROUP_CHATS: "mate_groupChats",
} as const;

export const POSTS_PER_PAGE = 5;

export const ALL_TAGS = ["맛집탐방", "액티비티", "힐링", "문화탐방", "쇼핑", "자연", "사진", "야경"];

export const GENDER_OPTIONS = ["전체", "남성", "여성", "무관"];

export const AGE_OPTIONS = ["전체", "20대", "30대", "40대", "50대+"];

export const TRANSPORT_OPTIONS = ["비행기", "버스", "기차", "자차", "도보"];

export const TRAVEL_TYPE_OPTIONS = ["맛집탐방", "액티비티", "힐링", "문화탐방", "쇼핑", "자연", "사진", "야경"];

export const AGE_GROUP_OPTIONS = ["20대", "30대", "40대", "50대+"];

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

export const CURRENT_USER: Author = {
  name: "나",
  age: 28,
  gender: "여성",
  avatar: "🙋‍♀️",
  email: "me@example.com",
  travelStyle: ["맛집탐방", "힐링"],
};

export const DEFAULT_POSTS: Post[] = [];

export const DEFAULT_RECEIVED_APPLICATIONS: ReceivedApplication[] = [];

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
