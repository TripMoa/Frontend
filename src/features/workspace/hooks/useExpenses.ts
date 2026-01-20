//src\features\workspace\hooks\useExpenses.ts
import { useEffect, useMemo, useState } from "react";

/* ==========================================
   part2.js constants (동일 유지)
========================================== */
export const EXPENSE_MEMS = ["ME", "J", "K", "M"] as const;
export type ExpenseMember = (typeof EXPENSE_MEMS)[number];

export const TOTAL_BUDGET = 1000000; // 100만원 예산 (part2.js 동일)

/* localStorage key (절대 변경 ❌) */
const LS_EXPENSES = "tripmoa_expenses";

/* ==========================================
   Types
========================================== */
export type ExpenseCategory = string; // part2.js는 문자열(cat)로만 처리
export type ExpenseMethod = string; // part2.js는 문자열(method)로만 처리

export interface ExpenseItem {
  id: number;
  date: string; // "YYYY-MM-DD"
  title: string;
  cost: number; // Number(cost)
  cat: ExpenseCategory;
  payer: ExpenseMember;
  method: ExpenseMethod;
  involved: ExpenseMember[]; // 최소 1명
  receipt: string | null; // base64 or null
  fileName: string | null; // file.name or null
}

export interface ExpenseSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
}

export interface MemberStatsRow {
  mem: ExpenseMember;
  paid: number; // 총 결제금액
  share: number; // 실제 부담금(1/N)
  diff: number; // paid - share
}

export interface CategoryStatsRow {
  cat: ExpenseCategory;
  amount: number;
  percent: number; // 0~100
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

/* ==========================================
   Safe parse helpers
========================================== */
const isMember = (v: unknown): v is ExpenseMember =>
  typeof v === "string" && (EXPENSE_MEMS as readonly string[]).includes(v);

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
      const cost =
        typeof obj.cost === "number"
          ? obj.cost
          : typeof obj.cost === "string"
          ? Number(obj.cost)
          : null;

      const cat = typeof obj.cat === "string" ? obj.cat : "";
      const method = typeof obj.method === "string" ? obj.method : "";

      const payer = isMember(obj.payer) ? obj.payer : null;

      const involvedRaw = obj.involved;
      const involved: ExpenseMember[] = Array.isArray(involvedRaw)
        ? involvedRaw.filter(isMember)
        : ([] as ExpenseMember[]);

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

      // part2.js: involved가 없으면 MEMS 전체로 처리
      const finalInvolved: ExpenseMember[] =
        involved.length > 0 ? involved : [...EXPENSE_MEMS];

      normalized.push({
        id,
        date,
        title,
        cost: Number(cost),
        cat,
        payer,
        method,
        involved: finalInvolved,
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

/* ==========================================
   Core calculations (part2.js 1:1)
========================================== */
const calcSummary = (items: ExpenseItem[]): ExpenseSummary => {
  const totalSpent = items.reduce((sum, item) => sum + Number(item.cost), 0);
  const remaining = TOTAL_BUDGET - totalSpent;
  return {
    totalBudget: TOTAL_BUDGET,
    totalSpent,
    remaining,
  };
};

const calcMemberStats = (items: ExpenseItem[]): MemberStatsRow[] => {
  const totalPaid: Record<ExpenseMember, number> = { ME: 0, J: 0, K: 0, M: 0 };
  const totalShare: Record<ExpenseMember, number> = { ME: 0, J: 0, K: 0, M: 0 };

  for (const item of items) {
    const cost = Number(item.cost);
    const payer = item.payer;
    const involved =
      item.involved && item.involved.length > 0
        ? item.involved
        : [...EXPENSE_MEMS];

    const share = Math.floor(cost / involved.length); // part2.js 동일

    totalPaid[payer] += cost;
    for (const p of involved) totalShare[p] += share;
  }

  return EXPENSE_MEMS.map((m) => {
    const paid = totalPaid[m];
    const share = totalShare[m];
    const diff = paid - share;
    return { mem: m, paid, share, diff };
  });
};

const calcCategoryStats = (items: ExpenseItem[]): CategoryStatsRow[] => {
  const catSum: Record<string, number> = {};
  for (const item of items) {
    const key = item.cat;
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

const calculateSettlements = (items: ExpenseItem[]): SettlementTx[] => {
  const balances: Record<ExpenseMember, number> = { ME: 0, J: 0, K: 0, M: 0 };

  for (const item of items) {
    const cost = Number(item.cost);
    const payer = item.payer;
    const involved =
      item.involved && item.involved.length > 0
        ? item.involved
        : [...EXPENSE_MEMS];
    const share = Math.floor(cost / involved.length);

    balances[payer] += cost;
    for (const p of involved) balances[p] -= share;
  }

  const debtors: Array<{ id: ExpenseMember; amount: number }> = [];
  const creditors: Array<{ id: ExpenseMember; amount: number }> = [];

  (Object.entries(balances) as Array<[ExpenseMember, number]>).forEach(
    ([mem, bal]) => {
      if (bal < -10) debtors.push({ id: mem, amount: Math.abs(bal) });
      else if (bal > 10) creditors.push({ id: mem, amount: bal });
    }
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
  target: ExpenseMember
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

  // 모달/편집 상태
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentReceiptBase64, setCurrentReceiptBase64] = useState<
    string | null
  >(null);

  /* 초기 로드 */
  useEffect(() => {
    const stored = safeParseExpenses(localStorage.getItem(LS_EXPENSES));
    setExpenses(stored);
  }, []);

  /* 저장 */
  useEffect(() => {
    writeExpenses(expenses);
  }, [expenses]);

  /* derived */
  const summary = useMemo(() => calcSummary(expenses), [expenses]);
  const memberStats = useMemo(() => calcMemberStats(expenses), [expenses]);
  const categoryStats = useMemo(() => calcCategoryStats(expenses), [expenses]);
  const settlements = useMemo(() => calculateSettlements(expenses), [expenses]);

  const filteredList = useMemo<ExpenseItem[]>(() => {
    const list =
      filterDate === "ALL"
        ? expenses
        : expenses.filter((item) => item.date === filterDate);

    return [...list].sort((a, b) => b.id - a.id);
  }, [expenses, filterDate]);

  /* actions */
  const setFilter = (date: string) => setFilterDate(date);

  const resetReceiptUI = () => {
    setCurrentReceiptBase64(null);
    setCurrentFileName(null);
  };

  // ✅ part2.js openExpModal()의 "active" 역할을 React state로 복원
  const openAddModal = () => {
    setEditingId(null);
    setCurrentFileName(null);
    setCurrentReceiptBase64(null);
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

  // ✅ part2.js closeExpModal() 복원
  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setEditingId(null);
    // 닫을 때 영수증 UI는 원본처럼 reset하는게 안전(편집 중 잔상 방지)
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
      closeExpenseModal(); // ✅ 원본처럼 저장 후 닫기
      return;
    }

    const newId = Date.now();
    setExpenses((prev) => [...prev, { id: newId, ...payload }]);
    closeExpenseModal(); // ✅ 원본처럼 저장 후 닫기
  };

  const deleteCurrentExpense = () => {
    if (!editingId) return;
    setExpenses((prev) => prev.filter((d) => d.id !== editingId));
    closeExpenseModal(); // ✅ 원본처럼 삭제 후 닫기
  };

  const getSettlementDetail = (target: ExpenseMember) => {
    return settlementDetailForMember(settlements, target);
  };

  return {
    /* state */
    expenses,
    filterDate,
    isExpenseModalOpen,
    editingId,
    currentFileName,
    currentReceiptBase64,

    /* derived */
    summary,
    memberStats,
    categoryStats,
    settlements,
    filteredList,

    /* actions */
    setFilter,
    openAddModal,
    openEditModal,
    closeExpenseModal,
    resetReceiptUI,

    setCurrentFileName,
    setCurrentReceiptBase64,

    saveExpense,
    deleteCurrentExpense,
    getEditingExpense,
    getSettlementDetail,
  };
};
