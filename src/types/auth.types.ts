// src/types/auth.types.ts

// ===================
// Enums & Common
// ===================

export type AgeVerificationStatus = "UNVERIFIED" | "VERIFIED" | "UNDERAGE";

export type Gender = "MALE" | "FEMALE" | "OTHER" | null;

export type ProfileType = "CUSTOM" | "AVATAR";

export type RefreshTokenResponse = {
  accessToken?: string;
  authenticated: boolean;
  reason?: "SUSPENDED" | string;
  message?: string;
};

export type TravelStyleOption = {
  id: number;
  name: string;
};

// ===================
// Request DTO
// ===================

export interface CheckEmailRequest {
  email: string;
}

export interface UserUpdateRequestDto {
  nickname?: string;
  name?: string;
  notificationEmail?: string;
  gender?: Exclude<Gender, null>;
  birthDate?: string; // "YYYY-MM-DD"
  mbti?: string;
  travelStyles?: string[];
  profileImage?: string;
  profileType?: ProfileType;
  avatarEmoji?: string;
  avatarColor?: string;
}

// ===================
// Response DTO
// ===================

export interface CheckEmailResponse {
  exists: boolean;
  userId: number | null;
  email: string | null;
  name: string | null;
}

export interface AgeVerificationResponse {
  ageVerified: boolean;
  ageVerificationStatus: AgeVerificationStatus;
}

export interface UserResponse {
  // 식별
  id: number;

  // 기본 정보
  nickname: string;
  name: string | null;
  email: string | null;
  notificationEmail: string | null;
  gender: Gender;
  birthDate: string | null; // "YYYY-MM-DD"
  mbti: string | null;

  // 프로필 이미지
  profileImage: string | null;
  profileType: ProfileType;
  avatarEmoji: string | null;
  avatarColor: string | null;

  // 소셜 계정
  provider: string | null;
  linkedProviders: string[];

  // 잠금 여부
  nameLocked: boolean;
  genderLocked: boolean;
  birthLocked: boolean;

  // 인증
  ageVerified: boolean;
  ageVerificationStatus: AgeVerificationStatus;

  // 여행 스타일
  travelStyles: string[];
}
