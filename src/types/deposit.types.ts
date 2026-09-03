// src/types/deposit.types.ts

import type { DepositLogStatus } from "./settlement.types";

// ===================
// Request DTO
// ===================

export type DepositLogCreateRequest = {
  memberId: number;
  amount: number;
  depositDate: string;
  memo?: string;
};

// ===================
// Response DTO
// ===================

export type DepositLogResponse = {
  id: number;
  tripId: number;
  memberId: number;
  nickname: string;
  amount: number;
  depositDate: string;
  memo: string | null;
  depositStatus: DepositLogStatus;
};
