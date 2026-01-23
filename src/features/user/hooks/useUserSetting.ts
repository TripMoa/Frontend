import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { generateRandomAvatar } from "../components/User.constant";
import { MBTI_TYPES } from "../components/User.constant";
import { getMyInfo, updateMyInfo, withdraw } from "../../../api/auth.api";

export interface UserProfile {
  // 기본 필드
  profileImage: string;
  nickname: string;
  name: string;
  notificationEmail: string;
  birthDate: string;
  gender: string;
  mbti: string;
  travelStyles: string[];
  email?: string;
  provider?: "KAKAO" | "GOOGLE" | "NAVER";

  // 상태 필드
  isVerified: boolean;
  avatarEmoji?: string;
  avatarColor?: string;

  // 잠금 필드
  nameLocked: boolean;
  genderLocked: boolean;
  birthLocked: boolean;

  // 개인정보 공개 설정 필드
  isPrivateName: boolean; // 이름 비공개 여부
  isPrivateAge: boolean; // 나이 비공개 여부
  isPrivateGender: boolean; // 성별 비공개 여부
  isAdultConfirmed: boolean; // 성인 인증 확인 여부

  // 알림 설정 필드
  tripAlert: boolean; // 여행 일정 알림
  marketingAgreed: boolean; // 마케팅 수신 동의
  emailAgreed: boolean; // 이메일 수신 동의

  // 동적 키 접근을 위한 인덱스 시그니처 추가
  [key: string]: any;
}

export function useUserProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 로컬 저장소에서 로그인 여부 확인
  const isLoggedIn = !!localStorage.getItem("accessToken");

  useEffect(() => {
    if (!isLoggedIn) {
      setProfile(null);
      return;
    }

    getMyInfo()
      .then((res) => {
        const data = res.data;

        if (data.gender === "MALE") data.gender = "남성";
        else if (data.gender === "FEMALE") data.gender = "여성";

        setProfile(data);
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        navigate("/login");
      });
  }, [isLoggedIn]);

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

  // 프로필 저장
  const saveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);

    try {
      const genderForServer = ["남성", "남자", "남", "MALE", "M"].includes(
        profile.gender?.toUpperCase(),
      )
        ? "MALE"
        : ["여성", "여자", "여", "FEMALE", "F"].includes(
              profile.gender?.toUpperCase(),
            )
          ? "FEMALE"
          : null;

      const payload = {
        nickname: profile.nickname,
        name: profile.name || null,
        notificationEmail: profile.notificationEmail || null,
        gender: genderForServer,
        birthDate: profile.birthDate || null,
        mbti: profile.mbti || null,
        travelStyles: profile.travelStyles || [],
        profileImage: profile.profileImage,
        avatarEmoji: profile.avatarEmoji,
        avatarColor: profile.avatarColor,
      };

      await updateMyInfo(payload);

      const displayGender =
        genderForServer === "MALE"
          ? "남성"
          : genderForServer === "FEMALE"
            ? "여성"
            : "";

      setProfile((prev) => {
        if (!prev) return null;

        // 빈 문자열("")은 false로 처리되어 값이 없을 땐 잠기지 않음
        return {
          ...prev,
          gender: displayGender,
          nameLocked: !!prev.name,
          genderLocked: !!displayGender,
          birthLocked: !!prev.birthDate,
        };
      });
      setHasChanges(false);

      return true;
    } catch (error) {
      alert("저장에 실패했습니다. 다시 시도해주세요.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // 프로필 수정
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    setHasChanges(true);
  };

  // 사진 업로드 트리거
  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  // 아바타 랜덤 변경
  const regenerateAvatar = () => {
    const { emoji, color } = generateRandomAvatar();
    updateProfile({
      avatarEmoji: emoji,
      avatarColor: color,
      profileImage: "",
    });
  };

  // 랜덤 사진 변경
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateProfile({ profileImage: event.target?.result as string });
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  // 여행 스타일 토글
  const toggleTravelStyle = (style: string) => {
    if (!profile) return;

    const styles = profile.travelStyles || [];

    if (styles.includes(style)) {
      updateProfile({ travelStyles: styles.filter((s) => s !== style) });
    } else {
      updateProfile({ travelStyles: [...styles, style] });
    }
  };

  // MBTI 유효성 검사: 비어있거나, 4글자이면서 유효 목록에 포함되어야 함
  const isMBTIValid =
    !profile?.mbti ||
    (profile.mbti.length === 4 && MBTI_TYPES.includes(profile.mbti));

  // 이메일 검증: 값이 있을 때만 형식 확인
  const isEmailValid =
    !profile?.notificationEmail ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.notificationEmail);

  // 생년월일 검증: 입력값이 아예 없거나, 있다면 10자(YYYY-MM-DD)여야 함
  const isBirthValid = !!profile?.birthDate && profile.birthDate.length === 10;

  // 나이 계산
  const age = profile ? calculateAge(profile.birthDate) : 0;

  // 통합 유효성 검사: 모든 조건이 만족되어야만 버튼이 활성화됨
  // 닉네임(필수), MBTI(형식 준수), 이메일(형식 준수), 생년월일(필수 및 완성)
  const isFormValid =
    !!profile?.nickname && isMBTIValid && isEmailValid && isBirthValid;

  // 본인 인증
  const verify = async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        updateProfile({ isVerified: true });
        resolve();
      }, 1000);
    });
  };

  // 계정 탈퇴
  const deleteAccount = async () => {
    // async 추가
    try {
      await withdraw(); // 백엔드 API 호출 추가

      // API 호출 성공 후 로컬 데이터 정리
      localStorage.clear();
      setProfile(null);
      navigate("/");
      return true;
    } catch (error) {
      console.error("탈퇴 처리 중 오류 발생:", error);
      alert("회원 탈퇴에 실패했습니다. 다시 시도해주세요.");
      return false;
    }
  };

  return {
    // State
    profile,
    hasChanges,
    isSaving,
    isFormValid,
    isEmailValid,
    isBirthValid,
    MBTI_TYPES,
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
