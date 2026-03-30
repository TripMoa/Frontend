// src/features/workspace/hooks/expense.calc.ts

import type {
  CategoryStatsRow,
  ExpenseItem,
  ExpenseMember,
  ExpenseSummary,
  PersonalCategoryReferenceRow,
  RoundingRule,
  SettlementDetailRow,
  SettlementTx,
} from "./expense.ui.types";

/* =========================
   공통 유틸
========================= */
const uniqMembers = (arr: ExpenseMember[]) => Array.from(new Set(arr));

export const buildMemberList = (
  items: Array<Pick<ExpenseItem, "payer" | "involved">>,
  fallback: ExpenseMember[],
): ExpenseMember[] => {
  const names = new Set<ExpenseMember>(fallback);

  for (const item of items) {
    if (item.payer) names.add(item.payer);
    for (const member of item.involved ?? []) {
      if (member) names.add(member);
    }
  }

  return Array.from(names);
};

export const normalizeInvolved = (
  involved: ExpenseMember[] | undefined,
  fallbackMembers: ExpenseMember[],
): ExpenseMember[] => {
  const unique = uniqMembers((involved ?? []).filter(Boolean));
  if (unique.length > 0) return unique;
  return fallbackMembers.length > 0 ? [...fallbackMembers] : [];
};

export const isSharedItem = (
  item: Pick<ExpenseItem, "involved" | "expenseKind">,
  memberCount: number,
): boolean => {
  if (item.expenseKind === "SHARED") return true;
  if (item.expenseKind === "PERSONAL") return false;

  const involvedCount = uniqMembers(item.involved ?? []).length;
  return involvedCount >= Math.max(1, memberCount);
};

/* =========================
   분배 계산
========================= */
export const calcSharesForItem = (
  item: Pick<
    ExpenseItem,
    "cost" | "payer" | "involved" | "splitMode" | "split"
  >,
  roundingRule: RoundingRule,
  allMembers: ExpenseMember[],
): Record<ExpenseMember, number> => {
  const involved = normalizeInvolved(item.involved, allMembers);
  const cost = Number(item.cost) || 0;
  const result: Record<ExpenseMember, number> = {};

  for (const member of buildMemberList(
    [{ payer: item.payer, involved }],
    allMembers,
  )) {
    result[member] = 0;
  }

  if (item.splitMode === "AMOUNT") {
    for (const member of involved) {
      result[member] = Number(item.split?.[member] ?? 0) || 0;
    }
    return result;
  }

  const n = Math.max(1, involved.length);
  const base = Math.floor(cost / n);
  const remainder = cost - base * n;

  for (const member of involved) {
    result[member] = base;
  }

  if (remainder > 0) {
    if (roundingRule === "PAYER") {
      const receiver = involved.includes(item.payer) ? item.payer : involved[0];
      result[receiver] = (result[receiver] ?? 0) + remainder;
    } else if (roundingRule === "SEQUENTIAL") {
      for (let i = 0; i < remainder; i += 1) {
        const target = involved[i % n];
        result[target] = (result[target] ?? 0) + 1;
      }
    } else {
      for (let i = 0; i < remainder; i += 1) {
        const target = involved[Math.floor(Math.random() * n)];
        result[target] = (result[target] ?? 0) + 1;
      }
    }
  }

  return result;
};

/* =========================
   fallback 계산
========================= */
export const calcSummaryFallback = (
  items: ExpenseItem[],
  sharedBudget: number,
  memberCount: number,
): ExpenseSummary => {
  const totalSpent = items
    .filter((item) => isSharedItem(item, memberCount))
    .reduce((sum, item) => sum + Number(item.cost || 0), 0);

  const totalBudget = Math.max(0, Math.floor(sharedBudget || 0));

  return {
    totalBudget,
    totalSpent,
    remaining: totalBudget - totalSpent,
  };
};

export const calcMemberStatsFallback = (
  items: ExpenseItem[],
  roundingRule: RoundingRule,
  allMembers: ExpenseMember[],
) => {
  const members = buildMemberList(items, allMembers);
  const totalPaid: Record<ExpenseMember, number> = {};
  const totalShare: Record<ExpenseMember, number> = {};

  for (const member of members) {
    totalPaid[member] = 0;
    totalShare[member] = 0;
  }

  for (const item of items) {
    const cost = Number(item.cost);
    if (!Number.isFinite(cost)) continue;

    if (!(item.payer in totalPaid)) {
      totalPaid[item.payer] = 0;
      totalShare[item.payer] = totalShare[item.payer] ?? 0;
    }
    totalPaid[item.payer] += cost;

    const shares = calcSharesForItem(item, roundingRule, members);
    for (const member of members) {
      totalShare[member] = (totalShare[member] ?? 0) + (shares[member] ?? 0);
    }
  }

  return members.map((member) => ({
    mem: member,
    paid: totalPaid[member] ?? 0,
    share: totalShare[member] ?? 0,
    diff: (totalPaid[member] ?? 0) - (totalShare[member] ?? 0),
  }));
};

export const calcCategoryStatsFallback = (
  items: ExpenseItem[],
  memberCount: number,
): CategoryStatsRow[] => {
  const sharedItems = items.filter((item) => isSharedItem(item, memberCount));
  const totals: Record<string, number> = {};

  for (const item of sharedItems) {
    const key = item.cat || "ETC";
    totals[key] = (totals[key] ?? 0) + Number(item.cost || 0);
  }

  const totalSpent = sharedItems.reduce(
    (sum, item) => sum + Number(item.cost || 0),
    0,
  );

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => ({
      cat,
      amount,
      percent:
        totalSpent > 0 ? Number(((amount / totalSpent) * 100).toFixed(1)) : 0,
    }));
};

export const calcPersonalCategoryReferenceFallback = (
  items: ExpenseItem[],
  memberCount: number,
): PersonalCategoryReferenceRow | null => {
  const personalAmount = items
    .filter((item) => !isSharedItem(item, memberCount))
    .reduce((sum, item) => sum + Number(item.cost || 0), 0);

  if (personalAmount <= 0) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.cost || 0),
    0,
  );

  return {
    key: "PERSONAL_REFERENCE",
    amount: personalAmount,
    percent:
      totalAmount > 0
        ? Number(((personalAmount / totalAmount) * 100).toFixed(1))
        : 0,
  };
};

export const calculateSettlementsFallback = (
  items: ExpenseItem[],
  roundingRule: RoundingRule,
  allMembers: ExpenseMember[],
): SettlementTx[] => {
  const members = buildMemberList(items, allMembers);
  const balances: Record<ExpenseMember, number> = {};

  for (const member of members) {
    balances[member] = 0;
  }

  for (const item of items) {
    const cost = Number(item.cost);
    if (!Number.isFinite(cost)) continue;

    balances[item.payer] = (balances[item.payer] ?? 0) + cost;

    const shares = calcSharesForItem(item, roundingRule, members);
    for (const member of members) {
      balances[member] = (balances[member] ?? 0) - (shares[member] ?? 0);
    }
  }

  const debtors: Array<{ id: ExpenseMember; amount: number }> = [];
  const creditors: Array<{ id: ExpenseMember; amount: number }> = [];

  for (const [member, balance] of Object.entries(balances)) {
    if (balance < -10) debtors.push({ id: member, amount: Math.abs(balance) });
    else if (balance > 10) creditors.push({ id: member, amount: balance });
  }

  const transactions: SettlementTx[] = [];
  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    const debtor = debtors[dIndex];
    const creditor = creditors[cIndex];
    const tradeAmount = Math.min(debtor.amount, creditor.amount);

    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: tradeAmount,
    });

    debtor.amount -= tradeAmount;
    creditor.amount -= tradeAmount;

    if (debtor.amount < 10) dIndex += 1;
    if (creditor.amount < 10) cIndex += 1;
  }

  return transactions;
};

export const settlementDetailForMember = (
  txs: SettlementTx[],
  target: ExpenseMember,
): SettlementDetailRow[] => {
  const rows: SettlementDetailRow[] = [];

  for (const tx of txs) {
    if (tx.from === target) {
      rows.push({ type: "send", other: tx.to, amount: tx.amount });
    } else if (tx.to === target) {
      rows.push({ type: "receive", other: tx.from, amount: tx.amount });
    }
  }

  return rows;
};
