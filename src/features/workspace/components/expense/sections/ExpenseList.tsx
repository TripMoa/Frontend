// src/features/workspace/components/expense/sections/ExpenseList.tsx
//
// 지출 목록 — 시안: 상자 맨 위에 필터 줄(공동/개인 · 날짜 · 결제자 · 카테고리 · 필터 해제 · 합계), 아래에 한 줄이 두 칸짜리 지출 줄.
import React from "react";
import type {
  ExpenseItem,
  ExpenseMember,
  ExpenseSettings,
  ShareType,
} from "../../../hooks/expense.ui.types";
import { PERSONAL_REFERENCE_KEY } from "../../../hooks/expense.ui.types";
import type { ScheduleItemOption } from "../../../../../types/scheduleItemOption.types";

interface MemberLike {
  nickname: ExpenseMember;
}

interface ExpenseListProps {
  detailsFiltered: ExpenseItem[];
  visibleDetails: ExpenseItem[];
  settings: ExpenseSettings;
  shareType: ShareType;
  setShareType: (t: ShareType) => void;
  activePayer: string;
  setActivePayer: (p: string) => void;
  activeCat: string;
  setActiveCat: (c: string) => void;
  /** 날짜 필터 — "ALL" 또는 "DATE:yyyy-mm-dd" */
  filterDate: string;
  setFilter: (f: string) => void;
  allDates: string[];
  anyFilter: boolean;
  clearAllFilters: () => void;
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  detailsSum: number;
  CAT_LABEL: Record<string, string>;
  members: MemberLike[];
  openEditModal: (id: number) => void;
  viewReceipt: (receiptUrl: string) => void;
  detailsRef: React.RefObject<HTMLDivElement | null>;
  scheduleItemOptions?: ScheduleItemOption[];
}

const SHARE_TYPES: ShareType[] = ["ALL", "SHARED", "PERSONAL"];
const SHARE_LABEL: Record<ShareType, string> = { ALL: "전체", SHARED: "공동", PERSONAL: "개인" };

const ExpenseList: React.FC<ExpenseListProps> = ({
  detailsFiltered,
  visibleDetails,
  settings,
  shareType,
  setShareType,
  activePayer,
  setActivePayer,
  activeCat,
  setActiveCat,
  filterDate,
  setFilter,
  allDates,
  anyFilter,
  clearAllFilters,
  visibleCount,
  setVisibleCount,
  detailsSum,
  CAT_LABEL,
  members,
  openEditModal,
  viewReceipt,
  detailsRef,
  scheduleItemOptions = [],
}) => {
  const isPool = settings.paymentMode === "POOL";
  const scheduleItemLabelById = new Map(scheduleItemOptions.map((opt) => [opt.id, `${opt.day} · ${opt.title}`]));
  const dateValue = String(filterDate).startsWith("DATE:") ? String(filterDate).slice(5) : "";
  const catValue = activeCat === PERSONAL_REFERENCE_KEY ? "" : activeCat === "ALL" ? "" : activeCat;

  return (
    <div className="ws-exbox ws-exlist" ref={detailsRef}>
      <div className="ws-exfilter">
        {!isPool && (
          <div className="tm-seg" role="group" aria-label="공동·개인">
            {SHARE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={shareType === t ? "is-on" : ""}
                aria-pressed={shareType === t}
                onClick={() => setShareType(t)}
              >
                {SHARE_LABEL[t]}
              </button>
            ))}
          </div>
        )}

        <select
          className="tm-select"
          aria-label="날짜"
          value={dateValue}
          onChange={(e) => setFilter(e.target.value ? `DATE:${e.target.value}` : "ALL")}
        >
          <option value="">전체 날짜</option>
          {allDates.map((d) => (
            <option key={d} value={d}>{d.substring(5).replace("-", ".")}</option>
          ))}
        </select>

        {!isPool && (
          <select
            className="tm-select"
            aria-label="결제자"
            value={activePayer === "ALL" ? "" : activePayer}
            onChange={(e) => setActivePayer(e.target.value || "ALL")}
          >
            <option value="">결제자 전체</option>
            {members.map((m) => (
              <option key={m.nickname} value={m.nickname}>{m.nickname}</option>
            ))}
          </select>
        )}

        <select
          className="tm-select"
          aria-label="카테고리"
          value={catValue}
          onChange={(e) => setActiveCat(e.target.value || "ALL")}
        >
          <option value="">카테고리 전체</option>
          {Object.keys(CAT_LABEL).map((k) => (
            <option key={k} value={k}>{CAT_LABEL[k]}</option>
          ))}
        </select>

        {anyFilter && (
          <button type="button" className="tm-btn tm-btn--link tm-btn--sm ws-ulink" onClick={clearAllFilters}>
            필터 해제
          </button>
        )}
        <span className="tm-grow" />
        <span className="ws-total">
          합계 <b>₩ {detailsSum.toLocaleString()}</b>
        </span>
      </div>

      <div>
        {detailsFiltered.length === 0 ? (
          <div className="tm-empty">조건에 맞는 지출이 없어요.</div>
        ) : (
          visibleDetails.map((item) => {
            const link = item.scheduleItemId != null ? scheduleItemLabelById.get(item.scheduleItemId) : undefined;
            const sub = [
              CAT_LABEL[item.cat] ?? item.cat,
              item.date.substring(5).replace("-", "."),
              item.payer,
              item.method ? (item.method === "CARD" ? "카드" : "현금") : null,
              item.expenseKind === "PERSONAL" ? "개인" : null,
              link ? `연결 ${link}` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className="ws-exrow"
                aria-label={`${item.title} 지출 열기`}
                onClick={() => openEditModal(item.id)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openEditModal(item.id);
                  }
                }}
              >
                <span className="ws-exmain">
                  <b>{item.title}</b>
                  {item.storeName && <span className="tm-hint"> · {item.storeName}</span>}
                  {item.receipt && (
                    <button
                      type="button"
                      className="tm-btn tm-btn--link tm-btn--sm ws-ulink ws-exreceipt"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.receipt) viewReceipt(item.receipt);
                      }}
                    >
                      {item.fileName || "영수증"}
                    </button>
                  )}
                </span>
                <span className="ws-exsub">{sub}</span>
                <span className="ws-examt">₩ {item.cost.toLocaleString()}</span>
              </div>
            );
          })
        )}

        {detailsFiltered.length > visibleCount && (
          <button type="button" className="tm-btn tm-btn--block tm-mt-2" onClick={() => setVisibleCount((v) => v + 10)}>
            더보기
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
