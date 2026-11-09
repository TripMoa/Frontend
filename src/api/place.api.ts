// src/api/place.api.ts
import { api } from "./api";

// 백엔드 PlaceResponse와 같은 모양 (place/dto/PlaceResponse.java)
export interface PlaceApiItem {
  id: number;
  tripId: number;
  name: string;
  category: string;
  lat?: number;
  lng?: number;
  address?: string;
  description?: string;
}

// 장소 조회
export const getPlaces = (tripId: number) =>
  api.get<PlaceApiItem[]>(`/places?tripId=${tripId}`);

// 장소 저장
export const createPlace = (body: object) =>
  api.post<PlaceApiItem>("/places", body);

// 장소 수정 (카테고리, 메모)
export const updatePlace = (
  placeId: string,
  body: { category?: string; memo?: string }
) => api.patch<PlaceApiItem>(`/places/${placeId}`, body);

// 장소 삭제
export const deletePlace = (placeId: string) =>
  api.delete(`/places/${placeId}`);

// 백엔드 PlaceSearchResponse.PlaceSearchItem과 같은 모양
export interface PlaceSearchItem {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  category?: string;
  description?: string;
  telephone?: string;
  link?: string;
}

export interface PlaceSearchApiResponse {
  success: boolean;
  total: number;
  display: number;
  places: PlaceSearchItem[];
  query: string;
  method: string;
  message?: string;
}

// 장소 검색 (네이버 API 프록시)
export const searchPlaces = (query: string, display = 12) =>
  api.get<PlaceSearchApiResponse>("/places/search", { params: { query, display } });