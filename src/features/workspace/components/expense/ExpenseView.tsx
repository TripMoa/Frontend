// src\features\workspace\components\expense\ExpenseView.tsx
import React, { useEffect, useState } from "react";
import "../../styles/center.css";
import type { ExpenseMember, UseExpensesStore } from "../../hooks/useExpenses";
import PoolDepositModal, { type DepositLog } from "./PoolDepositModal";

interface Props {
  store: UseExpensesStore;
  onOpenSettleDetail: (m: ExpenseMember) => void;
}

/**
 * ExpenseView
 * - 화면 전용 컴포넌트
 * - 상태는 store(props)로만 사용
 * - 모달 렌더는 WorkspaceCenter에서만
 */
const ExpenseView: React.FC<Props> = ({ store, onOpenSettleDetail }) => {
  const {
    expenses,
    filteredList,
    summary,
    memberStats,
    categoryStats,
    filterDate,
    setFilter,
    openAddModal,
    openEditModal,
    settings,
    setPaymentMode,
    setRoundingRule,
    setRemainingRule,
    setSharedBudget,
  } = store;

  const CAT_LABEL: Record<string, string> = {
    FOOD: "식비",
    TRANS: "교통",
    STAY: "숙소",
    SHOP: "쇼핑",
    TICKET: "관광/티켓",
    ETC: "기타",
  };

  const MODE_HINT: Record<string, string> = {
    INDIVIDUAL:
      "※ 예산은 '목표 사용 금액'을 의미하며, 공동 지출만 예산에서 차감됩니다. 개인 지출은 정산 영역에서 별도로 계산됩니다.",

    POOL: "※ 모임 통장은 설정된 금액을 기준으로 관리됩니다. 추가로 모금하기로 했다면 통장 금액을 다시 설정해 주시고 지출은 공동 지출만 기록해 주세요. (개인 지출 반영 제외)",

    HYBRID:
      "※ 모임 통장과 각자 정산을 결합했습니다. 공동 지출은 통장에서 차감하고, 개인 지출은 따로 정산합니다.",
  };

  // ===== Trip settings (UI) =====
  const [dayOpen, setDayOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [sharedBudgetInput, setSharedBudgetInput] = useState<string>("");
  const [activeCat, setActiveCat] = useState<string>("ALL");
  const [visibleCount, setVisibleCount] = useState(10);
  const [activePayer, setActivePayer] = useState<string>("ALL");
  const [shareType, setShareType] = useState<"ALL" | "SHARED" | "PERSONAL">(
    "ALL",
  );
  const [memberPanel, setMemberPanel] = useState<"SETTLE" | "STATUS">("SETTLE");

  // ===== POOL deposit modal (local UI state) =====
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositMember, setDepositMember] = useState<string | null>(null);
  const [depositLogsByMember, setDepositLogsByMember] = useState<
    Record<string, DepositLog[]>
  >({});

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const detailsRef = React.useRef<HTMLDivElement | null>(null);

  const allDates = Array.from(new Set(expenses.map((e) => e.date))).sort();

  const isSharedExpense = (item: any) =>
    !item.involved || item.involved.length === 4;

  // ===== POOL target per member (1/N) =====
  const memberCount = Math.max(1, memberStats.length || 1);
  const poolTotal = settings.sharedBudget ?? 0;
  const targetPerMember = Math.floor(poolTotal / memberCount);

  const getDepositSum = (mem: string) =>
    (depositLogsByMember[mem] ?? []).reduce(
      (acc, it) => acc + (it.amount ?? 0),
      0,
    );

  const openDepositModal = (mem: string) => {
    setDepositMember(mem);
    setDepositOpen(true);
  };

  const addDepositLog = (
    mem: string,
    log: Omit<DepositLog, "id" | "member">,
  ) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const entry: DepositLog = { id, member: mem, ...log };
    setDepositLogsByMember((prev) => ({
      ...prev,
      [mem]: [entry, ...(prev[mem] ?? [])],
    }));
  };

  const deleteDepositLog = (mem: string, id: string) => {
    setDepositLogsByMember((prev) => ({
      ...prev,
      [mem]: (prev[mem] ?? []).filter((x) => x.id !== id),
    }));
  };

  const viewReceipt = (e: React.MouseEvent, base64: string) => {
    e.stopPropagation();
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<img src="${base64}" style="max-width:100%">`);
    }
  };

  const detailsList =
    activeCat === "ALL"
      ? filteredList
      : filteredList.filter((item) => item.cat === activeCat);

  const detailsFiltered = detailsList
    .filter((item) =>
      settings.paymentMode === "POOL"
        ? true
        : activePayer === "ALL"
          ? true
          : item.payer === activePayer,
    )
    .filter((item) => {
      const effectiveShareType =
        settings.paymentMode === "POOL" ? "SHARED" : shareType;

      if (effectiveShareType === "ALL") return true;
      const shared = isSharedExpense(item);
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

  useEffect(() => {
    setFilter("ALL");
    setActiveCat("ALL");
    setActivePayer("ALL");
    setShareType("ALL");
    setVisibleCount(10);
  }, [settings.paymentMode, setFilter]);

  // 숫자 → ₩ + 콤마 문자열
  const formatWon = (value: number | string) => {
    const num =
      typeof value === "number" ? value : Number(value.replace(/[^\d]/g, ""));

    if (isNaN(num)) return "";
    return `₩ ${num.toLocaleString("ko-KR")}`;
  };

  // 문자열 → 숫자 (₩, 콤마 제거)
  const parseWon = (value: string) => {
    const num = Number(value.replace(/[^\d]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  // 적용 버튼
  const onApply = () => {
    const n = parseWon(sharedBudgetInput);
    setSharedBudget(n);
  };

  // 현재 값 클릭 시
  const onClickCurrent = () => {
    const n = settings.sharedBudget ?? 0;
    setSharedBudgetInput(n ? formatWon(n) : "");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // 포맷 유지
  useEffect(() => {
    const n = settings.sharedBudget ?? 0;
    setSharedBudgetInput(n ? formatWon(n) : "");
  }, [settings.sharedBudget]);

  // 카테고리 클릭 핸들러
  const onClickCategory = (cat: string) => {
    setActiveCat((prev) => (prev === cat ? "ALL" : cat));

    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // 필터 초기화
  const resetDetailsFilters = () => {
    setActiveCat("ALL");
    setActivePayer("ALL");
    setShareType("ALL");
  };

  return (
    <>
      <div className="content-view-inner">
        {/* ================= HEADER + FILTER ================= */}
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
              className={`filter-tag ${filterDate === "ALL" ? "active" : ""}`}
              onClick={() => setFilter("ALL")}
            >
              ALL
            </button>

            {/* DAY */}
            <div className="filter-day">
              <button
                className={`filter-tag ${String(filterDate).startsWith("DAY:") ? "active" : ""}`}
                onClick={() => setDayOpen(true)}
              >
                DAY
              </button>

              {dayOpen && (
                <CalendarPopover
                  month={calMonth}
                  onMonthChange={setCalMonth}
                  availableDates={new Set(allDates)}
                  onPick={(ymd) => {
                    setFilter(`DAY:${ymd}`);
                    setDayOpen(false);
                  }}
                  onClose={() => setDayOpen(false)}
                />
              )}
            </div>

            {allDates.map((date) => (
              <button
                key={date}
                className={`filter-tag ${filterDate === date ? "active" : ""}`}
                onClick={() => setFilter(date)}
              >
                {date.substring(5)}
              </button>
            ))}
          </div>
        </div>

        {/* ================= TRIP SETTINGS ================= */}
        <div className="trip-settings">
          <div className="ts-main">
            <div className="ts-left">
              {/* 정산 방식 */}
              <div className="ts-field">
                <div className="ts-label">정산 방식</div>
                <select
                  className="ts-select"
                  value={settings.paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  title="정산 방식 설정"
                >
                  <option value="INDIVIDUAL">결제 후 정산</option>
                  <option value="POOL">모임 통장</option>
                  <option value="HYBRID">통합 버전</option>
                </select>
              </div>

              {/* 결제 후 정산 전용: 잔돈 배분 방식 */}
              {(settings.paymentMode === "INDIVIDUAL" ||
                settings.paymentMode === "HYBRID") && (
                <div className="ts-field">
                  <div className="ts-label">잔돈 배분 방식</div>
                  <select
                    className="ts-select"
                    value={settings.roundingRule}
                    onChange={(e) => setRoundingRule(e.target.value as any)}
                    title="1원 단위 정산 설정"
                  >
                    <option value="PAYER">나머지 금액 결제자에게 할당</option>
                    <option value="SEQUENTIAL">
                      나머지 금액 순서대로 할당
                    </option>
                    <option value="RANDOM">나머지 금액 랜덤으로 할당</option>
                  </select>
                </div>
              )}

              {/* 모임 통장 전용: 잔액 배분 방식 */}
              {settings.paymentMode === "POOL" && (
                <div className="ts-field">
                  <div className="ts-label">잔액 배분 방식</div>
                  <select
                    className="ts-select"
                    value={settings.remainingRule}
                    onChange={(e) => setRemainingRule(e.target.value as any)}
                    title="여행 종료 후 잔액 처리"
                  >
                    <option value="AUTO">입금 비율 기준으로 자동 분배</option>
                    <option value="EQUAL">전체 멤버 1/N로 분배</option>
                    <option value="CARRY">다음 여행으로 이월</option>
                  </select>
                </div>
              )}

              {/* 예산/통장 금액 */}
              <div className="ts-field">
                <div className="ts-label">
                  {settings.paymentMode === "POOL" ? "통장 금액" : "예산 설정"}
                </div>

                <div className="ts-budget-row">
                  <input
                    ref={inputRef}
                    className="ts-input"
                    value={sharedBudgetInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parsed = parseWon(raw);
                      setSharedBudgetInput(formatWon(parsed));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onApply();
                      }
                    }}
                    placeholder={
                      settings.paymentMode === "POOL"
                        ? "모임 통장 금액"
                        : "공동 지출 목표"
                    }
                    inputMode="numeric"
                  />

                  <button
                    className="ts-btn ghost"
                    onClick={onApply}
                    disabled={!parseWon(sharedBudgetInput)}
                  >
                    {settings.paymentMode === "INDIVIDUAL"
                      ? "예산 적용"
                      : "금액 설정"}
                  </button>
                </div>
              </div>
            </div>

            <div className="ts-right">
              <button className="ts-btn primary" onClick={openAddModal}>
                + 지출 추가
              </button>
            </div>
          </div>

          <span className="ts-hint">
            {MODE_HINT[settings.paymentMode] ?? MODE_HINT.INDIVIDUAL}
          </span>
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="exp-summary">
          <div
            className="exp-card"
            onClick={onClickCurrent}
            role="button"
            tabIndex={0}
          >
            <div className="lbl">
              {settings.paymentMode === "POOL"
                ? "POOL BALANCE"
                : "TOTAL BUDGET"}
            </div>
            <div className="val">₩ {summary.totalBudget.toLocaleString()}</div>
          </div>

          <div className="exp-card highlight">
            <div className="lbl">TOTAL SPENT</div>
            <div className="val">₩ {summary.totalSpent.toLocaleString()}</div>
          </div>

          <div className="exp-card">
            <div className="lbl">REMAINING</div>
            <div className="val">₩ {summary.remaining.toLocaleString()}</div>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="stats-panel">
          <div className="stat-box">
            <div className="stat-head stat-head-row">
              {settings.paymentMode === "HYBRID" ? (
                <div className="seg-spacer" aria-hidden />
              ) : null}
              <span>
                {settings.paymentMode === "POOL"
                  ? "STATUS (입금 현황)"
                  : settings.paymentMode === "HYBRID"
                    ? memberPanel === "STATUS"
                      ? "STATUS (입금 현황)"
                      : "SETTLEMENT (1/N)"
                    : "SETTLEMENT (1/N)"}
              </span>

              {/* 통합 버전: [정산 | 현황] 전환 */}
              {settings.paymentMode === "HYBRID" && (
                <div className="seg" aria-label="shareType">
                  <button
                    className={`seg-btn ${memberPanel === "SETTLE" ? "active" : ""}`}
                    onClick={() => setMemberPanel("SETTLE")}
                  >
                    정산
                  </button>
                  <button
                    className={`seg-btn ${memberPanel === "STATUS" ? "active" : ""}`}
                    onClick={() => setMemberPanel("STATUS")}
                  >
                    현황
                  </button>
                </div>
              )}
            </div>

            {settings.paymentMode === "POOL" ||
            (settings.paymentMode === "HYBRID" && memberPanel === "STATUS") ? (
              <div className="pool-chart-wrap">
                <div className="pool-chart">
                  {memberStats
                    .slice()
                    .sort((a, b) => {
                      // 부족한 사람 먼저
                      const da = getDepositSum(a.mem) - targetPerMember;
                      const db = getDepositSum(b.mem) - targetPerMember;
                      return da - db;
                    })
                    .map((m) => {
                      const sum = getDepositSum(m.mem);
                      const filled =
                        targetPerMember > 0
                          ? Math.min(1, sum / targetPerMember)
                          : 0;

                      const shortage = Math.max(0, targetPerMember - sum);
                      const overflow = Math.max(0, sum - targetPerMember);

                      return (
                        <div key={m.mem} className="pool-bar-col">
                          <button
                            className="pool-bar-btn"
                            onClick={() => openDepositModal(m.mem)}
                            title={`${m.mem} 입금내역 보기`}
                          >
                            <div className="pool-bar-meta">
                              {shortage > 0 ? (
                                <span className="pool-badge neg">
                                  부족 ₩ {shortage.toLocaleString()}
                                </span>
                              ) : overflow > 0 ? (
                                <span className="pool-badge pos">
                                  초과 ₩ {overflow.toLocaleString()}
                                </span>
                              ) : (
                                <span className="pool-badge ok">달성 !</span>
                              )}
                            </div>

                            <div
                              className="pool-bar-frame"
                              aria-label="deposit bar"
                            >
                              {/* 부족 영역(점선 박스) */}
                              {filled < 1 && (
                                <div
                                  className="pool-bar-missing"
                                  style={{ height: `${(1 - filled) * 100}%` }}
                                >
                                  <div className="pool-bar-ghost" />
                                </div>
                              )}

                              {/* 채워진 영역(검정) */}
                              <div
                                className="pool-bar-fill"
                                style={{ height: `${filled * 100}%` }}
                              />
                            </div>
                          </button>

                          <button
                            className="pool-name"
                            onClick={() => openDepositModal(m.mem)}
                          >
                            {m.mem}
                          </button>
                          <div className="pool-subline">
                            {sum.toLocaleString()} /{" "}
                            {targetPerMember.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="pool-chart-note">
                  ※ 1/N 분담 입금 현황입니다. 이름을 클릭하면 해당 멤버의 입금
                  기록을 관리할 수 있습니다.
                </div>
              </div>
            ) : (
              <>
                <table className="stat-table settlement-table">
                  <thead>
                    <tr>
                      <th>MEMBER</th>
                      <th style={{ textAlign: "right", color: "#2196F3" }}>
                        COST
                      </th>
                      <th style={{ textAlign: "right", color: "#888" }}>
                        PAID
                      </th>
                      <th style={{ textAlign: "right" }}>±</th>
                      <th style={{ textAlign: "center" }}>DETAIL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberStats.map((m) => (
                      <tr
                        key={m.mem}
                        className={`settle-row ${activePayer === m.mem ? "active" : ""}`}
                        onClick={() => {
                          setActivePayer((prev) =>
                            prev === m.mem ? "ALL" : m.mem,
                          );
                          requestAnimationFrame(() => {
                            detailsRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          });
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActivePayer((prev) =>
                              prev === m.mem ? "ALL" : m.mem,
                            );
                            requestAnimationFrame(() => {
                              detailsRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            });
                          }
                        }}
                      >
                        <td style={{ fontWeight: "bold" }}>{m.mem}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>
                          {m.share.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right", color: "#999" }}>
                          {m.paid.toLocaleString()}
                        </td>
                        <td
                          className={`st-res ${
                            m.diff > 0 ? "plus" : m.diff < 0 ? "minus" : "zero"
                          }`}
                          style={{ textAlign: "right" }}
                        >
                          {m.diff > 0 && "+"}
                          {m.diff.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="btn-detail"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSettleDetail(m.mem);
                            }}
                          >
                            VIEW
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="stat-note">
                  ※ (+) 받을 돈 / (-) 보낼 돈 | 이름을 클릭하면 필터가 자동으로
                  적용됩니다.
                </div>
              </>
            )}
          </div>

          {/* CATEGORY */}
          <div className="stat-box">
            <div className="stat-head">
              {settings.paymentMode === "POOL"
                ? "CATEGORY SPEND (공동)"
                : "CATEGORY SPEND (전체)"}
            </div>

            <div id="cat-list">
              {categoryStats.length === 0 ? (
                <div className="cat-empty">
                  아직 지출이 없습니다
                  <small>※ 지출을 추가하면 카테고리별 합계가 표시됩니다.</small>
                </div>
              ) : (
                categoryStats.map((c) => {
                  const isActive = activeCat === c.cat;
                  return (
                    <div
                      key={c.cat}
                      className={`cat-item-box ${activeCat === c.cat ? "active" : ""}`}
                      onClick={() => onClickCategory(c.cat)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          onClickCategory(c.cat);
                      }}
                    >
                      <div className="cat-top">
                        <span style={{ fontWeight: "bold" }}>
                          {CAT_LABEL[c.cat] ?? c.cat}
                        </span>
                        <span>
                          ₩ {c.amount.toLocaleString()}{" "}
                          <span style={{ color: "#888", fontSize: "11px" }}>
                            ({c.percent}%)
                          </span>
                        </span>
                      </div>

                      <div className="cat-bar-track">
                        <div
                          className="cat-bar-thumb"
                          style={{ width: `${c.percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {categoryStats.length > 0 && (
              <div className="stat-note">
                ※ 카테고리를 클릭하면 필터가 자동으로 적용됩니다.
              </div>
            )}
          </div>
        </div>

        {/* ================= LIST ================= */}
        <div className="exp-list-wrapper" ref={detailsRef}>
          <div className="exp-header">
            <span
              style={{ flex: 2, display: "flex", alignItems: "center", gap: 8 }}
            >
              DETAILS
              {/* 전체 보기 버튼 */}
              <button
                className={`cat-chip ${activeCat === "ALL" ? "active" : ""}`}
                onClick={resetDetailsFilters}
              >
                전체 필터 해제
              </button>
              {/* 결제자 필터 표시 + 해제 */}
              {settings.paymentMode !== "POOL" && activePayer !== "ALL" && (
                <button
                  className="cat-chip active"
                  onClick={() => setActivePayer("ALL")}
                  title="결제자 필터 해제"
                >
                  {activePayer} ✕
                </button>
              )}
              {/* 카테고리 필터 표시 + 해제 */}
              {activeCat !== "ALL" && (
                <button
                  className="cat-chip active"
                  onClick={() => setActiveCat("ALL")}
                  title="카테고리 필터 해제"
                >
                  {CAT_LABEL[activeCat] ?? activeCat} ✕
                </button>
              )}
            </span>
            <span
              style={{
                flex: 1,
                textAlign: "right",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                alignItems: "center",
              }}
            >
              {settings.paymentMode !== "POOL" && (
                <div className="seg">
                  <button
                    className={`seg-btn ${shareType === "ALL" ? "active" : ""}`}
                    onClick={() => setShareType("ALL")}
                  >
                    전체
                  </button>
                  <button
                    className={`seg-btn ${shareType === "SHARED" ? "active" : ""}`}
                    onClick={() => setShareType("SHARED")}
                  >
                    공동
                  </button>
                  <button
                    className={`seg-btn ${shareType === "PERSONAL" ? "active" : ""}`}
                    onClick={() => setShareType("PERSONAL")}
                  >
                    개인
                  </button>
                </div>
              )}

              <span className="detail-count">
                {Math.min(visibleCount, detailsFiltered.length)} /{" "}
                {detailsFiltered.length}
              </span>

              <span className="detail-sum">
                합계 ₩ {detailsSum.toLocaleString()}
              </span>
            </span>
          </div>

          <div id="expense-list-container">
            {detailsFiltered.length === 0 ? (
              <div className="details-empty">
                {activeCat === "ALL" &&
                activePayer === "ALL" &&
                shareType === "ALL" ? (
                  <>
                    아직 내역이 없습니다.
                    <small>※ 지출을 추가하면 여기에 표시됩니다.</small>
                  </>
                ) : (
                  <>
                    해당 필터의 내역이 없습니다.
                    <small>
                      ※ 다른 필터를 선택하거나 “전체 필터 해제”를 눌러보세요.
                    </small>
                  </>
                )}
              </div>
            ) : (
              visibleDetails.map((item) => {
                const involvedText =
                  !item.involved || item.involved.length === 4
                    ? "ALL"
                    : item.involved.join(", ");

                return (
                  <div
                    key={item.id}
                    className="exp-row"
                    onClick={() => openEditModal(item.id)}
                  >
                    <div className="exp-info">
                      <div className="exp-name">
                        {item.title}
                        {item.receipt && (
                          <span
                            className="receipt-link"
                            onClick={(e) => viewReceipt(e, item.receipt!)}
                          >
                            <i className="fa-solid fa-paperclip"></i>{" "}
                            {item.fileName || "영수증"}
                          </span>
                        )}
                      </div>

                      <div className="exp-meta-line">
                        <span className="badge-cat">
                          {CAT_LABEL[item.cat] ?? item.cat}
                        </span>
                        <span>{item.date.substring(5)}</span>
                        <span style={{ color: "#ccc" }}>|</span>
                        <span>{item.payer} 결제</span>
                        {item.method && (
                          <>
                            <span style={{ color: "#ccc" }}>|</span>
                            <span className="badge-method" title="결제 방식">
                              {item.method === "CARD"
                                ? "💳 CARD"
                                : item.method === "CASH"
                                  ? "💵 CASH"
                                  : item.method}
                            </span>
                          </>
                        )}
                        <span style={{ color: "#ccc" }}>|</span>
                        <span style={{ color: "#2196F3", fontWeight: "bold" }}>
                          <i className="fa-solid fa-user-group"></i>{" "}
                          {involvedText}
                        </span>
                      </div>
                    </div>

                    <div className="exp-cost">
                      - {item.cost.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div
            className={`exp-actions ${detailsFiltered.length > visibleCount ? "two" : "one"}`}
          >
            {detailsFiltered.length > visibleCount && (
              <button
                className="exp-load-more"
                onClick={() => setVisibleCount((v) => v + 10)}
              >
                + LOAD MORE (10)
              </button>
            )}

            <button className="exp-add-btn" onClick={openAddModal}>
              + ADD NEW EXPENSE
            </button>
          </div>
        </div>
      </div>
      <PoolDepositModal
        open={depositOpen}
        member={depositMember}
        targetPerMember={targetPerMember}
        logs={depositMember ? (depositLogsByMember[depositMember] ?? []) : []}
        onClose={() => setDepositOpen(false)}
        onAddLog={addDepositLog}
        onDeleteLog={deleteDepositLog}
      />
    </>
  );
};

export default ExpenseView;

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function CalendarPopover({
  month,
  onMonthChange,
  availableDates,
  onPick,
  onClose,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  availableDates: Set<string>;
  onPick: (dateYmd: string) => void;
  onClose: () => void;
}) {
  const start = startOfMonth(month);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay()); // 일요일 시작

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }

  const title = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="day-pop">
      <div className="day-pop-head">
        <button
          className="day-nav"
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          ◀
        </button>
        <div className="day-title">{title}</div>
        <button
          className="day-nav"
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          ▶
        </button>
        <button className="day-x" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="day-dow">
        {["S", "M", "T", "W", "T", "F", "S"].map((x) => (
          <div key={x}>{x}</div>
        ))}
      </div>

      <div className="day-grid">
        {cells.map((d) => {
          const inMonth = d.getMonth() === month.getMonth();
          const key = ymd(d);
          const enabled = inMonth && availableDates.has(key);

          return (
            <button
              key={key}
              className={`day-cell ${inMonth ? "" : "muted"} ${enabled ? "on" : "off"}`}
              disabled={!enabled}
              onClick={() => onPick(key)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
