// src/types/voucher.types.ts

// ===================
// Request DTO
// ===================

export type VoucherType = "AIR" | "HOTEL" | "TRAIN" | "BUS" | "TOUR" | "ETC";

export type VoucherFileType = "PDF" | "JPG" | "IMG";

export type VoucherCreateRequest = {
  type: VoucherType;
  title: string;
  description?: string;
};

export type VoucherUpdateRequest = {
  type: VoucherType;
  title: string;
  description?: string;
};

// ===================
// Response DTO
// ===================

export type VoucherResponse = {
  voucherId: number;
  tripId: number;
  type: VoucherType;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileType: VoucherFileType;
  fileSize: number;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
};
