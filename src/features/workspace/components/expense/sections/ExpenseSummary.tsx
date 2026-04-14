// src/features/workspace/components/expense/sections/ExpenseSummary.tsx
import React from "react";
import type {
  ExpenseSettings,
  ExpenseSummary as ExpenseSummaryType,
} from "../../../hooks/expense.ui.types";

interface ExpenseSummaryProps {
  summary: ExpenseSummaryType;
  settings: ExpenseSettings;
  onClickCurrent: () => void;
}

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  summary,
  settings,
  onClickCurrent,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClickCurrent();
    }
  };

  return (
    <div className="exp-summary">
      <div
        className="exp-card"
        onClick={onClickCurrent}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="lbl">
          {settings.paymentMode === "POOL" ? "POOL BALANCE" : "TOTAL BUDGET"}
        </div>
        <div className="val">₩ {summary.totalBudget.toLocaleString()}</div>
      </div>

      <div className="exp-card highlight">
        <div className="lbl">TOTAL SPENT (공동 지출)</div>
        <div className="val">₩ {summary.totalSpent.toLocaleString()}</div>
      </div>

      <div className="exp-card">
        <div className="lbl">REMAINING</div>
        <div className="val">₩ {summary.remaining.toLocaleString()}</div>
      </div>
    </div>
  );
};

export default ExpenseSummary;
