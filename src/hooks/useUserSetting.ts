// hooks/useUserProfile.ts

import { useState, useEffect, useRef } from 'react';
import { STORAGE_KEYS, DEFAULT_PROFILE, generateRandomAvatar } from '../components/user/User.constant';

export interface UserProfile {
  photo: string;
  nickname: string;
  name: string;
  birthDate: string; // YYYY-MM-DD 형식
  gender: string;
  mbti: string;
  travelStyles: string[];
  isVerified: boolean;
  avatarEmoji?: string; // 기본 아바타용
  avatarColor?: string; // 기본 아바타용
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const { emoji, color } = generateRandomAvatar();
    return { 
      ...DEFAULT_PROFILE, 
      travelStyles: [],
      avatarEmoji: emoji,
      avatarColor: color
    };
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 로컬스토리지에서 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (saved) {
      try {
        const parsedProfile = JSON.parse(saved);
        // 기존 프로필에 avatarEmoji/Color가 없으면 생성
        if (!parsedProfile.avatarEmoji || !parsedProfile.avatarColor) {
          const { emoji, color } = generateRandomAvatar();
          parsedProfile.avatarEmoji = emoji;
          parsedProfile.avatarColor = color;
        }
        setProfile(parsedProfile);
      } catch (error) {
        console.error('프로필 불러오기 실패:', error);
      }
    }
  }, []);

  // 변경사항 감지
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const current = JSON.stringify(profile);
    setHasChanges(saved !== current);
  }, [profile]);

  // 프로필 업데이트
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  // 프로필 저장
  const saveProfile = async (): Promise<void> => {
    setIsSaving(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
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
      updateProfile({ travelStyles: styles.filter(s => s !== style) });
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

  // 계정 탈퇴
  const deleteAccount = () => {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    const { emoji, color } = generateRandomAvatar();
    setProfile({ 
      ...DEFAULT_PROFILE, 
      travelStyles: [],
      avatarEmoji: emoji,
      avatarColor: color
    });
  };

  // 나이 계산
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

  // 폼 유효성 검사
  const isFormValid = !!(
    profile.nickname && 
    profile.name && 
    profile.birthDate && 
    profile.gender
  );

  const age = calculateAge(profile.birthDate);

  return {
    // State
    profile,
    hasChanges,
    isSaving,
    isFormValid,
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
  };
}