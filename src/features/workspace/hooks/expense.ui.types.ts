// src/features/workspace/hooks/expense.ui.types.ts

export type ExpenseMember = string;

export type SplitMode = "EQUAL" | "AMOUNT";
export type SplitMap = Partial<Record<ExpenseMember, number>>;

export type PaymentMode = "INDIVIDUAL" | "POOL" | "HYBRID";
export type RoundingRule = "PAYER" | "SEQUENTIAL" | "RANDOM";
export type RemainingRule = "AUTO" | "EQUAL" | "CARRY";

export interface ExpenseItem {
  id: number;
  date: string;
  storeName: string;
  title: string;
  cost: number;
  cat: string;
  payer: ExpenseMember;
  method: string;
  involved: ExpenseMember[];
  expenseKind: "SHARED" | "PERSONAL" | null;
  splitMode: SplitMode;
  split: SplitMap;
  receipt: string | null;
  fileName: string | null;
}

export interface ExpenseSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
}

export interface MemberStatsRow {
  mem: ExpenseMember;
  share: number;
  paid: number;
  diff: number;
}

export interface CategoryStatsRow {
  cat: string;
  amount: number;
  percent: number;
}

export interface PersonalCategoryReferenceRow {
  key: "PERSONAL_REFERENCE";
  amount: number;
  percent: number;
}

export interface SettlementTx {
  from: ExpenseMember;
  to: ExpenseMember;
  amount: number;
}

export interface SettlementDetailRow {
  type: "send" | "receive";
  other: ExpenseMember;
  amount: number;
}

export interface ExpenseSettings {
  paymentMode: PaymentMode;
  roundingRule: RoundingRule;
  remainingRule: RemainingRule;
  sharedBudget: number;
}

export interface DepositLogItem {
  id: number;
  memberId: number;
  memberNickname: ExpenseMember;
  amount: number;
  depositDate: string;
  memo?: string;
  depositStatus: "PENDING" | "CONFIRMED" | "REJECTED";
  depositStatusLabel: string;
}
