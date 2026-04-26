// src/features/workspace/hooks/useExpenses.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTripMembers } from "../../../api/trip.api";
import { useTripContext } from "./useTripContext";

import {
  getSettlementPreview,
  getSettlementSetting,
  getSettlementSummary,
  updateSettlementSettings,
} from "../../../api/settlement.api";
import {
  createExpense as createExpenseApi,
  deleteExpense as deleteExpenseApi,
  getExpense,
  getExpenses,
  updateExpense as updateExpenseApi,
} from "../../../api/expense.api";

import type { ExpenseCreateRequest } from "../../../types/expense.types";
import type {
  ExpenseCategory,
  PayMethod,
  SettlementSummaryResponse,
} from "../../../types/settlement.types";
import type { TripMemberResponse } from "../../../types/trip.types";

import type {
  ExpenseItem,
  ExpenseMember,
  ExpenseSettings,
  ExpenseSummary,
  MemberStatsRow,
  CategoryStatsRow,
  PersonalCategoryReferenceRow,
  SettlementTx,
  PaymentMode,
  RoundingRule,
  RemainingRule,
  DepositLogItem,
} from "./expense.ui.types";

import {
  buildSettlementUpdateRequest,
  mapExpenseResponseToItem,
  mapServerSettingToUi,
  mapSummaryCategoryStats,
  mapSummaryMemberStats,
  mapSummaryPersonalReference,
  mapSummaryTransactions,
} from "./expense.mapper";

import {
  calcSharesForItem,
  isSharedItem,
  normalizeInvolved,
  settlementDetailForMember,
} from "./expense.calc";

import {
  createDepositLog,
  getMemberDepositLogs,
  deleteDepositLog,
  confirmDepositLog,
  rejectDepositLog,
} from "../../../api/deposit.api";

import type {
  DepositLogCreateRequest,
  DepositLogResponse,
} from "../../../types/deposit.types";

/* ==========================================
   Hook
========================================== */
export type UseExpensesStore = ReturnType<typeof useExpenses>;

export const useExpenses = () => {
  const { tripId, ownerUserId, tripDetail, isOwner, currentUserId } =
    useTripContext();

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [filterDate, setFilterDate] = useState<string>("ALL");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentReceiptBase64, setCurrentReceiptBase64] = useState<
    string | null
  >(null);

  const [settings, setSettings] = useState<ExpenseSettings | null>(null);
  const settingsRef = useRef<ExpenseSettings | null>(null);

  const [members, setMembers] = useState<TripMemberResponse[]>([]);
  const [summaryData, setSummaryData] =
    useState<SettlementSummaryResponse | null>(null);

  const [isBootstrapLoading, setIsBootstrapLoading] = useState<boolean>(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isApplyLoading, setIsApplyLoading] = useState<boolean>(false);

  const [depositLogs, setDepositLogs] = useState<
    Record<ExpenseMember, DepositLogItem[]>
  >({});
  const [depositLoading, setDepositLoading] = useState<boolean>(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const memberNames = useMemo(
    () => members.map((member) => member.nickname),
    [members],
  );

  const effectiveMemberCount = Math.max(1, memberNames.length);

  const loadExpenses = useCallback(
    async (nextMembers: TripMemberResponse[]) => {
      if (!Number.isFinite(tripId) || tripId <= 0) {
        setExpenses([]);
        return [];
      }

      const { data } = await getExpenses(tripId);
      const mapped = data.map((row) =>
        mapExpenseResponseToItem(row, nextMembers),
      );

      setExpenses(mapped);
      return mapped;
    },
    [tripId],
  );

  const loadSummary = useCallback(async () => {
    if (!Number.isFinite(tripId) || tripId <= 0) {
      setSummaryData(null);
      return null;
    }

    const { data } = await getSettlementSummary(tripId);
    setSummaryData(data);
    return data;
  }, [tripId]);

  const previewSettings = useCallback(
    async (nextSettings?: ExpenseSettings) => {
      if (!Number.isFinite(tripId) || tripId <= 0) return null;

      const targetSettings = nextSettings ?? settingsRef.current;
      if (!targetSettings) return null;

      setIsPreviewLoading(true);

      try {
        const { data } = await getSettlementPreview(
          tripId,
          buildSettlementUpdateRequest(targetSettings),
        );
        setSummaryData(data);
        return data;
      } catch (error) {
        console.error("정산 설정 미리보기 실패", error);
        return null;
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [tripId],
  );

  const applySettings = useCallback(
    async (nextSettings?: ExpenseSettings) => {
      if (!Number.isFinite(tripId) || tripId <= 0) return;
      const targetSettings = nextSettings ?? settingsRef.current;
      if (!targetSettings) return;

      setIsApplyLoading(true);

      try {
        const { data } = await updateSettlementSettings(
          tripId,
          buildSettlementUpdateRequest(targetSettings),
        );

        const normalized = mapServerSettingToUi(data);
        setSettings(normalized);
        settingsRef.current = normalized;

        await loadSummary();
      } catch (error) {
        console.error("정산 설정 적용 실패", error);
      } finally {
        setIsApplyLoading(false);
      }
    },
    [loadSummary, tripId],
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!Number.isFinite(tripId) || tripId <= 0) {
        setBootstrapError("유효한 여행 ID를 찾을 수 없습니다.");
        setIsBootstrapLoading(false);
        return;
      }

      setIsBootstrapLoading(true);
      setBootstrapError(null);

      try {
        const [settingRes, membersRes] = await Promise.all([
          getSettlementSetting(tripId),
          getTripMembers(tripId),
        ]);

        if (cancelled) return;

        const nextSettings = mapServerSettingToUi(settingRes.data);
        const nextMembers =
          membersRes.data?.length > 0
            ? membersRes.data
            : (tripDetail?.members ?? []);

        setSettings(nextSettings);
        settingsRef.current = nextSettings;
        setMembers(nextMembers);

        await Promise.all([loadExpenses(nextMembers), loadSummary()]);
      } catch (error) {
        console.error("정산 화면 초기 조회 실패", error);
        if (!cancelled) {
          setBootstrapError("정산 페이지 데이터를 불러오지 못했습니다.");
          setExpenses([]);
          setSummaryData(null);
          setSettings(null);
        }
      } finally {
        if (!cancelled) setIsBootstrapLoading(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadExpenses, loadSummary, tripDetail, tripId]);

  const updateDraftSettings = useCallback((patch: Partial<ExpenseSettings>) => {
    if (!settingsRef.current) return;

    const nextSettings: ExpenseSettings = {
      ...settingsRef.current,
      ...patch,
    };

    setSettings(nextSettings);
    settingsRef.current = nextSettings;
  }, []);

  const setPaymentMode = (paymentMode: PaymentMode) => {
    updateDraftSettings({ paymentMode });
  };

  const setRoundingRule = (roundingRule: RoundingRule) => {
    updateDraftSettings({ roundingRule });
  };

  const setRemainingRule = (remainingRule: RemainingRule) => {
    updateDraftSettings({ remainingRule });
  };

  const setSharedBudget = (sharedBudget: number) => {
    const budget = Math.max(0, Math.floor(sharedBudget || 0));
    updateDraftSettings({ sharedBudget: budget });
  };

  const summary = useMemo<ExpenseSummary>(
    () => ({
      totalBudget: Math.max(0, Math.floor(summaryData?.budgetAmount ?? 0)),
      totalSpent: Math.max(0, Math.floor(summaryData?.totalSpent ?? 0)),
      remaining: Math.floor(summaryData?.remainingAmount ?? 0),
    }),
    [summaryData],
  );

  const memberStats = useMemo<MemberStatsRow[]>(
    () => mapSummaryMemberStats(summaryData?.settlement ?? [], members),
    [members, summaryData],
  );

  const categoryStats = useMemo<CategoryStatsRow[]>(
    () => (summaryData ? mapSummaryCategoryStats(summaryData) : []),
    [summaryData],
  );

  const personalCategoryReference =
    useMemo<PersonalCategoryReferenceRow | null>(
      () => (summaryData ? mapSummaryPersonalReference(summaryData) : null),
      [summaryData],
    );

  const settlements = useMemo<SettlementTx[]>(
    () => (summaryData ? mapSummaryTransactions(summaryData.transactions) : []),
    [summaryData],
  );

  const filteredList = useMemo<ExpenseItem[]>(() => {
    let list = expenses;

    if (filterDate !== "ALL") {
      if (filterDate.startsWith("DATE:")) {
        const date = filterDate.slice(5);
        list = expenses.filter((item) => item.date === date);
      } else if (filterDate.startsWith("CAL:")) {
        const date = filterDate.slice(4);
        list = expenses.filter((item) => item.date === date);
      } else if (filterDate.startsWith("CALRANGE:")) {
        const [start, end] = filterDate.slice(9).split("~");
        if (start && end) {
          list = expenses.filter(
            (item) => item.date >= start && item.date <= end,
          );
        }
      } else if (filterDate.startsWith("DAY:")) {
        const date = filterDate.slice(4);
        list = expenses.filter((item) => item.date === date);
      } else {
        list = expenses.filter((item) => item.date === filterDate);
      }
    }

    return [...list].sort((a, b) => b.id - a.id);
  }, [expenses, filterDate]);

  const setFilter = (date: string) => setFilterDate(date);

  const resetReceiptUI = () => {
    setCurrentReceiptBase64(null);
    setCurrentFileName(null);
  };

  const openAddModal = () => {
    setEditingId(null);
    resetReceiptUI();
    setIsExpenseModalOpen(true);
  };

  const openEditModal = async (id: number) => {
    setEditingId(id);

    try {
      const { data } = await getExpense(tripId, id);
      const mapped = mapExpenseResponseToItem(data as any, members);

      setExpenses((prev) =>
        prev.map((expense) => (expense.id === id ? mapped : expense)),
      );

      setCurrentReceiptBase64(mapped.receipt ?? null);
      setCurrentFileName(mapped.fileName ?? null);

      setIsExpenseModalOpen(true);
    } catch (error) {
      console.error("지출 상세 조회 실패", error);
      setIsExpenseModalOpen(true);
    }
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setEditingId(null);
    resetReceiptUI();
  };

  const getEditingExpense = (): ExpenseItem | null => {
    if (!editingId) return null;
    return expenses.find((expense) => expense.id === editingId) ?? null;
  };

  const buildExpenseRequest = (
    payload: Omit<ExpenseItem, "id">,
  ): ExpenseCreateRequest | null => {
    if (!settings) return null;
    if (memberNames.length === 0) return null;

    const allMembers = memberNames;

    const involved = normalizeInvolved(payload.involved, allMembers);
    if (involved.length === 0) return null;

    const payerMember = members.find(
      (member) => member.nickname === payload.payer,
    );
    if (!payerMember) return null;

    const normalizedPayload = {
      ...payload,
      involved,
    };

    const shares = calcSharesForItem(
      normalizedPayload,
      settings.roundingRule,
      allMembers,
    );

    const splits = involved
      .map((nickname) => {
        const member = members.find((row) => row.nickname === nickname);
        if (!member) return null;

        return {
          memberId: member.memberId,
          amount: Math.max(0, Math.floor(shares[nickname] ?? 0)),
        };
      })
      .filter(
        (row): row is { memberId: number; amount: number } => row !== null,
      );

    return {
      payerMemberId: payerMember.memberId,
      paidAt: `${payload.date} 00:00:00`,
      storeName: payload.storeName,
      itemMemo: payload.title || undefined,
      totalAmount: Math.max(0, Math.floor(payload.cost)),
      category: payload.cat as ExpenseCategory,
      payMethod: payload.method as PayMethod,
      isShared: payload.expenseKind === "SHARED",
      autoIncludePayer: involved.includes(payload.payer),
      splitMode: normalizedPayload.splitMode,
      splits,
    };
  };

  const refreshAfterExpenseChange = useCallback(async () => {
    await Promise.all([loadExpenses(members), loadSummary()]);
  }, [loadExpenses, loadSummary, members]);

  const createExpense = async (
    payload: Omit<ExpenseItem, "id">,
    receiptFile?: File | null,
  ) => {
    const request = buildExpenseRequest(payload);
    if (!request) return;

    try {
      await createExpenseApi(tripId, request, receiptFile ?? undefined);
      await refreshAfterExpenseChange();
      closeExpenseModal();
    } catch (error: any) {
      console.error("지출 생성 실패", error);
      console.error("응답 바디", error?.response?.data);
      alert(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          "지출 생성에 실패했습니다.",
      );
    }
  };

  const updateExpense = async (
    payload: ExpenseItem,
    receiptFile?: File | null,
  ) => {
    const request = buildExpenseRequest(payload);
    if (!request) return;

    try {
      await updateExpenseApi(
        tripId,
        payload.id,
        request,
        receiptFile ?? undefined,
      );
      await refreshAfterExpenseChange();
      closeExpenseModal();
    } catch (error: any) {
      console.error("지출 수정 실패", error);
      console.error("응답 바디", error?.response?.data);
      alert(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          "지출 수정에 실패했습니다.",
      );
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await deleteExpenseApi(tripId, id);
      await refreshAfterExpenseChange();
      if (editingId === id) closeExpenseModal();
    } catch (error) {
      console.error("지출 삭제 실패", error);
    }
  };

  const sharedSpent = useMemo(
    () =>
      filteredList
        .filter((item) => isSharedItem(item, effectiveMemberCount))
        .reduce((sum, item) => sum + Number(item.cost || 0), 0),
    [effectiveMemberCount, filteredList],
  );

  const personalSpent = useMemo(
    () =>
      filteredList
        .filter((item) => !isSharedItem(item, effectiveMemberCount))
        .reduce((sum, item) => sum + Number(item.cost || 0), 0),
    [effectiveMemberCount, filteredList],
  );

  const sharedPercent = useMemo(() => {
    const total = sharedSpent + personalSpent;
    if (total <= 0) return 0;
    return Number(((sharedSpent / total) * 100).toFixed(1));
  }, [personalSpent, sharedSpent]);

  const personalPercent = useMemo(() => {
    const total = sharedSpent + personalSpent;
    if (total <= 0) return 0;
    return Number(((personalSpent / total) * 100).toFixed(1));
  }, [personalSpent, sharedSpent]);

  const getSettlementDetailRows = (member: ExpenseMember) =>
    settlementDetailForMember(settlements, member);

  const safeDateOnly = (value: string | null | undefined) => {
    if (!value) return "";
    return value.length >= 10 ? value.slice(0, 10) : value;
  };

  const mapDepositStatusLabel = (
    status: "PENDING" | "CONFIRMED" | "REJECTED",
  ) => {
    if (status === "CONFIRMED") return "승인 완료";
    if (status === "REJECTED") return "거절됨";
    return "승인 대기";
  };

  const mapDepositResponseToItem = (
    row: DepositLogResponse,
    nextMembers: TripMemberResponse[],
  ): DepositLogItem => {
    const memberNickname =
      nextMembers.find((m) => m.memberId === row.memberId)?.nickname ??
      String(row.memberId);

    return {
      id: row.id,
      memberId: row.memberId,
      memberNickname,
      amount: Math.max(0, Math.floor(row.amount ?? 0)),
      depositDate: safeDateOnly(row.depositDate),
      memo: row.memo ?? undefined,
      depositStatus: row.depositStatus,
      depositStatusLabel: mapDepositStatusLabel(row.depositStatus),
    };
  };

  const getMemberByNickname = (nickname: ExpenseMember) =>
    members.find((member) => member.nickname === nickname);

  const loadMemberDepositLogs = useCallback(
    async (nickname: ExpenseMember) => {
      if (!Number.isFinite(tripId) || tripId <= 0) return [];

      const member = getMemberByNickname(nickname);
      if (!member) {
        setDepositLogs((prev) => ({ ...prev, [nickname]: [] }));
        return [];
      }

      setDepositLoading(true);
      try {
        const { data } = await getMemberDepositLogs(tripId, member.memberId);
        const mapped = data.map((row) =>
          mapDepositResponseToItem(row, members),
        );

        setDepositLogs((prev) => ({
          ...prev,
          [nickname]: mapped,
        }));

        return mapped;
      } catch (error) {
        console.error("입금 로그 조회 실패", error);
        setDepositLogs((prev) => ({ ...prev, [nickname]: [] }));
        return [];
      } finally {
        setDepositLoading(false);
      }
    },
    [tripId, members],
  );

  const createDepositForMember = useCallback(
    async (
      nickname: ExpenseMember,
      payload: Omit<DepositLogCreateRequest, "memberId">,
    ) => {
      if (!Number.isFinite(tripId) || tripId <= 0) return;

      const member = getMemberByNickname(nickname);
      if (!member) return;

      setDepositLoading(true);
      try {
        await createDepositLog(tripId, {
          memberId: member.memberId,
          amount: payload.amount,
          depositDate: payload.depositDate,
          memo: payload.memo,
        });

        await loadMemberDepositLogs(nickname);
        await loadSummary();
      } finally {
        setDepositLoading(false);
      }
    },
    [tripId, loadMemberDepositLogs, loadSummary, members],
  );

  const deleteDepositById = useCallback(
    async (nickname: ExpenseMember, depositLogId: number) => {
      if (!Number.isFinite(tripId) || tripId <= 0) return;

      setDepositLoading(true);
      try {
        await deleteDepositLog(tripId, depositLogId);
        await loadMemberDepositLogs(nickname);
        await loadSummary();
      } finally {
        setDepositLoading(false);
      }
    },
    [tripId, loadMemberDepositLogs, loadSummary],
  );

  const confirmDepositById = useCallback(
    async (nickname: ExpenseMember, depositLogId: number) => {
      if (!Number.isFinite(tripId) || tripId <= 0) return;

      setDepositLoading(true);
      try {
        await confirmDepositLog(tripId, depositLogId);
        await loadMemberDepositLogs(nickname);
        await loadSummary();
      } finally {
        setDepositLoading(false);
      }
    },
    [tripId, loadMemberDepositLogs, loadSummary],
  );

  const rejectDepositById = useCallback(
    async (nickname: ExpenseMember, depositLogId: number) => {
      if (!Number.isFinite(tripId) || tripId <= 0) return;

      setDepositLoading(true);
      try {
        await rejectDepositLog(tripId, depositLogId);
        await loadMemberDepositLogs(nickname);
        await loadSummary();
      } finally {
        setDepositLoading(false);
      }
    },
    [tripId, loadMemberDepositLogs, loadSummary],
  );

  const depositStatusRows = useMemo<
    {
      mem: ExpenseMember;
      targetAmount: number;
      depositedAmount: number;
      remainingAmount: number;
      overpaidAmount: number;
      status: "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID";
    }[]
  >(() => {
    return (summaryData?.status ?? []).map((row) => ({
      mem: row.nickname as ExpenseMember,
      targetAmount: row.targetAmount,
      depositedAmount: row.depositedAmount,
      remainingAmount: row.remainingAmount,
      overpaidAmount: row.overpaidAmount,
      status: row.status,
    }));
  }, [summaryData]);

  return {
    expenses,
    filteredList,
    filterDate,
    setFilter,

    settings,
    previewSettings,
    applySettings,
    setPaymentMode,
    setRoundingRule,
    setRemainingRule,
    setSharedBudget,

    summary,
    memberStats,
    categoryStats,
    personalCategoryReference,
    settlements,
    getSettlementDetailRows,

    members,
    ownerUserId,
    currentUserId,
    isOwner,

    sharedPercent,
    personalPercent,

    isBootstrapLoading,
    bootstrapError,
    isPreviewLoading,
    isApplyLoading,

    isExpenseModalOpen,
    openAddModal,
    openEditModal,
    closeExpenseModal,
    editingId,
    getEditingExpense,

    currentFileName,
    currentReceiptBase64,
    setCurrentFileName,
    setCurrentReceiptBase64,

    createExpense,
    updateExpense,
    deleteExpense,

    depositLogs,
    depositLoading,
    loadMemberDepositLogs,
    createDepositForMember,
    deleteDepositById,
    confirmDepositById,
    rejectDepositById,
    depositStatusRows,
  };
};

export default useExpenses;
