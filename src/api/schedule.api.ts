// src/api/schedule.api.ts
import { api } from "./api";

// 일정 조회
export const getSchedules = (tripId: number) =>
  api.get(`/schedules?tripId=${tripId}`);

// AI 일정 생성 응답 — 백엔드 ScheduleResponse/ScheduleItemResponse와 같은 모양(생성 때만 의미 있는 필드 포함)
export interface GeneratedScheduleItem {
  id: number;
  time: string;
  title: string;
  description: string;
  category?: string;
  lat?: number;
  lng?: number;
  travelMinutes?: number;
}

export interface GeneratedExcludedPlace {
  name: string;
  category: string;
  reason: string;
}

export interface GeneratedScheduleDay {
  scheduleId: number;
  day: number;
  items: GeneratedScheduleItem[];
  pinWarnings?: string[];
  excludedPlaces?: GeneratedExcludedPlace[];
}

// AI 일정 생성
export const generateSchedule = (body: object) =>
  api.post<GeneratedScheduleDay[]>("/schedules/ai", body);

// AI 일정 생성 전 예상 — 저장 없이 "몇 곳이 들어가고 빠질지"만 계산 (요청 본문은 generateSchedule과 동일)
export type ScheduleEstimate = {
  totalPlaces: number;
  included: number;
  excluded: number;
  maxPerDay: number;
  nDays: number;
  excludedByReason: Record<string, number>;
};

export const estimateSchedule = (body: object) =>
  api.post<ScheduleEstimate>("/schedules/estimate", body);

// 노드 추가
export const createScheduleItem = (body: {
  scheduleId: number;
  time: string;
  title: string;
  description: string;
  category?: string; // 백엔드 카테고리명(관광지/맛집/카페/쇼핑/숙소/출발지)
  lat?: number;
  lng?: number;
}) => api.post("/schedule-items", body);

// 해당 일차(Day) 행 보장 — AI 생성 전에도 직접 노드를 넣을 수 있도록 첫 노드 추가 전에 호출 (이미 있으면 그대로 반환)
export const ensureScheduleDay = (tripId: number, day: number) =>
  api.post("/schedules/days", { tripId, day });

// 구간 실시간 대중교통 경로 (ODsay) — 두 노드 사이의 실제 경로 상위 3개. 서버에도 브라우저에도 저장하지 않는다.
export const getTransitRoutes = (fromItemId: number, toItemId: number) =>
  api.post("/schedule-items/transit", { fromItemId, toItemId });

// 노드 수정
export const updateScheduleItem = (
  itemId: number,
  body: { time?: string; title?: string; description?: string }
) => api.patch(`/schedule-items/${itemId}`, body);

// 노드 삭제
export const deleteScheduleItem = (itemId: number) =>
  api.delete(`/schedule-items/${itemId}`);

// 순서 변경
export const reorderScheduleItems = (itemIds: number[]) =>
  api.patch("/schedule-items/reorder", { itemIds });

// 다른 날로 이동
export const moveScheduleItem = (itemId: number, targetScheduleId: number) =>
  api.patch(`/schedule-items/${itemId}/move`, { targetScheduleId });

// 메모 저장(멤버 공용) — 빈 문자열이면 지운다. 일정 시각과는 무관
export const updateScheduleItemMemo = (itemId: number, memo: string) =>
  api.patch(`/schedule-items/${itemId}/memo`, { memo });

// 장소 바꾸기 — 순서·머무는 시간·고정 시각은 그대로 두고 장소만 교체. 그 일차를 다시 계산해 돌려준다
export const replaceScheduleItemPlace = (
  itemId: number,
  body: { title: string; description?: string; category: string; lat: number; lng: number }
) => api.patch(`/schedule-items/${itemId}/place`, body);

// 한 일차 조회 — 자동 계산이 끝난 뒤 그 일차만 새로 받아온다
export const getScheduleDay = (scheduleId: number) =>
  api.get(`/schedules/${scheduleId}`);

// 자동 시각 계산 켜기/끄기 — 켜면 서버가 머무는 시간을 추정해 채우고 그날 시각을 다시 계산해 그 일차를 돌려준다
export const setScheduleAutoCompute = (scheduleId: number, enabled: boolean) =>
  api.post(`/schedules/${scheduleId}/auto-compute`, { enabled });

// 그날의 시작·종료 시각과 이동수단 (보낸 값만 바뀐다)
export const updateScheduleSettings = (
  scheduleId: number,
  body: { startTime?: string; endTime?: string; transportMode?: string }
) => api.patch(`/schedules/${scheduleId}/settings`, body);

// 노드의 머무는 시간(분)·고정 시각("HH:MM", 빈 문자열이면 해제) — 그 일차를 다시 계산해 돌려준다
export const updateScheduleItemPlan = (
  itemId: number,
  body: { stayMinutes?: number; pinnedTime?: string }
) => api.patch(`/schedule-items/${itemId}/plan`, body);