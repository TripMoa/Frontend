import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { generateRandomAvatar, MBTI_TYPES } from "./User.constant";
import {
  getMyInfo,
  updateMyInfo,
  withdraw,
  verifyAdult,
  getTravelStyles,
} from "../../../api/auth.api";
import { useAuth } from "../pages/AuthContext";
import type {
  UserResponse,
  ProfileType,
  UserUpdateRequestDto,
  AgeVerificationStatus,
} from "../../../types";

export interface UserProfile {
  profileImage: string;
  profileType: ProfileType;
  nickname: string;
  name: string;
  notificationEmail: string;
  birthDate: string;
  gender: string;
  mbti: string;
  travelStyles: string[];
  email?: string;
  provider?: "KAKAO" | "GOOGLE" | "NAVER";
  linkedProviders: string[];

  ageVerified: boolean;
  ageVerificationStatus: AgeVerificationStatus;

  avatarEmoji: string;
  avatarColor: string;

  nameLocked: boolean;
  genderLocked: boolean;
  birthLocked: boolean;

  isPrivateName: boolean;
  isPrivateAge: boolean;
  isPrivateGender: boolean;

  tripAlert: boolean;
  marketingAgreed: boolean;
  emailAgreed: boolean;

  [key: string]: any;
}

const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

const deriveAgeVerificationStatus = (
  birthDate: string | null,
  ageVerified: boolean,
): AgeVerificationStatus => {
  if (ageVerified) return "VERIFIED";
  if (!birthDate) return "UNVERIFIED";

  return calculateAge(birthDate) < 19 ? "UNDERAGE" : "UNVERIFIED";
};

const toAgeStatus = (
  status: AgeVerificationStatus | null | undefined,
  fallback: AgeVerificationStatus,
): AgeVerificationStatus => {
  if (
    status === "VERIFIED" ||
    status === "UNDERAGE" ||
    status === "UNVERIFIED"
  ) {
    return status;
  }
  return fallback;
};

const mapUserResponseToProfile = (data: UserResponse): UserProfile => {
  const displayGender =
    data.gender === "MALE" ? "남성" : data.gender === "FEMALE" ? "여성" : "";

  const derivedAgeStatus = deriveAgeVerificationStatus(
    data.birthDate,
    data.ageVerified ?? false,
  );

  return {
    profileImage: data.profileImage ?? "",
    profileType: data.profileType ?? (data.profileImage ? "CUSTOM" : "AVATAR"),
    nickname: data.nickname ?? "",
    name: data.name ?? "",
    notificationEmail: data.notificationEmail ?? "",
    birthDate: data.birthDate ?? "",
    gender: displayGender,
    mbti: data.mbti ?? "",
    travelStyles: data.travelStyles ?? [],
    email: data.email ?? "",
    provider:
      data.provider === "KAKAO" ||
      data.provider === "GOOGLE" ||
      data.provider === "NAVER"
        ? data.provider
        : undefined,
    linkedProviders: data.linkedProviders ?? [],

    ageVerified: data.ageVerified ?? false,
    ageVerificationStatus: toAgeStatus(
      data.ageVerificationStatus,
      derivedAgeStatus,
    ),

    avatarEmoji: data.avatarEmoji ?? "",
    avatarColor: data.avatarColor ?? "",

    nameLocked: !!data.nameLocked,
    genderLocked: !!data.genderLocked,
    birthLocked: !!data.birthLocked,

    isPrivateName: false,
    isPrivateAge: false,
    isPrivateGender: false,

    tripAlert: false,
    marketingAgreed: false,
    emailAgreed: false,
  };
};

export function useUserProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    isAuthenticated,
    authReady,
    clearAuth,
    setProfile: setAuthProfile,
  } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [travelStyleOptions, setTravelStyleOptions] = useState<string[]>([]);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(
    null,
  );

  const getComparableProfile = (profile: UserProfile) => ({
    nickname: profile.nickname,
    name: profile.name,
    notificationEmail: profile.notificationEmail,
    gender: profile.gender,
    birthDate: profile.birthDate,
    mbti: profile.mbti,
    travelStyles: [...(profile.travelStyles ?? [])].sort(),
    profileType: profile.profileType,
    profileImage: profile.profileImage,
    avatarEmoji: profile.avatarEmoji,
    avatarColor: profile.avatarColor,
  });

  useEffect(() => {
    if (!profile || !originalProfile) {
      setHasChanges(false);
      return;
    }

    const current = getComparableProfile(profile);
    const original = getComparableProfile(originalProfile);

    setHasChanges(JSON.stringify(current) !== JSON.stringify(original));
  }, [profile, originalProfile]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;

    getTravelStyles()
      .then((res) => {
        setTravelStyleOptions(res.data.map((style) => style.name));
      })
      .catch((error) => {
        console.error("여행 스타일 목록 조회 실패", error);
      });
  }, [authReady, isAuthenticated]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }
    getMyInfo()
      .then((res) => {
        const mapped = mapUserResponseToProfile(res.data);
        setProfile(mapped);
        setOriginalProfile(mapped);
      })
      .catch(() => {
        clearAuth();
        navigate("/login", { replace: true });
      });
  }, [authReady, isAuthenticated]);

  const saveProfile = async () => {
    if (!profile) return false;
    setIsSaving(true);

    try {
      const normalizedGender = profile.gender?.trim().toUpperCase();

      const genderForServer = ["남성", "남자", "남", "MALE", "M"].includes(
        normalizedGender,
      )
        ? "MALE"
        : ["여성", "여자", "여", "FEMALE", "F"].includes(normalizedGender)
          ? "FEMALE"
          : null;

      const payload: UserUpdateRequestDto = {
        nickname: profile.nickname,
        name: profile.name || undefined,
        notificationEmail: profile.notificationEmail || undefined,
        gender: genderForServer || undefined,
        birthDate: profile.birthDate || undefined,
        mbti: profile.mbti || undefined,
        travelStyles: profile.travelStyles || [],
        profileType: profile.profileType,
        profileImage:
          profile.profileType === "CUSTOM"
            ? profile.profileImage || undefined
            : undefined,
        avatarEmoji:
          profile.profileType === "AVATAR"
            ? profile.avatarEmoji || undefined
            : undefined,
        avatarColor:
          profile.profileType === "AVATAR"
            ? profile.avatarColor || undefined
            : undefined,
      };

      await updateMyInfo(payload);

      const refreshed = await getMyInfo();
      const mapped = mapUserResponseToProfile(refreshed.data);
      setProfile(mapped);
      setOriginalProfile(mapped);
      setAuthProfile(refreshed.data);

      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const regenerateAvatar = () => {
    const { emoji, color } = generateRandomAvatar();

    updateProfile({
      profileType: "AVATAR",
      avatarEmoji: emoji,
      avatarColor: color,
      profileImage: "",
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateProfile({
        profileType: "CUSTOM",
        profileImage: (event.target?.result as string) || "",
      });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const toggleTravelStyle = (style: string) => {
    if (!profile) return;

    const styles = profile.travelStyles || [];

    if (styles.includes(style)) {
      updateProfile({ travelStyles: styles.filter((s) => s !== style) });
    } else {
      updateProfile({ travelStyles: [...styles, style] });
    }
  };

  const isValidBirthDate = (birthDate?: string): boolean => {
    if (!birthDate) return false;

    // YYYY-MM-DD 형식만 허용
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false;

    const [year, month, day] = birthDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return false;
    }

    const today = new Date();

    if (date > today) return false;

    if (year < 1900) return false;

    return true;
  };

  const isMBTIValid =
    !profile?.mbti ||
    (profile.mbti.length === 4 && MBTI_TYPES.includes(profile.mbti));

  const isEmailValid =
    !profile?.notificationEmail ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.notificationEmail);

  const age = profile ? calculateAge(profile.birthDate) : 0;

  const isBirthValid = isValidBirthDate(profile?.birthDate);

  const isFormValid =
    !!profile?.nickname && isMBTIValid && isEmailValid && isBirthValid;

  const verify = async (): Promise<
    "SUCCESS" | "UNDERAGE" | "NEED_BIRTH_DATE" | "FAIL"
  > => {
    if (!profile) return "FAIL";

    if (!profile.birthDate) {
      return "NEED_BIRTH_DATE";
    }

    try {
      const res = await verifyAdult();

      const nextStatus = toAgeStatus(
        res.data.ageVerificationStatus,
        deriveAgeVerificationStatus(profile.birthDate, res.data.ageVerified),
      );

      updateProfile({
        ageVerified: res.data.ageVerified,
        ageVerificationStatus: nextStatus,
      });

      if (nextStatus === "UNDERAGE") {
        return "UNDERAGE";
      }

      if (nextStatus === "VERIFIED") {
        return "SUCCESS";
      }

      return "FAIL";
    } catch (error: any) {
      const code = error?.response?.data?.code;

      if (code === "USER_400_001") {
        return "NEED_BIRTH_DATE";
      }

      if (code === "USER_403_003") {
        updateProfile({
          ageVerified: false,
          ageVerificationStatus: "UNDERAGE",
        });
        return "UNDERAGE";
      }
      return "FAIL";
    }
  };

  const deleteAccount = async () => {
    try {
      await withdraw();
      clearAuth();
      setProfile(null);
      return true;
    } catch (error) {
      console.error("탈퇴 처리 중 오류 발생:", error);
      throw error;
    }
  };

  return {
    profile,
    originalProfile,
    savedAgeStatus: originalProfile?.ageVerificationStatus ?? "UNVERIFIED",
    savedBirthDate: originalProfile?.birthDate ?? "",
    hasChanges,
    isSaving,
    isFormValid,
    isEmailValid,
    isBirthValid,
    MBTI_TYPES,
    fileInputRef,
    age,
    travelStyleOptions,

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
