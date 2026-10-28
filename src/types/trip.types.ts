// src/types/trip.types.ts

import type { ProfileType } from "./auth.types";

// ===================
// Enums & Common
// ===================
export type TripStatus = "ACTIVE" | "ARCHIVED";
export type TripVisibility = "PUBLIC" | "PRIVATE";

// ===================
// Response DTO
// ===================

export interface TripMemberResponse {
  memberId: number;
  userId: number | null;
  nickname: string;
  sortOrder: number;

  profileImage: string | null;
  profileType: ProfileType | null;
  avatarEmoji: string | null;
  avatarColor: string | null;
}

export interface MyTripSummaryResponse {
  tripId: number;
  title: string;
  tripStartDate: string; // ISO Date string
  tripEndDate: string; // ISO Date string
  status: TripStatus;
  visibility: TripVisibility;
  ownerUserId: number;
  ownerName: string;
  members: TripMemberResponse[];
}

export interface TripDetailResponse {
  tripId: number;
  title: string;
  tripStartDate: string;
  tripEndDate: string;
  status: TripStatus;
  visibility: TripVisibility;
  inviteCode: string;
  inviteEnabled: boolean;
  ownerUserId: number;
  ownerName: string;
  members: TripMemberResponse[];
}

// 초대 링크 미리보기 — 멤버가 아닌 사람도 받는 정보라서 식별 정보(userId·프로필 이미지)는 빠져 있다
export interface TripInviteMemberPreview {
  nickname: string;
  profileType: string | null;
  avatarEmoji: string | null;
  avatarColor: string | null;
}

export interface TripInviteResponse {
  /** 이미 멤버일 때만 값이 있다 (워크스페이스로 보내기 위해) */
  tripId: number | null;
  title: string;
  tripStartDate: string;
  tripEndDate: string;
  ownerNickname: string;
  memberCount: number;
  alreadyMember: boolean;
  members: TripInviteMemberPreview[];
}

// ===================
// Request DTO
// ===================

export interface TripCreateRequest {
  title: string;
  tripStartDate: string;
  tripEndDate: string;
  memberUserIds?: number[]; // 선택 사항
}

export interface TripUpdateRequest {
  title: string;
  tripStartDate: string;
  tripEndDate: string;
}

export interface TripVisibilityUpdateRequest {
  visibility: TripVisibility;
}

export interface TripMemberNicknameUpdateRequest {
  nickname: string;
}
