// src/types/auth.types.ts

// ===================
// Enums & Common
// ===================

export type Gender = "MALE" | "FEMALE" | "OTHER" | null;

export type ProfileType = "CUSTOM" | "AVATAR";

export type RefreshTokenResponse = {
  accessToken?: string;
  authenticated?: boolean;
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

export interface UserResponse {
  id: number;
  nickname: string;
  name: string | null;
  email: string | null;
  provider: string | null;
  notificationEmail: string | null;
  gender: Gender;
  mbti: string | null;
  profileImage: string | null;
  profileType?: ProfileType;
  avatarEmoji: string | null;
  avatarColor: string | null;
  birthDate: string | null; // LocalDate -> "YYYY-MM-DD"
  nameLocked: boolean;
  genderLocked: boolean;
  birthLocked: boolean;
  travelStyles: string[];
}
