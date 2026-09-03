// src/api/place.api.ts
import { api } from "./api";

// 장소 조회
export const getPlaces = (tripId: number) =>
  api.get(`/places?tripId=${tripId}`);

// 장소 저장
export const createPlace = (body: object) =>
  api.post("/places", body);

// 장소 수정 (카테고리, 메모)
export const updatePlace = (
  placeId: string,
  body: { category?: string; memo?: string }
) => api.patch(`/places/${placeId}`, body);

// 장소 삭제
export const deletePlace = (placeId: string) =>
  api.delete(`/places/${placeId}`);

// 장소 검색 (네이버 API 프록시)
export const searchPlaces = (query: string, display = 12) =>
  api.get("/places/search", { params: { query, display } });