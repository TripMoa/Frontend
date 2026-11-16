// src/features/workspace/components/expense/sections/ExpenseSummary.tsx
//
// 경비 맨 윗줄 — 시안: 요약(예산·지출·남은 금액)은 글씨로, 오른쪽에 [정산 설정][+ 지출 추가].
import React from "react";
import type {
  ExpenseSettings,
  ExpenseSummary as ExpenseSummaryType,
} from "../../../hooks/expense.ui.types";

interface ExpenseSummaryProps {
  summary: ExpenseSummaryType;
  settings: ExpenseSettings;
  isOwner: boolean;
  /** 적용하지 않은 설정 변경이 있으면 "정산 설정 ●" */
  hasPendingSettingsChange: boolean;
  isBusy: boolean;
  onOpenSettings: () => void;
  onAddExpense: () => void;
}

const won = (n: number) => `₩ ${n.toLocaleString("ko-KR")}`;

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  summary,
  settings,
  isOwner,
  hasPendingSettingsChange,
  isBusy,
  onOpenSettings,
  onAddExpense,
}) => {
  const cells: { label: string; value: number; neg?: boolean }[] = [
    { label: settings.paymentMode === "POOL" ? "통장" : "예산", value: summary.totalBudget },
    { label: "지출", value: summary.totalSpent },
    { label: "남은 금액", value: summary.remaining, neg: summary.remaining < 0 },
  ];

  return (
    <div className="ws-extop">
      <div className="ws-sumline">
        {cells.map((c) => (
          <div key={c.label} className="ws-sumcell">
            <span className="ws-when__l">{c.label}</span>
            <b className={`ws-sumv${c.neg ? " is-neg" : ""}`}>{won(c.value)}</b>
          </div>
        ))}
      </div>
      <div className="ws-exacts">
        {isOwner && (
          <button type="button" className="tm-btn tm-btn--sm" onClick={onOpenSettings}>
            정산 설정{hasPendingSettingsChange ? " ●" : ""}
          </button>
        )}
        <button type="button" className="tm-btn tm-btn--sm tm-btn--primary" onClick={onAddExpense} disabled={isBusy}>
          + 지출 추가
        </button>
      </div>
    </div>
  );
};

export default ExpenseSummary;
