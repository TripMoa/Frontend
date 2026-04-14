// src/api/voucher.api.ts

import { api } from "./api";
import type {
  VoucherCreateRequest,
  VoucherResponse,
  VoucherUpdateRequest,
} from "../types/voucher.types";

// 바우처 목록 조회
export const getVouchers = (tripId: number) => {
  return api.get<VoucherResponse[]>(`/trips/${tripId}/vouchers`);
};

// 바우처 상세 조회
export const getVoucher = (tripId: number, voucherId: number) => {
  return api.get<VoucherResponse>(`/trips/${tripId}/vouchers/${voucherId}`);
};

// 바우처 생성
export const createVoucher = (
  tripId: number,
  request: VoucherCreateRequest,
  file: File,
) => {
  const formData = new FormData();

  formData.append(
    "request",
    new Blob([JSON.stringify(request)], {
      type: "application/json",
    }),
  );

  formData.append("file", file);

  return api.post<VoucherResponse>(`/trips/${tripId}/vouchers`, formData);
};

// 바우처 수정
export const updateVoucher = (
  tripId: number,
  voucherId: number,
  request: VoucherUpdateRequest,
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
    formData.append("file", file);
  }

  return api.put<VoucherResponse>(
    `/trips/${tripId}/vouchers/${voucherId}`,
    formData,
  );
};

// 바우처 삭제
export const deleteVoucher = (tripId: number, voucherId: number) => {
  return api.delete<void>(`/trips/${tripId}/vouchers/${voucherId}`);
};
