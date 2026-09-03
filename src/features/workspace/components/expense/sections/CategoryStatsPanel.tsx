// src/features/workspace/components/expense/sections/CategoryStatsPanel.tsx
import React from "react";
import type {
  CategoryDisplayItem,
  PaymentMode,
} from "../../../hooks/expense.ui.types";
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
  const filteredList = categoryDisplayList.filter((c) => {
    if (paymentMode === "POOL" && c.cat === PERSONAL_REFERENCE_KEY) {
      return false;
    }
    return true;
  });

  return (
    <div className="stat-box stat-box--category">
      <div className="stat-head">CATEGORY SPEND (공동 지출)</div>
      <div className="stat-body stat-body--fill">
        <div id="cat-list">
          {filteredList.length === 0 ? (
            <div className="cat-empty">
              아직 지출이 없습니다
              <small>※ 지출을 추가하면 카테고리별 합계가 표시됩니다.</small>
            </div>
          ) : (
            filteredList.map((c) => {
              const isPersonal = c.cat === PERSONAL_REFERENCE_KEY;

              return (
                <div
                  key={c.cat}
                  className={`cat-item-box ${activeCat === c.cat ? "active" : ""} ${isPersonal ? "cat-item-box--personal" : ""}`}
                  onClick={() => onClickCategory(c.cat)}
                >
                  <div className="cat-top">
                    <span style={{ fontWeight: "bold" }}>
                      {isPersonal
                        ? "개인 지출 (참고용)"
                        : (CAT_LABEL[c.cat] ?? c.cat)}
                    </span>

                    <span>
                      ₩ {c.amount.toLocaleString()}
                      <span style={{ color: "#888", fontSize: "11px" }}>
                        {" "}
                        (
                        {isPersonal
                          ? `개인 ${personalPercent}% | 공동 ${sharedPercent}%`
                          : `${c.percent}%`}
                        )
                      </span>
                    </span>
                  </div>

                  <div className="cat-bar-track">
                    <div
                      className={`cat-bar-thumb ${isPersonal ? "cat-bar-thumb--personal" : ""}`}
                      style={{ width: `${Math.max(c.percent, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {filteredList.length > 0 && (
        <div className="stat-note">
          ※ 카테고리를 클릭하면 필터가 자동으로 적용됩니다.
        </div>
      )}
    </div>
  );
};

export default CategoryStatsPanel;
