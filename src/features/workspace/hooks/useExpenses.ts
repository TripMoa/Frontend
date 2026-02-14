//src\features\workspace\hooks\useExpenses.ts
import { useEffect, useMemo, useState } from "react";

/* ==========================================
   constants
========================================== */
export const EXPENSE_MEMS = ["ME", "J", "K", "M"] as const;
export type ExpenseMember = (typeof EXPENSE_MEMS)[number];

export const TOTAL_BUDGET = 1000000; // 기본 공통 예산(초기값)
const LS_EXPENSES = "tripmoa_expenses";
const LS_SETTINGS = "tripmoa_expense_settings";

/* ==========================================
   Types
========================================== */
export type ExpenseCategory = string;
export type ExpenseMethod = string;

export type SplitMode = "EQUAL" | "AMOUNT";
export type SplitMap = Partial<Record<ExpenseMember, number>>;

export interface ExpenseItem {
  id: number;
  date: string; // "YYYY-MM-DD"
  storeName: string;
  title: string;
  cost: number;
  cat: ExpenseCategory;
  payer: ExpenseMember;
  method: ExpenseMethod;

  /** 참여자. 비어있으면 전체(공동)로 취급 */
  involved: ExpenseMember[];

  /** 분할 방식 */
  splitMode: SplitMode;

  /** splitMode === "AMOUNT" 일 때만 사용 (멤버별 금액) */
  split: SplitMap;

  /** 영수증 이미지(base64) */
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
  share: number; // 부담
  paid: number; // 결제
  diff: number; // paid - share
}

export interface CategoryStatsRow {
  cat: string;
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

/** 정산 방식 설정 */
export type PaymentMode = "INDIVIDUAL" | "POOL" | "HYBRID";

/** 1원 처리(나머지 분배) */
export type RoundingRule = "PAYER" | "SEQUENTIAL" | "RANDOM";

/** 남은 금액 처리(POOL/HYBRID 전용) */
export type RemainingRule = "AUTO" | "EQUAL" | "CARRY";

export interface ExpenseSettings {
  paymentMode: PaymentMode;
  roundingRule: RoundingRule;

  /** 남은 금액 처리(POOL/HYBRID 전용) */
  remainingRule: RemainingRule;

  /** 공통 예산/모임통장 금액 */
  sharedBudget: number;
}

/* ==========================================
   Helpers
========================================== */
const isMember = (v: unknown): v is ExpenseMember =>
  typeof v === "string" && (EXPENSE_MEMS as readonly string[]).includes(v);

const isSplitMode = (v: unknown): v is SplitMode =>
  v === "EQUAL" || v === "AMOUNT";

const normalizeInvolved = (v: unknown): ExpenseMember[] => {
  if (!Array.isArray(v)) return [...EXPENSE_MEMS];
  const list = v.filter(isMember);
  return list.length > 0
    ? (Array.from(new Set(list)) as ExpenseMember[])
    : [...EXPENSE_MEMS];
};

const normalizeSplit = (v: unknown): SplitMap => {
  if (typeof v !== "object" || v === null) return {};
  const obj = v as Record<string, unknown>;
  const out: SplitMap = {};
  for (const m of EXPENSE_MEMS) {
    const val = obj[m];
    const num =
      typeof val === "number" ? val : typeof val === "string" ? Number(val) : 0;
    if (Number.isFinite(num) && num !== 0) out[m] = num;
  }
  return out;
};

const uniqMembers = (arr: ExpenseMember[]) => Array.from(new Set(arr));

/** ✅ 참여자가 전체 멤버(ALL)이면 공동지출 */
const isSharedItem = (
  item: Pick<ExpenseItem, "involved">,
  memberCount: number,
) => uniqMembers(item.involved ?? []).length === memberCount;

/** ✅ 1원 처리에서 순서 분배: 결제자부터 시작 */
const orderFromPayer = (involved: ExpenseMember[], payer: ExpenseMember) => {
  const uniq = uniqMembers(involved);
  const idx = uniq.indexOf(payer);
  if (idx === -1) return uniq;
  return [...uniq.slice(idx), ...uniq.slice(0, idx)];
};

const safeParseExpenses = (raw: string | null): ExpenseItem[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const normalized: ExpenseItem[] = [];

    for (const it of parsed) {
      if (typeof it !== "object" || it === null) continue;
      const obj = it as Record<string, unknown>;

      const id = typeof obj.id === "number" ? obj.id : null;
      const date = typeof obj.date === "string" ? obj.date : null;

      const title = typeof obj.title === "string" ? obj.title : null;
      const storeName = typeof obj.storeName === "string" ? obj.storeName : "";

      const cost =
        typeof obj.cost === "number"
          ? obj.cost
          : typeof obj.cost === "string"
            ? Number(obj.cost)
            : null;

      const cat = typeof obj.cat === "string" ? obj.cat : "";
      const method = typeof obj.method === "string" ? obj.method : "";

      const payer = isMember(obj.payer) ? obj.payer : null;
      const involved = normalizeInvolved(obj.involved);

      const splitMode = isSplitMode(obj.splitMode) ? obj.splitMode : "EQUAL";
      const split = normalizeSplit(obj.split);

      const receipt =
        typeof obj.receipt === "string"
          ? obj.receipt
          : obj.receipt === null
            ? null
            : null;

      const fileName =
        typeof obj.fileName === "string"
          ? obj.fileName
          : obj.fileName === null
            ? null
            : null;

      if (
        id === null ||
        date === null ||
        title === null ||
        cost === null ||
        !Number.isFinite(cost) ||
        payer === null
      ) {
        continue;
      }

      normalized.push({
        id,
        date,
        storeName,
        title,
        cost: Number(cost),
        cat,
        payer,
        method,
        involved,
        splitMode,
        split,
        receipt,
        fileName,
      });
    }

    return normalized;
  } catch {
    return [];
  }
};

const writeExpenses = (items: ExpenseItem[]) => {
  localStorage.setItem(LS_EXPENSES, JSON.stringify(items));
};

const defaultSettings: ExpenseSettings = {
  paymentMode: "INDIVIDUAL",
  roundingRule: "PAYER",
  remainingRule: "AUTO",
  sharedBudget: TOTAL_BUDGET,
};

const safeParseSettings = (raw: string | null): ExpenseSettings => {
  if (!raw) return defaultSettings;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return defaultSettings;
    const obj = parsed as Record<string, unknown>;

    const paymentMode: PaymentMode =
      obj.paymentMode === "POOL"
        ? "POOL"
        : obj.paymentMode === "HYBRID"
          ? "HYBRID"
          : "INDIVIDUAL";

    const roundingRule: RoundingRule =
      obj.roundingRule === "SEQUENTIAL"
        ? "SEQUENTIAL"
        : obj.roundingRule === "RANDOM"
          ? "RANDOM"
          : "PAYER";

    const remainingRule: RemainingRule =
      obj.remainingRule === "EQUAL"
        ? "EQUAL"
        : obj.remainingRule === "CARRY"
          ? "CARRY"
          : "AUTO";

    const sharedBudgetRaw =
      typeof obj.sharedBudget === "number"
        ? obj.sharedBudget
        : typeof obj.sharedBudget === "string"
          ? Number(obj.sharedBudget)
          : TOTAL_BUDGET;

    const sharedBudget =
      Number.isFinite(sharedBudgetRaw) && sharedBudgetRaw >= 0
        ? Math.floor(sharedBudgetRaw)
        : TOTAL_BUDGET;

    return { paymentMode, roundingRule, remainingRule, sharedBudget };
  } catch {
    return defaultSettings;
  }
};

const writeSettings = (settings: ExpenseSettings) => {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
};

/* ==========================================
   Core calculations
========================================== */

/**
 * ✅ splitMode별 멤버별 부담액 계산
 * - EQUAL: cost를 참여자 수로 나눔
 * - AMOUNT: split 사용 (UI에서 합 검증)
 * ✅ roundingRule: 1원 처리 방식
 */
export const calcSharesForItem = (
  item: Pick<
    ExpenseItem,
    "cost" | "payer" | "involved" | "splitMode" | "split"
  >,
  roundingRule: RoundingRule = "PAYER",
): Record<ExpenseMember, number> => {
  const cost = Number(item.cost) || 0;
  const involved = item.involved?.length ? item.involved : [...EXPENSE_MEMS];

  const result: Record<ExpenseMember, number> = { ME: 0, J: 0, K: 0, M: 0 };

  if (item.splitMode === "AMOUNT") {
    for (const m of involved) result[m] = Number(item.split?.[m] ?? 0) || 0;
    return result;
  }

  const n = involved.length || 1;
  const base = Math.floor(cost / n);
  const remainder = cost - base * n;

  for (const m of involved) result[m] = base;

  // ✅ remainder 만큼 +1씩 분배
  if (remainder > 0) {
    if (roundingRule === "PAYER") {
      const receiver = involved.includes(item.payer) ? item.payer : involved[0];
      result[receiver] += remainder;
    } else if (roundingRule === "SEQUENTIAL") {
      for (let i = 0; i < remainder; i++) {
        const target = involved[i % n]; // 참여자 순서대로
        result[target] += 1;
      }
    } else {
      for (let i = 0; i < remainder; i++) {
        const target = involved[Math.floor(Math.random() * n)];
        result[target] += 1;
      }
    }
  }

  return result;
};

/** ✅ 상단 요약은 '공동(SHARED)'만 반영 */
const calcSummary = (
  items: ExpenseItem[],
  sharedBudget: number,
  memberCount: number,
): ExpenseSummary => {
  const sharedSpent = items
    .filter((it) => isSharedItem(it, memberCount))
    .reduce((sum, item) => sum + Number(item.cost), 0);

  const totalBudget = Math.max(0, Math.floor(sharedBudget || 0));
  const totalSpent = sharedSpent;
  const remaining = totalBudget - totalSpent;

  return { totalBudget, totalSpent, remaining };
};

const calcMemberStats = (
  items: ExpenseItem[],
  roundingRule: RoundingRule,
): MemberStatsRow[] => {
  const totalPaid: Record<ExpenseMember, number> = { ME: 0, J: 0, K: 0, M: 0 };
  const totalShare: Record<ExpenseMember, number> = { ME: 0, J: 0, K: 0, M: 0 };

  for (const item of items) {
    const cost = Number(item.cost);
    if (!Number.isFinite(cost)) continue;

    totalPaid[item.payer] += cost;

    const shares = calcSharesForItem(item, roundingRule);
    for (const m of EXPENSE_MEMS) totalShare[m] += shares[m] || 0;
  }

  return EXPENSE_MEMS.map((m) => {
    const paid = totalPaid[m];
    const share = totalShare[m];
    return { mem: m, paid, share, diff: paid - share };
  });
};

const calcCategoryStats = (items: ExpenseItem[]): CategoryStatsRow[] => {
  const catSum: Record<string, number> = {};
  for (const item of items) {
    const key = item.cat || "기타";
    catSum[key] = (catSum[key] || 0) + Number(item.cost);
  }

  const totalSpent =
    items.reduce((sum, item) => sum + Number(item.cost), 0) || 1;
  const sortedCats = Object.keys(catSum).sort((a, b) => catSum[b] - catSum[a]);

  return sortedCats.map((cat) => {
    const amount = catSum[cat];
    const percent = Number(((amount / totalSpent) * 100).toFixed(1));
    return { cat, amount, percent };
  });
};

const calculateSettlements = (
  items: ExpenseItem[],
  roundingRule: RoundingRule,
): SettlementTx[] => {
  const balances: Record<ExpenseMember, number> = { ME: 0, J: 0, K: 0, M: 0 };

  for (const item of items) {
    const cost = Number(item.cost);
    if (!Number.isFinite(cost)) continue;

    balances[item.payer] += cost;

    const shares = calcSharesForItem(item, roundingRule);
    for (const m of EXPENSE_MEMS) balances[m] -= shares[m] || 0;
  }

  const debtors: Array<{ id: ExpenseMember; amount: number }> = [];
  const creditors: Array<{ id: ExpenseMember; amount: number }> = [];

  (Object.entries(balances) as Array<[ExpenseMember, number]>).forEach(
    ([mem, bal]) => {
      if (bal < -10) debtors.push({ id: mem, amount: Math.abs(bal) });
      else if (bal > 10) creditors.push({ id: mem, amount: bal });
    },
  );

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

const settlementDetailForMember = (
  txs: SettlementTx[],
  target: ExpenseMember,
): SettlementDetailRow[] => {
  const myTrans = txs.filter((t) => t.from === target || t.to === target);
  if (myTrans.length === 0) return [];

  const rows: SettlementDetailRow[] = [];
  for (const t of myTrans) {
    if (t.from === target)
      rows.push({ type: "send", other: t.to, amount: t.amount });
    else rows.push({ type: "receive", other: t.from, amount: t.amount });
  }
  return rows;
};

/* ==========================================
   Hook
========================================== */
export type UseExpensesStore = ReturnType<typeof useExpenses>;

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [filterDate, setFilterDate] = useState<string>("ALL");

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentReceiptBase64, setCurrentReceiptBase64] = useState<
    string | null
  >(null);

  // ✅ 정산 설정(결제 방식/1원 처리/공동 예산)
  const [settings, setSettings] = useState<ExpenseSettings>(() =>
    safeParseSettings(localStorage.getItem(LS_SETTINGS)),
  );

  useEffect(() => {
    const stored = safeParseExpenses(localStorage.getItem(LS_EXPENSES));
    setExpenses(stored);
  }, []);

  useEffect(() => {
    writeExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    writeSettings(settings);
  }, [settings]);

  const summary = useMemo(
    () => calcSummary(expenses, settings.sharedBudget, EXPENSE_MEMS.length),
    [expenses, settings.sharedBudget],
  );

  const memberStats = useMemo(
    () => calcMemberStats(expenses, settings.roundingRule),
    [expenses, settings.roundingRule],
  );

  const categoryStats = useMemo(() => calcCategoryStats(expenses), [expenses]);

  const settlements = useMemo(
    () => calculateSettlements(expenses, settings.roundingRule),
    [expenses, settings.roundingRule],
  );

  const filteredList = useMemo<ExpenseItem[]>(() => {
    let list = expenses;

    if (filterDate !== "ALL") {
      const date = filterDate.startsWith("DAY:")
        ? filterDate.split(":")[1]
        : filterDate;
      list = expenses.filter((item) => item.date === date);
    }

    return [...list].sort((a, b) => b.id - a.id);
  }, [expenses, filterDate]);

  const setFilter = (date: string) => setFilterDate(date);

  const setPaymentMode = (paymentMode: PaymentMode) =>
    setSettings((prev) => ({ ...prev, paymentMode }));

  const setRoundingRule = (roundingRule: RoundingRule) =>
    setSettings((prev) => ({ ...prev, roundingRule }));

  const setSharedBudget = (sharedBudget: number) =>
    setSettings((prev) => ({
      ...prev,
      sharedBudget: Math.max(0, Math.floor(sharedBudget || 0)),
    }));

  const setRemainingRule = (remainingRule: RemainingRule) =>
    setSettings((prev) => ({ ...prev, remainingRule }));

  const resetReceiptUI = () => {
    setCurrentReceiptBase64(null);
    setCurrentFileName(null);
  };

  const openAddModal = () => {
    setEditingId(null);
    resetReceiptUI();
    setIsExpenseModalOpen(true);
  };

  const openEditModal = (id: number) => {
    setEditingId(id);
    const item = expenses.find((d) => d.id === id);
    if (!item) return;

    setCurrentReceiptBase64(item.receipt ?? null);
    setCurrentFileName(item.fileName ?? null);
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setEditingId(null);
    resetReceiptUI();
  };

  const getEditingExpense = (): ExpenseItem | null => {
    if (!editingId) return null;
    return expenses.find((d) => d.id === editingId) ?? null;
  };

  const saveExpense = (payload: Omit<ExpenseItem, "id">) => {
    if (editingId) {
      setExpenses((prev) => {
        const idx = prev.findIndex((d) => d.id === editingId);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...payload, id: editingId };
        return next;
      });
      closeExpenseModal();
      return;
    }

    const newId = Date.now();
    setExpenses((prev) => [...prev, { id: newId, ...payload }]);
    closeExpenseModal();
  };

  const deleteCurrentExpense = () => {
    if (!editingId) return;
    setExpenses((prev) => prev.filter((d) => d.id !== editingId));
    closeExpenseModal();
  };

  const getSettlementDetail = (target: ExpenseMember) =>
    settlementDetailForMember(settlements, target);

  return {
    expenses,
    filterDate,
    isExpenseModalOpen,
    editingId,
    currentFileName,
    currentReceiptBase64,

    settings,
    setPaymentMode,
    setRoundingRule,
    setRemainingRule,
    setSharedBudget,

    summary,
    memberStats,
    categoryStats,
    settlements,
    filteredList,

    setFilter,
    openAddModal,
    openEditModal,
    closeExpenseModal,

    setCurrentFileName,
    setCurrentReceiptBase64,

    saveExpense,
    deleteCurrentExpense,
    getEditingExpense,
    getSettlementDetail,
  };
};
