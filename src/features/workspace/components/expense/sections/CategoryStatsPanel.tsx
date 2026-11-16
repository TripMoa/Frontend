// src/features/workspace/components/expense/sections/CategoryStatsPanel.tsx
//
// 정산 상자의 "카테고리별 지출" — 시안: 이름 · 진행 막대 · 비율과 금액. 누르면 아래 목록에 그 카테고리 필터가 걸린다.
import React from "react";
import type { CategoryDisplayItem, PaymentMode } from "../../../hooks/expense.ui.types";
import { PERSONAL_REFERENCE_KEY } from "../../../hooks/expense.ui.types";

interface CategoryStatsPanelProps {
  categoryDisplayList: CategoryDisplayItem[];
  activeCat: string;
  onClickCategory: (cat: string) => void;
  CAT_LABEL: Record<string, string>;
  personalPercent: number;
  sharedPercent: number;
  paymentMode?: PaymentMode;
}

const CategoryStatsPanel: React.FC<CategoryStatsPanelProps> = ({
  categoryDisplayList,
  activeCat,
  onClickCategory,
  CAT_LABEL,
  personalPercent,
  sharedPercent,
  paymentMode,
}) => {
  const list = categoryDisplayList.filter((c) => !(paymentMode === "POOL" && c.cat === PERSONAL_REFERENCE_KEY));

  if (list.length === 0) return <div className="tm-empty">아직 지출이 없습니다</div>;

  return (
    <>
      {list.map((c) => {
        const isPersonal = c.cat === PERSONAL_REFERENCE_KEY;
        const label = isPersonal ? "개인 지출" : (CAT_LABEL[c.cat] ?? c.cat);
        const pct = Math.max(0, Math.min(100, c.percent));
        return (
          <div
            key={c.cat}
            className={`tm-bar-row${activeCat === c.cat ? " is-on" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={`${label} 지출만 보기`}
            onClick={() => onClickCategory(c.cat)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClickCategory(c.cat);
              }
            }}
          >
            <span>{label}</span>
            <div className="tm-progress"><i style={{ width: `${pct}%` }} /></div>
            <b>
              {isPersonal ? `개인 ${personalPercent}% · 공동 ${sharedPercent}%` : `${c.percent}%`} · {c.amount.toLocaleString()}
            </b>
          </div>
        );
      })}
      <p className="tm-hint tm-mt-2">개인 지출은 참고용이에요. 카테고리를 누르면 아래 목록이 그 카테고리만 보여줘요.</p>
    </>
  );
};

export default CategoryStatsPanel;
