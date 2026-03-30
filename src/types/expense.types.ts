// src/types/expense.types.ts

import type {
  ExpenseCategory,
  PayMethod,
  PaymentMode,
  SplitMode,
} from "./settlement.types";

// ===================
// Request DTO
// ===================

export type ExpenseSplitCreateRequest = {
  memberId: number;
  amount: number;
};

export type ExpenseCreateRequest = {
  payerMemberId: number;
  paidAt: string;
  storeName: string;
  itemMemo?: string;
  totalAmount: number;
  category: ExpenseCategory;
  payMethod: PayMethod;
  isShared: boolean;
  autoIncludePayer?: boolean;
  splitMode: SplitMode;
  splits?: ExpenseSplitCreateRequest[];
  receiptUrl?: string;
  receiptFileName?: string;
};

export type ExpensePreviewManualSplitRequest = {
  memberId: number;
  amount: number;
};

export type ExpensePreviewRequest = {
  payerMemberId: number;
  totalAmount: number;
  isShared: boolean;
  autoIncludePayer?: boolean;
  splitMode: SplitMode;
  joinedMemberIds?: number[];
  manualSplits?: ExpensePreviewManualSplitRequest[];
};

// ===================
// Response DTO
// ===================

export type ExpenseResponse = {
  id: number;
  tripId: number;
  payerMemberId: number;
  storeName: string;
  itemMemo: string | null;
  totalAmount: number;
  category: ExpenseCategory;
  payMethod: PayMethod;
  isShared: boolean;
  splitMode: SplitMode;
  paidAt: string;
  createdAt: string;
};

export type ExpenseDetailSplitResponse = {
  memberId: number;
  nickname: string;
  amount: number;
  payer: boolean;
};

export type ExpenseDetailResponse = {
  id: number;
  tripId: number;
  payerMemberId: number;
  payerNickname: string;
  storeName: string;
  itemMemo: string | null;
  totalAmount: number;
  category: ExpenseCategory;
  payMethod: PayMethod;
  isShared: boolean;
  autoIncludePayer: boolean;
  splitMode: SplitMode;
  receiptUrl: string | null;
  receiptFileName: string | null;
  paidAt: string;
  createdAt: string;
  splits?: ExpenseDetailSplitResponse[];
};

export type ExpensePreviewSplitResponse = {
  memberId: number;
  nickname: string;
  amount: number;
  payer: boolean;
};

export type ExpensePreviewResponse = {
  paymentMode: PaymentMode;
  splitMode: SplitMode;
  isShared: boolean;
  totalAmount: number;
  splitTotalAmount: number;
  diffAmount: number;
  canSave: boolean;
  message: string | null;
  splits: ExpensePreviewSplitResponse[];
};
