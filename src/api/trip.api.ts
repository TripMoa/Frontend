// src/api/trip.api.ts

import { api } from "./api";
import type {
  MyTripSummaryResponse,
  TripDetailResponse,
  TripMemberResponse,
  TripCreateRequest,
  TripUpdateRequest,
  TripVisibilityUpdateRequest,
  TripMemberNicknameUpdateRequest,
  TripVisibility,
} from "../types/trip.types";

// 내가 소유한 여행 목록 조회
export const getMyTrips = (visibility?: TripVisibility) =>
  api.get<MyTripSummaryResponse[]>("/trips/my", { params: { visibility } });

// 내가 멤버로 참여한 여행 목록 조회
export const getInvitedTrips = () =>
  api.get<MyTripSummaryResponse[]>("/trips/invited");

// 여행 생성
export const createTrip = (data: TripCreateRequest) =>
  api.post<TripDetailResponse>("/trips", data);

// 여행 상세 조회
export const getTripDetail = (tripId: number) =>
  api.get<TripDetailResponse>(`/trips/${tripId}`);

// 여행 멤버 목록 조회
export const getTripMembers = (tripId: number) =>
  api.get<TripMemberResponse[]>(`/trips/${tripId}/members`);

// 여행 기본 정보 수정
export const updateTrip = (tripId: number, data: TripUpdateRequest) =>
  api.patch<TripDetailResponse>(`/trips/${tripId}`, data);

// 여행 공개 여부 수정
export const updateTripVisibility = (
  tripId: number,
  data: TripVisibilityUpdateRequest,
) => api.patch<TripDetailResponse>(`/trips/${tripId}/visibility`, data);

// 여행 멤버 닉네임 수정
export const updateTripMemberNickname = (
  tripId: number,
  memberId: number,
  data: TripMemberNicknameUpdateRequest,
) =>
  api.patch<TripMemberResponse>(
    `/trips/${tripId}/members/${memberId}/nickname`,
    data,
  );

// 여행 삭제
export const deleteTrip = (tripId: number) =>
  api.delete<void>(`/trips/${tripId}`);
