// constants/user.constants.ts

export const STORAGE_KEYS = {
  USER_PROFILE: "tripmoa_user_profile",
} as const;

export const GENDERS = ["남성", "여성", "기타"] as const;

export const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

export const TRAVEL_STYLES = [
  "맛집탐방",
  "액티비티",
  "힐링",
  "문화탐방",
  "쇼핑",
  "자연",
  "사진",
  "야경",
  "로컬체험",
  "카페투어",
  "축제",
  "역사탐방",
  "야외활동",
  "미식투어",
  "럭셔리",
  "배낭여행",
] as const;

// 랜덤 아바타용 이모지
export const AVATAR_EMOJIS = [
  "😊",
  "🎉",
  "✈️",
  "🌍",
  "📸",
  "🎒",
  "🗺️",
  "🌟",
  "🎨",
  "🎭",
  "🎪",
  "🎯",
  "🎸",
  "🎺",
  "🎬",
  "🎮",
  "⚽",
  "🏀",
  "🎾",
  "🏐",
  "🏈",
  "⚾",
  "🥎",
  "🏉",
  "🌸",
  "🌺",
  "🌻",
  "🌷",
  "🌹",
  "🌼",
  "🌿",
  "🍀",
  "⭐",
  "🌙",
  "☀️",
  "🌈",
  "⚡",
  "❄️",
  "🔥",
  "💎",
] as const;

// 랜덤 아바타용 배경색
export const AVATAR_COLORS = [
  "#FFE5E5",
  "#FFE5CC",
  "#FFF4CC",
  "#E5F5E5",
  "#E5F0FF",
  "#F0E5FF",
  "#FFE5F5",
  "#FFEBE5",
  "#FFD4D4",
  "#FFD4B8",
  "#FFEAB8",
  "#D4F0D4",
  "#D4E5FF",
  "#E5D4FF",
  "#FFD4F0",
  "#FFD9C8",
  "#FEC6C6",
  "#FEC6A3",
  "#FFDEA3",
  "#C6E8C6",
  "#C6DAFF",
  "#DAC6FF",
  "#FFC6E8",
  "#FFC8B8",
] as const;

export const DEFAULT_PROFILE = {
  photo: "",
  nickname: "",
  name: "",
  birthDate: "",
  gender: "",
  mbti: "",
  travelStyles: [] as string[],
  isVerified: false,
} as const;

// 모달 내용
export const MODAL_MESSAGES = {
  VERIFY: {
    TITLE: "본인 인증",
    DESCRIPTION:
      "실제 서비스에서는 휴대폰 인증, 아이핀 인증 등이 진행됩니다.\n데모에서는 바로 인증이 완료됩니다.",
    BUTTON: "인증하기",
    SUCCESS: "✅ 본인 인증이 완료되었습니다!",
  },
  DELETE: {
    TITLE: "계정을 탈퇴하시겠습니까?",
    DESCRIPTION:
      "모든 여행 기록, 채팅 내역이 영구적으로 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.",
    BUTTON: "탈퇴하기",
    SUCCESS: "계정이 탈퇴되었습니다. 그동안 이용해주셔서 감사합니다.",
  },
  SAVE: {
    SUCCESS: "✅ 프로필이 저장되었습니다!",
  },
} as const;

// 랜덤 아바타 생성 함수
export function generateRandomAvatar(): { emoji: string; color: string } {
  const randomEmoji =
    AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
  const randomColor =
    AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  return { emoji: randomEmoji, color: randomColor };
}
