import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  STORAGE_KEYS,
  DEFAULT_PROFILE,
  generateRandomAvatar,
} from "../components/User.constant";

// 유효한 MBTI 목록 정의
const VALID_MBTI = [
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

export interface UserProfile {
  photo: string;
  nickname: string;
  name: string;
  notificationEmail: string;
  birthDate: string;
  gender: string;
  mbti: string;
  travelStyles: string[];
  isVerified: boolean;
  avatarEmoji?: string;
  avatarColor?: string;

  // 입력 필드
  email?: string; // 소셜 로그인 이메일
  isPrivateName: boolean; // 이름 비공개 여부 추가
  isPrivateAge: boolean; // 나이 비공개 여부 추가
  isPrivateGender: boolean; // 성별 비공개 여부 추가
  isAdultConfirmed: boolean; // 성인 인증 확인 여부

  // 알림 설정 필드
  tripAlert: boolean; // 여행 일정 알림
  marketingAgreed: boolean; // 마케팅 수신 동의
  emailAgreed: boolean; // 이메일 수신 동의

  // 동적 키 접근을 위한 인덱스 시그니처 추가
  [key: string]: any;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (saved) return JSON.parse(saved);

    // 데이터가 없을 때만 생성하고 즉시 저장
    const { emoji, color } = generateRandomAvatar();
    const initialProfile = {
      ...DEFAULT_PROFILE,
      avatarEmoji: emoji,
      avatarColor: color,
      notificationEmail: "",
      isPrivateName: false,
      isPrivateAge: false,
      isPrivateGender: false,
      isAdultConfirmed: false,
      tripAlert: true,
      marketingAgreed: false,
      emailAgreed: false,
    };

    // 즉시 저장하여 새로고침 시 고정
    localStorage.setItem(
      STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(initialProfile)
    );
    return initialProfile;
  });

  const navigate = useNavigate();
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 변경사항 감지
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const current = JSON.stringify(profile);
    setHasChanges(saved !== current);
  }, [profile]);

  // 프로필 업데이트
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  // 프로필 저장
  const saveProfile = async (): Promise<void> => {
    setIsSaving(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(profile)
        );
        setHasChanges(false);
        setIsSaving(false);
        resolve();
      }, 500);
    });
  };

  // 사진 변경
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateProfile({ photo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // 사진 업로드 트리거
  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  // 여행 스타일 토글
  const toggleTravelStyle = (style: string) => {
    const styles = profile.travelStyles || [];
    if (styles.includes(style)) {
      updateProfile({ travelStyles: styles.filter((s) => s !== style) });
    } else {
      updateProfile({ travelStyles: [...styles, style] });
    }
  };

  // 본인 인증
  const verify = async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        updateProfile({ isVerified: true });
        resolve();
      }, 1000);
    });
  };

  // 아바타 랜덤 변경
  const regenerateAvatar = () => {
    const { emoji, color } = generateRandomAvatar();
    updateProfile({
      avatarEmoji: emoji,
      avatarColor: color,
      photo: "",
    });
  };

  // 계정 탈퇴
  const deleteAccount = () => {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);

    const { emoji, color } = generateRandomAvatar();

    // 모든 상태 초기화
    setProfile({
      ...DEFAULT_PROFILE,
      travelStyles: [],
      avatarEmoji: emoji,
      avatarColor: color,

      email: "",
      notificationEmail: "",
      isPrivateName: false,
      isPrivateAge: false,
      isPrivateGender: false,
      isAdultConfirmed: false,
      tripAlert: true,
      marketingAgreed: false,
      emailAgreed: false,
    });

    // 홈화면 이동
    navigate("/");
  };

  // 나이 계산
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // MBTI 유효성 검사: 비어있거나, 4글자이면서 유효 목록에 포함되어야 함
  const isMBTIValid =
    !profile.mbti ||
    (profile.mbti.length === 4 && VALID_MBTI.includes(profile.mbti));

  // 닉네임 필수, MBTI 입력할 경우에만 유효성 체크
  const isFormValid = !!profile.nickname && isMBTIValid;

  const age = calculateAge(profile.birthDate);

  return {
    // State
    profile,
    hasChanges,
    isSaving,
    isFormValid,
    VALID_MBTI,
    fileInputRef,
    age,

    // Actions
    updateProfile,
    saveProfile,
    handlePhotoChange,
    triggerPhotoUpload,
    toggleTravelStyle,
    verify,
    deleteAccount,
    calculateAge,
    regenerateAvatar,
  };
}
