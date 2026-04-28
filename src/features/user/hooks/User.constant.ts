// constants/user.constants.ts

export const GENDER_OPTIONS = [
  { label: "남성", value: "MALE" },
  { label: "여성", value: "FEMALE" },
  { label: "기타", value: "OTHER" },
] as const;

export const PRIVACY_ITEMS = [
  { id: "isPrivateName", label: "이름" },
  { id: "isPrivateAge", label: "나이" },
  { id: "isPrivateGender", label: "성별" },
] as const;

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
];

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

// 모달 내용
export const MODAL_MESSAGES = {
  VERIFY: {
    TITLE: "성인 이용 안내",
    DESCRIPTION:
      "현재 휴대폰 본인인증 기능은 제공되지 않습니다.\n생년월일 정보를 기준으로 성인 여부를 확인합니다.\n미성년자의 이용에 대한 책임은 본인에게 있습니다.",
    BUTTON: "확인",
    SUCCESS: "안내 확인이 완료되었습니다!",
  },
  DELETE: {
    TITLE: "계정을 탈퇴하시겠습니까?",
    DESCRIPTION:
      "프로필 정보가 영구적으로 삭제됩니다.\n모든 데이터 삭제를 원하시면 문의바랍니다.\n이 작업은 되돌릴 수 없습니다.",
    BUTTON: "탈퇴하기",
    SUCCESS: "계정이 탈퇴되었습니다. 그동안 이용해주셔서 감사합니다.",
  },
  SAVE: {
    SUCCESS: "프로필이 저장되었습니다!",
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
