// src/api/deposit.api.ts

import { api } from "./api";
import type {
  DepositLogCreateRequest,
  DepositLogResponse,
} from "../types/deposit.types";

// 입금 로그 생성
export const createDepositLog = (
  tripId: number,
  data: DepositLogCreateRequest,
) => {
  return api.post<DepositLogResponse>(`/trips/${tripId}/deposits`, data);
};

// 입금 로그 조회
export const getMemberDepositLogs = (tripId: number, memberId: number) =>
  api.get<DepositLogResponse[]>(
    `/trips/${tripId}/deposits/members/${memberId}`,
  );

// 입금 로그 삭제
export const deleteDepositLog = (tripId: number, depositLogId: number) => {
  return api.delete<void>(`/trips/${tripId}/deposits/${depositLogId}`);
};

// 입금 로그 승인
export const confirmDepositLog = (tripId: number, depositLogId: number) => {
  return api.patch<DepositLogResponse>(
    `/trips/${tripId}/deposits/${depositLogId}/confirm`,
  );
};

// 입금 로그 거절
export const rejectDepositLog = (tripId: number, depositLogId: number) => {
  return api.patch<DepositLogResponse>(
    `/trips/${tripId}/deposits/${depositLogId}/reject`,
  );
};
