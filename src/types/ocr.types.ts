// src/types/ocr.types.ts

import type { ExpenseCategory, PayMethod, SplitMode } from "./settlement.types";
import type { ExpensePreviewResponse } from "./expense.types";

// ===================
// Request DTO
// ===================

export type OcrAutofillRequest = {
  payerMemberId: number;
  isShared: boolean;
  autoIncludePayer?: boolean;
  splitMode: SplitMode;
  joinedMemberIds?: number[];
};

// ===================
// Response DTO
// ===================

export type OcrInitialResponse = {
  storeName: string | null;
  menuName: string | null;
  paymentMethod: string | null;
  dateTime: string | null;
  totalAmount: number | null;
};

export type OcrAutofillResponse = {
  storeName: string | null;
  itemMemo: string | null;
  category: ExpenseCategory;
  payMethod: PayMethod;
  paidAt: string | null;
  totalAmount: number | null;
};

export type OcrAutofillWithPreviewResponse = {
  autofill: OcrAutofillResponse;
  preview: ExpensePreviewResponse;
};
