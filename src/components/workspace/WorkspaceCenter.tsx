import React, { useState } from "react";
import "../../styles/workspace/center.css";

import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import { useTimeline } from "../../hooks/useTimeline";
import { useTopOption } from "../../hooks/useTopOption";
import { useExpenses } from "../../hooks/useExpenses";
import type { ExpenseMember } from "../../hooks/useExpenses";

import ExpenseView from "./ExpenseView";
import VoucherView from "./VoucherView";

import ExpenseModal from "./ExpenseModal";
import SettleDetailModal from "./SettleDetailModal";

import { useVouchers } from "../../hooks/useVouchers";
import VoucherModal from "./VoucherModal";

import type { UseNoticesStore } from "../../hooks/useNotices";

interface Props {
  noticeStore: UseNoticesStore;
}

const WorkspaceCenter: React.FC<Props> = ({ noticeStore }) => {
  const { notices, openAdd, openEdit, deleteNotice } = noticeStore;

  const { activeView, currentDay } = useWorkspaceCore();
  const { nodes, addNode, updateNode } = useTimeline(currentDay);
  const { open, isPrivate, toggle, rename, togglePrivacy, dropdownRef } =
    useTopOption();

  const expenseStore = useExpenses();
  const [settleTarget, setSettleTarget] = useState<ExpenseMember | null>(null);

  const voucherStore = useVouchers();
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  return (
    <div className="ws-main">
      {/* TOP BAR */}
      <div className="ws-top">
        <button
          className="ws-back-btn"
          onClick={() => {
            window.location.href = "/mytrips";
          }}
        >
          <i className="fa-solid fa-arrow-left"></i> BACK
        </button>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            id="privacy-badge"
            style={{
              width: "24px",
              textAlign: "center",
              fontSize: "16px",
              cursor: "default",
              display: "inline-block",
              color: isPrivate ? "#000" : "var(--accent)",
            }}
          >
            <i
              className={`fa-solid ${isPrivate ? "fa-lock" : "fa-lock-open"}`}
            ></i>
          </span>

          <div
            className="ws-title"
            id="ws-title-text"
            style={{ marginLeft: "8px" }}
          >
            OSAKA X-MAS 🎄
          </div>
        </div>

        <div
          className={`ws-opt-wrapper ${open ? "active" : ""}`}
          ref={dropdownRef}
        >
          <button className="ws-opt-btn" onClick={toggle}>
            <i className="fa-solid fa-ellipsis"></i>
          </button>

          <div
            id="ws-opt-dropdown"
            className={`ws-dropdown ${open ? "active" : ""}`}
          >
            <div className="ws-dd-item" onClick={rename}>
              <i className="fa-solid fa-pen"></i> 이름 변경
            </div>

            <div
              className="ws-dd-item"
              onClick={() => {
                alert("🔗 여행 링크 복사 완료!");
              }}
            >
              <i className="fa-solid fa-link"></i> 공유하기
            </div>

            <div className="ws-dd-item" onClick={togglePrivacy}>
              <i
                className={`fa-solid ${isPrivate ? "fa-lock" : "fa-lock-open"}`}
                id="privacy-icon"
              ></i>
              <span id="privacy-text">
                {isPrivate ? "공개로 전환" : "비공개로 전환"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="ws-body">
        {/* ================= TIMELINE VIEW ================= */}
        <div
          id="view-timeline"
          className={`content-view ${
            activeView === "timeline" ? "active" : ""
          }`}
        >
          <h2
            id="day-title"
            style={{ fontSize: "24px", fontWeight: 800, marginBottom: "10px" }}
          >
            {currentDay === "Day ALL" ? "Day ALL" : currentDay}
          </h2>

          <p
            style={{
              color: "#666",
              marginBottom: "30px",
              fontFamily: "var(--font-mono)",
            }}
          >
            2025.12.24 - 12.25
          </p>

          <div className="timeline">
            {nodes.map((n, idx) => (
              <div className="tl-item" key={idx}>
                <div className="tl-dot"></div>

                <div
                  className="tl-time"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    updateNode(idx, "time", e.currentTarget.innerText)
                  }
                >
                  {n.time}
                </div>

                <div className="tl-box">
                  <div
                    style={{ fontWeight: "bold", fontSize: "16px" }}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      updateNode(idx, "title", e.currentTarget.innerText)
                    }
                  >
                    {n.title}
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#555",
                      marginTop: "5px",
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      updateNode(idx, "desc", e.currentTarget.innerText)
                    }
                  >
                    {n.desc}
                  </div>
                </div>
              </div>
            ))}

            <button
              style={{
                width: "100%",
                border: "2px dashed #ccc",
                padding: "15px",
                fontWeight: "bold",
                color: "#999",
                cursor: "pointer",
                background: "transparent",
              }}
              onClick={addNode}
            >
              + ADD NODE
            </button>
          </div>
        </div>

        {/* ===== EXPENSE ===== */}
        <div
          id="view-expenses"
          className={`content-view ${
            activeView === "expenses" ? "active" : ""
          }`}
        >
          <div className="ws-inner">
            {/* ✅ ExpenseView는 화면만 렌더, settleTarget은 Center가 관리 */}
            <ExpenseView
              store={expenseStore}
              onOpenSettleDetail={(m) => setSettleTarget(m)}
            />

            {/* ✅ ExpenseModal은 Center에서만 렌더 (ExpenseView에서 렌더 금지) */}
            <ExpenseModal store={expenseStore} />

            {/* ✅ null guard */}
            {settleTarget && (
              <SettleDetailModal
                store={expenseStore}
                target={settleTarget}
                onClose={() => setSettleTarget(null)}
              />
            )}
          </div>
        </div>

        {/* ===== VOUCHER ===== */}
        <div
          id="view-voucher"
          className={`content-view ${activeView === "voucher" ? "active" : ""}`}
        >
          <VoucherView
            vouchers={voucherStore.vouchers}
            onAdd={() => setIsVoucherModalOpen(true)}
            onDelete={voucherStore.deleteVoucher}
            onDownload={voucherStore.downloadVoucher}
          />

          {isVoucherModalOpen && (
            <VoucherModal
              onClose={() => setIsVoucherModalOpen(false)}
              onSave={voucherStore.addVoucher}
            />
          )}
        </div>

        {/* ===== NOTICE (TRIP NOTICE) ===== */}
        <div
          id="view-notice"
          className={`content-view ${activeView === "notice" ? "active" : ""}`}
        >
          {/* ===== HEADER (원본에 존재) ===== */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 800,
                margin: 0,
              }}
            >
              TRIP NOTICE
            </h2>

            <button
              className="btn-sm"
              style={{ padding: "8px 15px" }}
              onClick={openAdd} // ✅ 여기
            >
              + NEW NOTICE
            </button>
          </div>

          {/* ===== NOTICE LIST ===== */}
          <div className="notice-container" id="notice-list-container">
            {notices.map((n, idx) => (
              <div key={idx} className={`notice-card ${n.color}`}>
                <div className="nc-tag">{n.tag}</div>

                <div className="nc-title">{n.title}</div>

                <div className="nc-content">{n.content}</div>

                <div className="nc-controls">
                  <span className="nc-btn edit" onClick={() => openEdit(idx)}>
                    EDIT
                  </span>
                  <span
                    className="nc-btn del"
                    onClick={() => deleteNotice(idx)}
                  >
                    DELETE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCenter;
