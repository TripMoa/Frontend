// src/features/workspace/hooks/expense.mapper.ts

import type {
  ExpenseDetailResponse,
  ExpenseResponse,
} from "../../../types/expense.types";
import type {
  PoolBalancePolicy,
  SettlementSettingResponse,
  SettlementSummaryResponse,
  SettlementTransactionResponse,
  SplitRemainderPolicy,
  SummarySettlementMemberResponse,
} from "../../../types/settlement.types";
import type { TripMemberResponse } from "../../../types/trip.types";
import type {
  CategoryStatsRow,
  ExpenseItem,
  ExpenseSettings,
  MemberStatsRow,
  PaymentMode,
  PersonalCategoryReferenceRow,
  RemainingRule,
  RoundingRule,
  SettlementTx,
  SplitMap,
} from "./expense.ui.types";

/* =========================
   공통 유틸
========================= */
const safeDateOnly = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
};

const floorAmount = (value: unknown): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
};

const nicknameByMemberId = (
  members: TripMemberResponse[],
  memberId: number | null | undefined,
): string | null => {
  if (!memberId) return null;
  return (
    members.find((member) => member.memberId === memberId)?.nickname ?? null
  );
};

const buildSplitMapFromServer = (
  row: ExpenseResponse | ExpenseDetailResponse,
  members: TripMemberResponse[],
): SplitMap => {
  const rawSplits = (row as any).splits;

  if (!Array.isArray(rawSplits) || rawSplits.length === 0) {
    const payerNickname = nicknameByMemberId(
      members,
      (row as any).payerMemberId,
    );
    return payerNickname
      ? { [payerNickname]: floorAmount((row as any).totalAmount) }
      : {};
  }

  return rawSplits.reduce((acc: SplitMap, splitRow: any) => {
    const nickname =
      nicknameByMemberId(members, splitRow?.memberId) ??
      splitRow?.nickname ??
      splitRow?.memberNickname ??
      null;

    if (!nickname) return acc;
    acc[nickname] = floorAmount(splitRow?.amount);
    return acc;
  }, {});
};

const buildInvolvedFromServer = (
  row: ExpenseResponse | ExpenseDetailResponse,
  members: TripMemberResponse[],
  split: SplitMap,
): string[] => {
  const rawSplits = (row as any).splits;

  if (Array.isArray(rawSplits) && rawSplits.length > 0) {
    const fromSplits = rawSplits
      .map(
        (splitRow: any) =>
          nicknameByMemberId(members, splitRow?.memberId) ??
          splitRow?.nickname ??
          splitRow?.memberNickname ??
          null,
      )
      .filter((nickname: string | null): nickname is string =>
        Boolean(nickname),
      );

    if (fromSplits.length > 0) return Array.from(new Set(fromSplits));
  }

  if ((row as any).isShared) return members.map((member) => member.nickname);

  const payerNickname = nicknameByMemberId(members, (row as any).payerMemberId);
  if (payerNickname) return [payerNickname];

  const splitMembers = Object.keys(split);
  return splitMembers.length > 0 ? splitMembers : [];
};

/* =========================
   서버 enum -> UI enum
========================= */
export const mapServerPaymentModeToUi = (
  paymentMode: "INDEPENDENT" | "POOL" | "HYBRID",
): PaymentMode => {
  if (paymentMode === "POOL") return "POOL";
  if (paymentMode === "HYBRID") return "HYBRID";
  return "INDIVIDUAL";
};

export const mapServerRoundingRuleToUi = (
  rule: SplitRemainderPolicy | null,
): RoundingRule => {
  if (rule === "ROUND_ROBIN") return "SEQUENTIAL";
  if (rule === "RANDOM") return "RANDOM";
  return "PAYER";
};

export const mapServerRemainingRuleToUi = (
  rule: PoolBalancePolicy | null,
): RemainingRule => {
  if (rule === "EQUAL") return "EQUAL";
  if (rule === "CARRY_OVER") return "CARRY";
  return "AUTO";
};

/* =========================
   UI enum -> 서버 enum
========================= */
export const mapUiPaymentModeToServer = (
  paymentMode: PaymentMode,
): "INDEPENDENT" | "POOL" | "HYBRID" => {
  if (paymentMode === "POOL") return "POOL";
  if (paymentMode === "HYBRID") return "HYBRID";
  return "INDEPENDENT";
};

export const mapUiRoundingRuleToServer = (
  rule: RoundingRule,
): SplitRemainderPolicy => {
  if (rule === "SEQUENTIAL") return "ROUND_ROBIN";
  if (rule === "RANDOM") return "RANDOM";
  return "TO_PAYER";
};

export const mapUiRemainingRuleToServer = (
  rule: RemainingRule,
): PoolBalancePolicy => {
  if (rule === "EQUAL") return "EQUAL";
  if (rule === "CARRY") return "CARRY_OVER";
  return "BY_DEPOSIT_RATIO";
};

/* =========================
   서버 응답 -> UI 타입
========================= */
export const mapServerSettingToUi = (
  data: SettlementSettingResponse,
): ExpenseSettings => ({
  paymentMode: mapServerPaymentModeToUi(data.paymentMode),
  roundingRule: mapServerRoundingRuleToUi(data.splitRemainderPolicy),
  remainingRule: mapServerRemainingRuleToUi(data.poolBalancePolicy),
  sharedBudget: Math.max(0, Math.floor(data.budgetAmount ?? 0)),
});

export const mapExpenseResponseToItem = (
  row: ExpenseResponse,
  members: TripMemberResponse[],
): ExpenseItem => {
  const memberNames = members.map((member) => member.nickname);
  const payerNickname =
    members.find((member) => member.memberId === row.payerMemberId)?.nickname ??
    String(row.payerMemberId);

  const split = buildSplitMapFromServer(row, members);
  const involved = buildInvolvedFromServer(row, members, split);

  return {
    id: row.id,
    date: safeDateOnly(row.paidAt),
    storeName: row.storeName,
    title: row.itemMemo ?? row.storeName,
    cost: row.totalAmount,
    cat: row.category,
    payer: payerNickname,
    method: row.payMethod,
    involved,
    expenseKind: row.isShared ? "SHARED" : "PERSONAL",
    splitMode: row.splitMode,
    split,
    receipt: (row as any).receiptUrl ?? null,
    fileName: (row as any).receiptFileName ?? null,
  };
};

export const mapSummaryMemberStats = (
  rows: SummarySettlementMemberResponse[],
  members: TripMemberResponse[],
): MemberStatsRow[] => {
  const rowMap = new Map(rows.map((row) => [row.nickname, row]));

  const orderedNames =
    members.length > 0
      ? members.map((member) => member.nickname)
      : rows.map((row) => row.nickname);

  return orderedNames.map((nickname) => {
    const found = rowMap.get(nickname);

    return {
      mem: nickname,
      share: found?.sharedAmount ?? 0,
      paid: found?.paidAmount ?? 0,
      diff: found?.balance ?? 0,
    };
  });
};

export const mapSummaryCategoryStats = (
  summary: SettlementSummaryResponse,
): CategoryStatsRow[] => {
  const totalSpent = Math.max(0, summary.totalSpent);

  return [...summary.categorySpend]
    .sort((a, b) => b.amount - a.amount)
    .map((row) => ({
      cat: row.category,
      amount: row.amount,
      percent:
        totalSpent > 0
          ? Number(((row.amount / totalSpent) * 100).toFixed(1))
          : 0,
    }));
};

export const mapSummaryPersonalReference = (
  summary: SettlementSummaryResponse,
): PersonalCategoryReferenceRow | null => {
  if (summary.personalTotal <= 0) return null;

  const totalAmount = summary.totalSpent + summary.personalTotal;

  return {
    key: "PERSONAL_REFERENCE",
    amount: summary.personalTotal,
    percent:
      totalAmount > 0
        ? Number(((summary.personalTotal / totalAmount) * 100).toFixed(1))
        : 0,
  };
};

export const mapSummaryTransactions = (
  rows: SettlementTransactionResponse[],
): SettlementTx[] =>
  rows.map((row) => ({
    from: row.fromNickname,
    to: row.toNickname,
    amount: row.amount,
  }));

export const buildSettlementUpdateRequest = (settings: ExpenseSettings) => ({
  paymentMode: mapUiPaymentModeToServer(settings.paymentMode),
  splitRemainderPolicy: mapUiRoundingRuleToServer(settings.roundingRule),
  poolBalancePolicy: mapUiRemainingRuleToServer(settings.remainingRule),
  budgetAmount: Math.max(0, Math.floor(settings.sharedBudget || 0)),
});
