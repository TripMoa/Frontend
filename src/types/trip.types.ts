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
  ownerUserId: number;
  ownerName: string;
  members: TripMemberResponse[];
}

export interface TripInviteResponse {
  tripId: number;
  title: string;
  tripStartDate: string;
  tripEndDate: string;
  ownerNickname: string;
  memberCount: number;
  members: TripMemberResponse[];
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
