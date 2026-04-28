// mate.constants.ts
export const POSTS_PER_PAGE = 5;

// 프론트엔드 표시용 옵션들
export const GENDER_OPTIONS = ["남성", "여성", "무관"];
export const TRANSPORT_OPTIONS = ["비행기", "버스", "기차", "자차", "도보", "렌트카", "택시"];
export const AGE_GROUP_OPTIONS = ["전체", "20대", "30대", "40대", "50대+"];

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
  "전체": "all",
  "20대": "20s",
  "30대": "30s",
  "40대": "40s",
  "50대+": "50s+"
};

// 역매핑 (서버의 소문자 enum -> 한글)
export const TRANSPORT_REVERSE_MAP: { [key: string]: string } = {
  "airplane": "비행기",
  "bus": "버스",
  "train": "기차",
  "mycar": "자차",
  "walk": "도보",
  "rentalcar": "렌트카",
  "taxi": "택시"
};

export const GENDER_PREFERENCE_REVERSE_MAP: { [key: string]: string } = {
  "male": "남성",
  "female": "여성",
  "any": "무관"
};

export const AGE_GROUP_REVERSE_MAP: { [key: string]: string } = {
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50s+": "50대+",
  "all": "전체"
};

export const getTransportLabel = (value: string): string => {
  return TRANSPORT_REVERSE_MAP[value] || value || "정보 없음";
};

export const getGenderPreferenceLabel = (value: string): string => {
  return GENDER_PREFERENCE_REVERSE_MAP[value] || value || "무관";
};

export const getAgeGroupLabel = (value: string): string => {
  return AGE_GROUP_REVERSE_MAP[value] || value || "전체";
};

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
  ]}
];

export const getSortLabel = (value: string): string => {
  for (const group of SORT_OPTIONS) {
    const found = group.options.find(opt => opt.value === value);
    if (found) return found.label;
  }
  return "기본 순서";
};