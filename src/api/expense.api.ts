// src/api/expense.api.ts

import { api } from "./api";
import type {
  ExpenseCreateRequest,
  ExpenseDetailResponse,
  ExpensePreviewRequest,
  ExpensePreviewResponse,
  ExpenseResponse,
} from "../types/expense.types";

// 지출 목록 조회
export const getExpenses = (tripId: number) => {
  return api.get<ExpenseDetailResponse[]>(`/trips/${tripId}/expenses`);
};

// 지출 상세 조회
export const getExpense = (tripId: number, expenseId: number) => {
  return api.get<ExpenseDetailResponse>(
    `/trips/${tripId}/expenses/${expenseId}`,
  );
};

// 지출 생성
export const createExpense = (
  tripId: number,
  request: ExpenseCreateRequest,
  file?: File,
) => {
  const formData = new FormData();

  formData.append(
    "request",
    new Blob([JSON.stringify(request)], {
      type: "application/json",
    }),
  );

  if (file) {
    formData.append("receiptImage", file);
  }

  return api.post(`/trips/${tripId}/expenses`, formData);
};

// 지출 수정
export const updateExpense = (
  tripId: number,
  expenseId: number,
  request: ExpenseCreateRequest,
  file?: File,
) => {
  const formData = new FormData();

  formData.append(
    "request",
    new Blob([JSON.stringify(request)], {
      type: "application/json",
    }),
  );

  if (file) {
    formData.append("receiptImage", file);
  }

  return api.put<ExpenseResponse>(
    `/trips/${tripId}/expenses/${expenseId}`,
    formData,
  );
};

// 지출 삭제
export const deleteExpense = (tripId: number, expenseId: number) => {
  return api.delete<void>(`/trips/${tripId}/expenses/${expenseId}`);
};

// 지출 계산 미리보기
export const previewExpense = (tripId: number, data: ExpensePreviewRequest) => {
  return api.post<ExpensePreviewResponse>(
    `/trips/${tripId}/expenses/preview`,
    data,
  );
};
