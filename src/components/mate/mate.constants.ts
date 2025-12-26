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

export const DEFAULT_POSTS: Post[] = [
  {
    id: "1",
    author: { name: "김여행", age: 28, gender: "여성", avatar: "👩", email: "kim@travel.com", travelStyle: ["맛집탐방", "문화탐방"] },
    from: "ICN",
    to: "TYO",
    destination: "도쿄",
    dates: { start: "2025-02-15", end: "2025-02-20" },
    duration: "5박 6일",
    participants: { current: 1, max: 4 },
    tags: ["맛집탐방", "문화탐방", "쇼핑"],
    gender: "여성",
    ageGroup: "20대",
    description: "도쿄 맛집 투어 같이 가실 분! 츠키지 시장, 시부야 맛집 등 계획 중입니다.",
    budget: "$1,500",
    budgetNumber: 1500,
    travelStyle: ["맛집탐방", "문화탐방"],
    views: 128,
    likes: 24,
  },
  {
    id: "2",
    author: { name: "이모험", age: 32, gender: "남성", avatar: "🧑", email: "lee@adventure.com", travelStyle: ["액티비티", "자연"] },
    from: "GMP",
    to: "CJU",
    destination: "제주도",
    dates: { start: "2025-03-01", end: "2025-03-05" },
    duration: "4박 5일",
    participants: { current: 2, max: 6 },
    tags: ["액티비티", "자연", "힐링"],
    gender: "무관",
    ageGroup: "30대",
    description: "제주 올레길 트레킹 메이트 구합니다. 자연을 좋아하시는 분 환영!",
    budget: "$800",
    budgetNumber: 800,
    travelStyle: ["액티비티", "자연"],
    views: 89,
    likes: 15,
  },
  {
    id: "3",
    author: { name: "박힐링", age: 35, gender: "여성", avatar: "👩‍🦰", email: "park@healing.com", travelStyle: ["힐링", "맛집탐방"] },
    from: "ICN",
    to: "BKK",
    destination: "방콕",
    dates: { start: "2025-02-28", end: "2025-03-07" },
    duration: "7박 8일",
    participants: { current: 1, max: 3 },
    tags: ["힐링", "맛집탐방", "쇼핑"],
    gender: "여성",
    ageGroup: "30대",
    description: "방콕 스파 & 맛집 투어! 여유로운 일정으로 계획 중이에요.",
    budget: "$1,200",
    budgetNumber: 1200,
    travelStyle: ["힐링", "맛집탐방"],
    views: 156,
    likes: 32,
  },
  {
    id: "4",
    author: { name: "최문화", age: 29, gender: "남성", avatar: "👨", email: "choi@culture.com", travelStyle: ["문화탐방", "사진"] },
    from: "ICN",
    to: "CDG",
    destination: "파리",
    dates: { start: "2025-04-10", end: "2025-04-20" },
    duration: "10박 11일",
    participants: { current: 1, max: 2 },
    tags: ["문화탐방", "사진", "야경"],
    gender: "무관",
    ageGroup: "20대",
    description: "파리 미술관 투어 함께할 분! 루브르, 오르세 등 계획 중입니다.",
    budget: "$2,500",
    budgetNumber: 2500,
    travelStyle: ["문화탐방", "사진"],
    views: 201,
    likes: 45,
  },
  {
    id: "5",
    author: { name: "정액티브", age: 26, gender: "남성", avatar: "🧔", email: "jung@active.com", travelStyle: ["액티비티", "자연"] },
    from: "PUS",
    to: "DAD",
    destination: "다낭",
    dates: { start: "2025-03-15", end: "2025-03-19" },
    duration: "4박 5일",
    participants: { current: 3, max: 5 },
    tags: ["액티비티", "자연", "힐링"],
    gender: "무관",
    ageGroup: "20대",
    description: "다낭 바나힐 & 호이안 투어! 액티비티 좋아하시는 분 환영합니다.",
    budget: "$700",
    budgetNumber: 700,
    travelStyle: ["액티비티", "자연"],
    views: 112,
    likes: 19,
  },
  {
    id: "6",
    author: { name: "한쇼핑", age: 31, gender: "여성", avatar: "👧", email: "han@shopping.com", travelStyle: ["쇼핑", "맛집탐방"] },
    from: "ICN",
    to: "HKG",
    destination: "홍콩",
    dates: { start: "2025-02-22", end: "2025-02-25" },
    duration: "3박 4일",
    participants: { current: 1, max: 4 },
    tags: ["쇼핑", "맛집탐방", "야경"],
    gender: "여성",
    ageGroup: "30대",
    description: "홍콩 쇼핑 & 딤섬 투어! 짧고 알차게 다녀올 분 구해요.",
    budget: "$900",
    budgetNumber: 900,
    travelStyle: ["쇼핑", "맛집탐방"],
    views: 178,
    likes: 38,
  },
];

export const DEFAULT_RECEIVED_APPLICATIONS: ReceivedApplication[] = [
  {
    id: "recv-1",
    postId: "my-1",
    postDestination: "오사카",
    postDates: { start: "2025-03-10", end: "2025-03-15" },
    applicant: {
      name: "신청자A",
      age: 27,
      gender: "여성",
      avatar: "👩‍🎤",
      email: "applicantA@test.com",
      travelStyle: ["맛집탐방", "쇼핑"],
      message: "안녕하세요! 오사카 여행 너무 가고 싶었는데 같이 가면 좋겠어요!",
      preferredActivities: ["맛집탐방", "쇼핑"],
      budget: "$1,000",
      appliedDate: "2025-01-20",
    },
  },
  {
    id: "recv-2",
    postId: "my-1",
    postDestination: "오사카",
    postDates: { start: "2025-03-10", end: "2025-03-15" },
    applicant: {
      name: "신청자B",
      age: 30,
      gender: "남성",
      avatar: "🧑‍💼",
      email: "applicantB@test.com",
      travelStyle: ["문화탐방", "사진"],
      message: "오사카 문화탐방 관심있습니다. 사진 촬영도 잘해요!",
      preferredActivities: ["문화탐방", "사진"],
      budget: "$1,200",
      appliedDate: "2025-01-21",
    },
  },
];

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
