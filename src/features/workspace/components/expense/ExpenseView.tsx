// src/features/workspace/components/expense/ExpenseView.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/center.css";

import type { UseExpensesStore } from "../../hooks/useExpenses";
import type {
  CategoryDisplayItem,
  DepositStatusRow,
  ExpenseMember,
  ExpenseSettings,
  MemberStatsRow,
  ShareType,
} from "../../hooks/expense.ui.types";
import {
  PERSONAL_REFERENCE_KEY,
  STATUS_PAGE_SIZE,
} from "../../hooks/expense.ui.types";
import { isSharedItem } from "../../hooks/expense.calc";

import PoolDepositModal from "./modal/PoolDepositModal";
import CalendarPopover from "./CalendarPopover";
import TripSettings from "./sections/TripSettings";
import ExpenseSummary from "./sections/ExpenseSummary";
import MemberStatusPanel from "./sections/MemberStatusPanel";
import CategoryStatsPanel from "./sections/CategoryStatsPanel";
import ExpenseList from "./sections/ExpenseList";
import { API_BASE_URL } from "../../../../shared/config/env";

interface Props {
  store: UseExpensesStore;
  onOpenSettleDetail: (m: ExpenseMember) => void;
}

const ExpenseView: React.FC<Props> = ({ store, onOpenSettleDetail }) => {
  const {
    expenses,
    filteredList,
    summary,
    memberStats,
    categoryStats,
    depositStatusRows,
    filterDate,
    setFilter,
    openAddModal,
    openEditModal,
    settings,
    setPaymentMode,
    setRoundingRule,
    setRemainingRule,
    setSharedBudget,
    previewSettings,
    applySettings,
    personalCategoryReference,
    sharedPercent,
    personalPercent,
    members,
    ownerUserId,
    currentUserId,
    isOwner,
    isBootstrapLoading,
    bootstrapError,
    isPreviewLoading,
    isApplyLoading,
  } = store;

  const CAT_LABEL: Record<string, string> = {
    FOOD: "식비",
    TRANS: "교통",
    STAY: "숙소",
    SHOP: "쇼핑",
    TICKET: "관광/티켓",
    ETC: "기타",
  };

  const [dayOpen, setDayOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [daySelectedDates, setDaySelectedDates] = useState<string[]>([]);

  const [sharedBudgetInput, setSharedBudgetInput] = useState<string>(() => {
    const n = settings?.sharedBudget ?? 0;
    return n ? `₩ ${n.toLocaleString("ko-KR")}` : "";
  });

  const [activeCat, setActiveCat] = useState<string>("ALL");
  const [visibleCount, setVisibleCount] = useState(10);
  const [activePayer, setActivePayer] = useState<string>("ALL");
  const [shareType, setShareType] = useState<"ALL" | "SHARED" | "PERSONAL">(
    "ALL",
  );
  const [memberPanel, setMemberPanel] = useState<"SETTLE" | "STATUS">("SETTLE");

  const dayFilterRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const [depositOpen, setDepositOpen] = useState(false);
  const [depositMember, setDepositMember] = useState<string | null>(null);

  const allDates = Array.from(new Set(expenses.map((e) => e.date))).sort();
  const recentDates = [...allDates]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 3);

  const isDayFilterActive =
    String(filterDate).startsWith("CAL:") ||
    String(filterDate).startsWith("CALRANGE:");

  const isRecentDateActive = (date: string) => filterDate === `DATE:${date}`;

  const myMemberNickname =
    members.find((member) => member.userId === currentUserId)?.nickname ?? null;
  const ownerMemberNickname =
    members.find((member) => member.userId === ownerUserId)?.nickname ?? null;

  const memberCount = Math.max(1, members.length || memberStats.length || 1);
  const poolTotal = settings?.sharedBudget ?? 0;
  const targetPerMember = Math.floor(poolTotal / memberCount);

  const openDepositModal = (mem: string) => {
    setDepositMember(mem);
    setDepositOpen(true);
  };

  const resolveReceiptSrc = (receipt: string) => {
    if (!receipt) return "";

    if (receipt.startsWith("data:image")) return receipt;

    if (receipt.startsWith("http://") || receipt.startsWith("https://")) {
      return receipt;
    }

    return `${API_BASE_URL}${receipt}`;
  };

  const viewReceipt = (receiptUrl: string) => {
    const src = resolveReceiptSrc(receiptUrl);
    if (!src) return;

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
    <html>
      <head><title>Receipt</title></head>
      <body style="margin:0;display:flex;justify-content:center;align-items:flex-start;background:#111;">
        <img src="${src}" style="max-width:100%;height:auto;" alt="receipt" />
      </body>
    </html>
  `);
    win.document.close();
  };

  const formatWon = (value: number | string) => {
    const num =
      typeof value === "number" ? value : Number(value.replace(/[^\d]/g, ""));
    if (Number.isNaN(num)) return "";
    return `₩ ${num.toLocaleString("ko-KR")}`;
  };

  const parseWon = (value: string) => {
    const num = Number(value.replace(/[^\d]/g, ""));
    return Number.isNaN(num) ? 0 : num;
  };

  const buildNextSettingsFromInput = (
    fixedBudget?: number,
  ): ExpenseSettings | null => {
    if (!settings) return null;

    const budget =
      fixedBudget !== undefined ? fixedBudget : parseWon(sharedBudgetInput);

    return {
      ...settings,
      sharedBudget: Math.max(0, Math.floor(budget)),
    };
  };

  const handlePreviewSettings = async (fixedBudget?: number) => {
    const nextSettings = buildNextSettingsFromInput(fixedBudget);
    if (!nextSettings) return;

    setSharedBudget(nextSettings.sharedBudget);
    await previewSettings(nextSettings);
  };

  const handleApplySettings = async (fixedBudget?: number) => {
    const nextSettings = buildNextSettingsFromInput(fixedBudget);
    if (!nextSettings) return;

    setSharedBudget(nextSettings.sharedBudget);
    await applySettings(nextSettings);
  };

  const onClickCurrent = () => {
    const n = settings?.sharedBudget ?? 0;
    setSharedBudgetInput(n ? formatWon(n) : "");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const detailsList =
    activeCat === "ALL"
      ? filteredList
      : activeCat === PERSONAL_REFERENCE_KEY
        ? filteredList
        : filteredList.filter((item) => item.cat === activeCat);

  const detailsFiltered = detailsList
    .filter((item) =>
      settings?.paymentMode === "POOL"
        ? true
        : activePayer === "ALL"
          ? true
          : item.payer === activePayer,
    )
    .filter((item) => {
      const effectiveShareType =
        settings?.paymentMode === "POOL" ? "SHARED" : shareType;

      if (effectiveShareType === "ALL") return true;

      const shared = isSharedItem(item, Math.max(1, members.length));
      return effectiveShareType === "SHARED" ? shared : !shared;
    });

  const visibleDetails = detailsFiltered.slice(0, visibleCount);

  const detailsSum = detailsFiltered.reduce(
    (acc, it) => acc + (it.cost ?? 0),
    0,
  );

  useEffect(() => {
    setVisibleCount(10);
  }, [activeCat, filterDate, activePayer, shareType]);

  useEffect(() => {
    if (activeCat !== "ALL") {
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [activeCat]);

  const prevPaymentModeRef = useRef<string | null>(null);

  useEffect(() => {
    const currentMode = settings?.paymentMode ?? null;
    if (!currentMode) return;

    if (prevPaymentModeRef.current === null) {
      prevPaymentModeRef.current = currentMode;
      return;
    }

    if (prevPaymentModeRef.current === currentMode) return;

    prevPaymentModeRef.current = currentMode;

    setFilter("ALL");
    setDaySelectedDates([]);
    setDayOpen(false);
    setActiveCat("ALL");
    setActivePayer("ALL");
    setShareType("ALL");
    setVisibleCount(10);
  }, [settings?.paymentMode, setFilter]);

  useEffect(() => {
    if (!dayOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dayFilterRef.current && !dayFilterRef.current.contains(target)) {
        setDayOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dayOpen]);

  useEffect(() => {
    const n = settings?.sharedBudget ?? 0;
    setSharedBudgetInput(n ? formatWon(n) : "");
  }, [settings?.sharedBudget]);

  const onClickCategory = (cat: string) => {
    const isPersonalReference = cat === PERSONAL_REFERENCE_KEY;

    if (isPersonalReference) {
      const willActivate = activeCat !== PERSONAL_REFERENCE_KEY;
      setActiveCat(willActivate ? PERSONAL_REFERENCE_KEY : "ALL");
      setShareType(willActivate ? "PERSONAL" : "ALL");
      setActivePayer("ALL");
    } else {
      setActiveCat((prev) => (prev === cat ? "ALL" : cat));
      setShareType("ALL");
    }

    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const categoryDisplayList = useMemo(() => {
    const base = [...categoryStats];

    if (personalCategoryReference) {
      return [
        ...base,
        {
          cat: PERSONAL_REFERENCE_KEY,
          amount: personalCategoryReference.amount,
          percent: personalCategoryReference.percent,
        },
      ];
    }

    return base.map((c) => ({
      ...c,
      percent: c.percent,
    }));
  }, [categoryStats, personalCategoryReference]);

  const resetDetailsFilters = () => {
    setActiveCat("ALL");
    setActivePayer("ALL");
    setShareType("ALL");
  };

  const STATUS_PAGE_SIZE = 3;

  const memberOrder = useMemo(
    () => new Map(members.map((member, index) => [member.nickname, index])),
    [members],
  );

  const getMemberPriority = (mem: ExpenseMember) => {
    if (myMemberNickname && mem === myMemberNickname) return 0;
    if (
      myMemberNickname &&
      ownerMemberNickname &&
      myMemberNickname === ownerMemberNickname
    ) {
      return 1;
    }
    if (ownerMemberNickname && mem === ownerMemberNickname) return 1;
    return 2;
  };

  const orderedMemberStats = useMemo(() => {
    const statsMap = new Map(memberStats.map((row) => [row.mem, row]));

    const baseRows =
      members.length > 0
        ? members.map(
            (member) =>
              statsMap.get(member.nickname) ?? {
                mem: member.nickname,
                share: 0,
                paid: 0,
                diff: 0,
              },
          )
        : [...memberStats];

    return [...baseRows].sort((a, b) => {
      const pa = getMemberPriority(a.mem);
      const pb = getMemberPriority(b.mem);

      if (pa !== pb) return pa - pb;

      return (memberOrder.get(a.mem) ?? 999) - (memberOrder.get(b.mem) ?? 999);
    });
  }, [
    memberOrder,
    memberStats,
    members,
    myMemberNickname,
    ownerMemberNickname,
  ]);

  const [statusPage, setStatusPage] = useState(0);

  const orderedDepositStatusRows = useMemo(() => {
    const statusMap = new Map(depositStatusRows.map((row) => [row.mem, row]));

    const baseRows =
      members.length > 0
        ? members.map(
            (member) =>
              statusMap.get(member.nickname) ?? {
                mem: member.nickname,
                targetAmount: 0,
                depositedAmount: 0,
                remainingAmount: 0,
                overpaidAmount: 0,
                status: "UNPAID" as const,
              },
          )
        : [...depositStatusRows];

    return [...baseRows].sort((a, b) => {
      const pa = getMemberPriority(a.mem);
      const pb = getMemberPriority(b.mem);

      if (pa !== pb) return pa - pb;

      return (memberOrder.get(a.mem) ?? 999) - (memberOrder.get(b.mem) ?? 999);
    });
  }, [
    depositStatusRows,
    members,
    memberOrder,
    myMemberNickname,
    ownerMemberNickname,
  ]);

  const statusPageCount = Math.max(
    1,
    Math.ceil(orderedDepositStatusRows.length / STATUS_PAGE_SIZE),
  );

  const pagedDepositStatusRows = useMemo(() => {
    const start = statusPage * STATUS_PAGE_SIZE;
    return orderedDepositStatusRows.slice(start, start + STATUS_PAGE_SIZE);
  }, [orderedDepositStatusRows, statusPage]);

  useEffect(() => {
    if (statusPage > statusPageCount - 1) {
      setStatusPage(0);
    }
  }, [statusPage, statusPageCount]);

  useEffect(() => {
    setStatusPage(0);
  }, [settings?.paymentMode, memberPanel]);

  if (isBootstrapLoading || !settings) {
    return (
      <div className="content-view-inner">
        <div className="details-empty">불러오는 중.</div>
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className="content-view-inner">
        <div className="details-empty">
          {bootstrapError}
          <small>※ 잠시 후 다시 시도해 주세요.</small>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content-view-inner">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            TRAVEL LOG
          </h2>

          <div className="filter-group">
            <button
              type="button"
              className={`filter-tag ${filterDate === "ALL" ? "active" : ""}`}
              onClick={() => {
                setFilter("ALL");
                setDaySelectedDates([]);
                setDayOpen(false);
              }}
            >
              ALL
            </button>

            <div className="filter-day" ref={dayFilterRef}>
              <button
                type="button"
                className={`filter-tag ${isDayFilterActive ? "active" : ""}`}
                onClick={() => setDayOpen((prev) => !prev)}
              >
                DAY
              </button>

              {dayOpen && (
                <CalendarPopover
                  month={calMonth}
                  onMonthChange={setCalMonth}
                  availableDates={new Set(allDates)}
                  selectedDates={daySelectedDates}
                  onPick={(pickedYmd) => {
                    setDaySelectedDates((prev) => {
                      let next: string[];

                      if (prev.includes(pickedYmd)) {
                        next = prev.filter((d) => d !== pickedYmd);
                      } else if (prev.length === 0) {
                        next = [pickedYmd];
                      } else if (prev.length === 1) {
                        next = [...prev, pickedYmd].sort();
                      } else {
                        next = [pickedYmd];
                      }

                      if (next.length === 0) {
                        setFilter("ALL");
                      } else if (next.length === 1) {
                        setFilter(`CAL:${next[0]}`);
                      } else {
                        const [start, end] = [...next].sort();
                        setFilter(`CALRANGE:${start}~${end}`);
                      }

                      return next;
                    });
                  }}
                  onClose={() => setDayOpen(false)}
                />
              )}
            </div>

            {recentDates.map((date) => (
              <button
                key={date}
                type="button"
                className={`filter-tag ${
                  isRecentDateActive(date) ? "active" : ""
                }`}
                onClick={() => {
                  setFilter(`DATE:${date}`);
                  setDaySelectedDates([]);
                  setDayOpen(false);
                }}
              >
                {date.substring(5)}
              </button>
            ))}
          </div>
        </div>

        <TripSettings
          settings={settings}
          isApplyLoading={isApplyLoading}
          isPreviewLoading={isPreviewLoading}
          isBootstrapLoading={isBootstrapLoading}
          setPaymentMode={setPaymentMode}
          setRoundingRule={setRoundingRule}
          setRemainingRule={setRemainingRule}
          sharedBudgetInput={sharedBudgetInput}
          memberCount={members.length || 1}
          isOwner={isOwner}
          setSharedBudgetInput={setSharedBudgetInput}
          onPreviewSettings={handlePreviewSettings}
          onApplySettings={handleApplySettings}
          openAddModal={openAddModal}
          formatWon={formatWon}
          parseWon={parseWon}
          inputRef={inputRef}
        />

        <ExpenseSummary
          summary={summary}
          settings={settings}
          onClickCurrent={onClickCurrent}
        />

        <div className="stats-panel">
          <MemberStatusPanel
            settings={settings}
            memberPanel={memberPanel}
            setMemberPanel={setMemberPanel}
            orderedMemberStats={orderedMemberStats}
            orderedDepositStatusRows={orderedDepositStatusRows}
            pagedDepositStatusRows={pagedDepositStatusRows}
            openDepositModal={openDepositModal}
            statusPage={statusPage}
            setStatusPage={setStatusPage}
            statusPageCount={statusPageCount}
            activePayer={activePayer}
            setActivePayer={setActivePayer}
            onOpenSettleDetail={onOpenSettleDetail}
            detailsRef={detailsRef}
          />
          <CategoryStatsPanel
            categoryDisplayList={categoryDisplayList}
            activeCat={activeCat}
            onClickCategory={onClickCategory}
            CAT_LABEL={CAT_LABEL}
            personalPercent={personalPercent}
            sharedPercent={sharedPercent}
            paymentMode={settings?.paymentMode}
          />
        </div>

        <ExpenseList
          detailsFiltered={detailsFiltered}
          visibleDetails={visibleDetails}
          settings={settings}
          shareType={shareType}
          setShareType={setShareType}
          activePayer={activePayer}
          setActivePayer={setActivePayer}
          activeCat={activeCat}
          setActiveCat={setActiveCat}
          resetDetailsFilters={resetDetailsFilters}
          visibleCount={visibleCount}
          setVisibleCount={setVisibleCount}
          detailsSum={detailsSum}
          CAT_LABEL={CAT_LABEL}
          members={members}
          openEditModal={openEditModal}
          viewReceipt={viewReceipt}
          openAddModal={openAddModal}
          detailsRef={detailsRef}
        />
      </div>

      <PoolDepositModal
        open={depositOpen}
        member={depositMember}
        targetPerMember={targetPerMember}
        store={store}
        onClose={() => setDepositOpen(false)}
      />
    </>
  );
};

export default ExpenseView;
