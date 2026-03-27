// src/features/workspace/components/expense/sections/ExpenseList.tsx
import React from "react";

interface ExpenseListProps {
  detailsFiltered: any[];
  visibleDetails: any[];
  settings: any;
  shareType: "ALL" | "SHARED" | "PERSONAL";
  setShareType: (t: any) => void;
  activePayer: string;
  setActivePayer: (p: string) => void;
  activeCat: string;
  setActiveCat: (c: string) => void;
  resetDetailsFilters: () => void;
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  detailsSum: number;
  CAT_LABEL: Record<string, string>;
  members: any[];
  openEditModal: (id: number) => void;
  viewReceipt: (e: React.MouseEvent, base64: string) => void;
  openAddModal: () => void;
  detailsRef: React.RefObject<HTMLDivElement | null>;
}

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
  resetDetailsFilters,
  visibleCount,
  setVisibleCount,
  detailsSum,
  CAT_LABEL,
  members,
  openEditModal,
  viewReceipt,
  openAddModal,
  detailsRef,
}) => {
  const getInvolvedLabel = (item: any) => {
    const unique = Array.from(new Set((item.involved ?? []).filter(Boolean)));

    if (unique.length === 0) return "-";
    if (unique.length >= Math.max(1, members.length)) return "ALL";
    return unique.join(", ");
  };

  return (
    <div className="exp-list-wrapper" ref={detailsRef}>
      <div className="exp-header">
        <span
          style={{ flex: 2, display: "flex", alignItems: "center", gap: 8 }}
        >
          DETAILS
          {settings.paymentMode !== "POOL" && (
            <div className="seg">
              {["ALL", "SHARED", "PERSONAL"].map((t) => (
                <button
                  key={t}
                  className={`seg-btn ${shareType === t ? "active" : ""}`}
                  onClick={() => setShareType(t as any)}
                >
                  {t === "ALL" ? "전체" : t === "SHARED" ? "공동" : "개인"}
                </button>
              ))}
            </div>
          )}
          {activePayer !== "ALL" && (
            <button
              className="cat-chip active"
              onClick={() => setActivePayer("ALL")}
            >
              {activePayer} ✕
            </button>
          )}
          {activeCat !== "ALL" && (
            <button
              className="cat-chip active"
              onClick={() => setActiveCat("ALL")}
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
          <button
            className={`cat-chip ${activeCat === "ALL" ? "active" : ""}`}
            onClick={resetDetailsFilters}
          >
            전체 필터 해제
          </button>
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
          <div className="details-empty">내역이 없습니다.</div>
        ) : (
          visibleDetails.map((item) => (
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
                  <span>{item.date.substring(5)}</span> |{" "}
                  <span>{item.payer} 결제</span>
                  {item.method && (
                    <>
                      {" "}
                      |{" "}
                      <span className="badge-method">
                        {item.method === "CARD" ? "💳 CARD" : "💵 CASH"}
                      </span>
                    </>
                  )}
                  |{""}
                  {item.expenseKind && (
                    <span
                      className={`badge-kind ${item.expenseKind === "SHARED" ? "is-shared" : "is-personal"}`}
                    >
                      {item.expenseKind === "SHARED" ? "공동" : "개인"} 지출
                    </span>
                  )}
                  |{" "}
                  <span style={{ color: "#2196F3", fontWeight: "bold" }}>
                    <i className="fa-solid fa-user-group"></i>{" "}
                    {getInvolvedLabel(item)}
                  </span>
                </div>
              </div>
              <div className="exp-cost">- {item.cost.toLocaleString()}</div>
            </div>
          ))
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
  );
};

export default ExpenseList;
