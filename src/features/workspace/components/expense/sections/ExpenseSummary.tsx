// src/features/workspace/components/expense/sections/ExpenseSummary.tsx
import React from "react";

interface ExpenseSummaryProps {
  summary: { totalBudget: number; totalSpent: number; remaining: number };
  settings: any;
  onClickCurrent: () => void;
}

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  summary,
  settings,
  onClickCurrent,
}) => (
  <div className="exp-summary">
    <div
      className="exp-card"
      onClick={onClickCurrent}
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

export default ExpenseSummary;
