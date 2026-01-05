import React, { useState, useEffect } from "react";

import "../../styles/workspace/center.css";
import "../../styles/workspace/layout.css";

import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import { useTimeline } from "../../hooks/useTimeline";
import { useTopOption } from "../../hooks/useTopOption";
import { useExpenses } from "../../hooks/useExpenses";
import type { ExpenseMember } from "../../hooks/useExpenses";

import ExpenseView from "./ExpenseView";
import VoucherView from "./VoucherView";
import DayAllView from "./DayAllView";
import DayDetailView from "./DayDetailView";

import WorkspaceModals from "./WorkspaceModals";
import NoticeModal from "./NoticeItemModal";
import ExpenseModal from "./ExpenseModal";
import SettleDetailModal from "./SettleDetailModal";

import { useVouchers } from "../../hooks/useVouchers";
import VoucherModal from "./VoucherModal";

import type { UseNoticesStore } from "../../hooks/useNotices";

interface Props {
  noticeStore: UseNoticesStore;
  rightOpen: boolean;
  setRightOpen: (v: boolean) => void;
}

const WorkspaceCenter: React.FC<Props> = ({
  noticeStore,
  rightOpen,
  setRightOpen,
}) => {
  const { activeView, currentDay } = useWorkspaceCore();

  // currentDay에 따라 useTimeline 호출
  const { nodes, addNode, updateNode } = useTimeline(currentDay);

  // Notice 관련 openEdit은 openNoticeEdit으로 변경
  const {
    notices,
    openAdd,
    openEdit: openNoticeEdit,
    deleteNotice,
    togglePin,
  } = noticeStore;

  // Trip 관련 openEdit은 openTripEdit으로 변경
  const {
    open,
    isPrivate,
    isEditOpen,
    toggle,
    openEdit: openTripEdit,
    closeEdit,
    downloadPDF,
    togglePrivacy,
    dropdownRef,
  } = useTopOption();

  const expenseStore = useExpenses();
  const [settleTarget, setSettleTarget] = useState<ExpenseMember | null>(null);

  const voucherStore = useVouchers();
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  const [trip, setTrip] = useState({
    title: "OSAKA X-MAS 🎄",
    startDate: "2025-12-24",
    endDate: "2025-12-25",
  });

  // 🔥 LocalStorage에서 초기값 로드
  useEffect(() => {
    const saved = localStorage.getItem("tripData");
    if (saved) setTrip(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("tripData", JSON.stringify(trip));
  }, [trip]);

  return (
    <div className="ws-main">
      {/* TOP BAR */}
      <div className="ws-top">
        <div className="ws-title-wrap">
          <span id="privacy-badge">
            <i
              className={`fa-solid ${isPrivate ? "fa-lock" : "fa-lock-open"}`}
            />
          </span>

          <div className="ws-title">{trip.title}</div>
        </div>

        <div
          className={`ws-opt-wrapper ${open ? "active" : ""}`}
          ref={dropdownRef}
        >
          <button className="ws-opt-btn" onClick={toggle}>
            <i className="fa-solid fa-ellipsis"></i>
          </button>

          <div className={`ws-dropdown ${open ? "active" : ""}`}>
            {/* 1. 여행 수정 */}
            <div
              className="ws-dd-item"
              onClick={(e) => {
                e.stopPropagation();
                openTripEdit();
              }}
            >
              <i className="fa-solid fa-pen-to-square"></i> 여행 수정
            </div>

            {/* 2. PDF 다운로드 */}
            <div className="ws-dd-item" onClick={downloadPDF}>
              <i className="fa-solid fa-file-pdf"></i> PDF 다운로드
            </div>

            {/* 3. 공개/비공개 전환 */}
            <div className="ws-dd-item" onClick={togglePrivacy}>
              <i
                className={`fa-solid ${isPrivate ? "fa-lock" : "fa-lock-open"}`}
              ></i>
              <span>{isPrivate ? "공개로 전환" : "비공개로 전환"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="ws-body">
        {/* ✅ 오른쪽 패널 토글 버튼 제거 (timeline에서는 사용 안함) */}

        {/* ================= TIMELINE VIEW ================= */}
        <div
          id="view-timeline"
          className={`content-view ${
            activeView === "timeline" ? "active" : ""
          }`}
        >
          {currentDay === "DAY ALL" ? (
            <DayAllView
              tripTitle={trip.title}
              startDate={trip.startDate}
              endDate={trip.endDate}
            />
          ) : (
            <DayDetailView
              dayTitle={currentDay}
              tripTitle={trip.title}
              startDate={trip.startDate}
              endDate={trip.endDate}
              nodes={nodes}
              addNode={addNode}
              updateNode={updateNode}
              rightOpen={rightOpen}
              setRightOpen={setRightOpen}
            />
          )}
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
            onPreview={voucherStore.previewVoucher}
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
              onClick={openAdd}
            >
              + NEW NOTICE
            </button>
          </div>

          {/* ===== NOTICE LIST ===== */}
          <div className="notice-container" id="notice-list-container">
            {notices.map((n) => (
              <div
                key={n.id}
                className={`notice-card ${n.color} ${
                  n.isPinned ? "pinned" : ""
                }`}
              >
                {/* ✅ 고정 버튼 (id 전달) */}
                <div
                  className={`nc-pin-btn ${n.isPinned ? "active" : ""}`}
                  onClick={() => togglePin(n.id)}
                >
                  <i className="fa-solid fa-thumbtack"></i>
                </div>

                <div className="nc-tag">{n.tag}</div>

                <div className="nc-title">{n.title}</div>

                <div className="nc-content">{n.content}</div>

                <div className="nc-controls">
                  <span
                    className="nc-btn edit"
                    onClick={() => openNoticeEdit(n.id)}
                  >
                    EDIT
                  </span>
                  <span
                    className="nc-btn del"
                    onClick={() => deleteNotice(n.id)}
                  >
                    DELETE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {isEditOpen && (
        <WorkspaceModals
          init={trip}
          onClose={closeEdit}
          onSave={(data) => {
            setTrip(data);
            closeEdit();
          }}
        />
      )}

      <NoticeModal noticeStore={noticeStore} />
    </div>
  );
};

export default WorkspaceCenter;