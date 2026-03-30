// src/types/settlement.types.ts

// ===================
// Enums & Common
// ===================

export type PaymentMode = "INDEPENDENT" | "POOL" | "HYBRID";
export type SplitRemainderPolicy = "TO_PAYER" | "ROUND_ROBIN" | "RANDOM";
export type PoolBalancePolicy = "EQUAL" | "BY_DEPOSIT_RATIO" | "CARRY_OVER";
export type DepositLogStatus = "PENDING" | "CONFIRMED" | "REJECTED";
export type DepositSummaryStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID";

export type ExpenseCategory =
  | "FOOD"
  | "TRANS"
  | "STAY"
  | "SHOP"
  | "TICKET"
  | "ETC";

export type PayMethod = "CARD" | "CASH" | "QR";
export type SplitMode = "EQUAL" | "AMOUNT";

// ===================
// Request DTO
// ===================

export type SettlementUpdateAllRequest = {
  paymentMode: PaymentMode;
  splitRemainderPolicy: SplitRemainderPolicy;
  poolBalancePolicy: PoolBalancePolicy;
  budgetAmount: number;
};

// ===================
// Response DTO
// ===================

export type SettlementSettingResponse = {
  tripId: number;
  paymentMode: PaymentMode;
  splitRemainderPolicy: SplitRemainderPolicy | null;
  poolBalancePolicy: PoolBalancePolicy | null;
  budgetAmount: number;
  updatedAt: string;
};

export type SummaryCategorySpendResponse = {
  category: ExpenseCategory;
  amount: number;
};

export type SummarySettlementMemberResponse = {
  memberId: number;
  nickname: string;
  paidAmount: number;
  sharedAmount: number;
  balance: number;
};

export type SummaryDepositStatusResponse = {
  memberId: number;
  nickname: string;
  targetAmount: number;
  depositedAmount: number;
  remainingAmount: number;
  overpaidAmount: number;
  status: DepositSummaryStatus;
};

export type SettlementTransactionResponse = {
  fromMemberId: number;
  fromNickname: string;
  toMemberId: number;
  toNickname: string;
  amount: number;
};

export type SettlementSummaryResponse = {
  paymentMode: PaymentMode;
  budgetAmount: number;
  totalSpent: number;
  personalTotal: number;
  remainingAmount: number;
  categorySpend: SummaryCategorySpendResponse[];
  settlement: SummarySettlementMemberResponse[];
  status: SummaryDepositStatusResponse[];
  transactions: SettlementTransactionResponse[];
};
