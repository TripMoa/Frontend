// src/api/schedule.api.ts
import { api } from "./api";

// 일정 조회
export const getSchedules = (tripId: number) =>
  api.get(`/schedules?tripId=${tripId}`);

// AI 일정 생성
export const generateSchedule = (body: object) =>
  api.post("/schedules/ai", body);

// 노드 추가
export const createScheduleItem = (body: {
  scheduleId: number;
  time: string;
  title: string;
  description: string;
}) => api.post("/schedule-items", body);

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