// src/features/workspace/components/layout/WorkspaceCenter.tsx

import React, { useState, useMemo, useEffect } from "react";

import "../../styles/center.css";
import "../../styles/layout.css";

import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import { useTimeline } from "../../hooks/useTimeline";
import { usePlaces } from "../../hooks/usePlaces";
import { useTopOption } from "../../hooks/useTopOption";
import { useExpenses } from "../../hooks/useExpenses";
import type { ExpenseMember } from "../../hooks/expense.ui.types";
import { useParams } from "react-router-dom";

import { ExpenseView } from "../expense";
import { VoucherView } from "../voucher";
import { NoticeView } from "../notice";
import { DayAllView, DayDetailView } from "../schedule";
import WorkspaceModals from "./WorkspaceModals";
import NoticeModal from "../notice/NoticeItemModal";
import ExpenseModal from "../expense/modal/ExpenseModal";
import SettleDetailModal from "../../components/expense/modal/SettleDetailModal";
import VoucherModal from "../voucher/VoucherModal";

import { useVouchers } from "../../hooks/useVouchers";

import type { UseNoticesStore } from "../../hooks/useNotices";

interface Props {
  noticeStore: UseNoticesStore;
}

const WorkspaceCenter: React.FC<Props> = ({ noticeStore }) => {
  const { activeView, currentDay, trip, updateTripData, syncDateLogs } = useWorkspaceCore();

  const params = useParams<{ tripId: string }>();
  const tripId = Number(params.tripId) || null;

  // usePlaces: 장소 목록 (localStorage 대체)
  const { places: savedPlaces, addPlace } = usePlaces(tripId);

  // useTimeline: tripId 전달
  const {
    nodes,
    allDays,
    addNode,
    addNodeFromPlace,
    updateNode,
    deleteNode,
    reorderNodes,
    moveNodeToDay,
    loadFromExternal,
  } = useTimeline(currentDay, tripId);

  // allDays 변경 시 사이드바 탭 동기화
  useEffect(() => {
    const keys = Object.keys(allDays);
    if (keys.length > 0) syncDateLogs(keys);
  }, [allDays]);

  // dayKeys: allDays 상태에서 바로 추출 (localStorage 불필요)
  const dayKeys: string[] = useMemo(() => Object.keys(allDays), [allDays]);

  const {
    notices,
    openAdd,
    openEdit: openNoticeEdit,
    deleteNotice,
    togglePin,
    isLoading: isNoticeLoading,
  } = noticeStore;

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

  return (
    <div className="ws-main">
      <div className="ws-top">
        <div className="ws-title-wrap">
          <span id="privacy-badge">
            <i className={`fa-solid ${isPrivate ? "fa-lock" : "fa-lock-open"}`} />
          </span>
          <div className="ws-title">{trip.title}</div>
        </div>

        <div className={`ws-opt-wrapper ${open ? "active" : ""}`} ref={dropdownRef}>
          <button className="ws-opt-btn" onClick={toggle}>
            <i className="fa-solid fa-ellipsis"></i>
          </button>
          <div className={`ws-dropdown ${open ? "active" : ""}`}>
            <div className="ws-dd-item" onClick={(e) => { e.stopPropagation(); openTripEdit(); }}>
              <i className="fa-solid fa-pen-to-square"></i> 여행 수정
            </div>
            <div className="ws-dd-item">
              <i className="fa-solid fa-users"></i> 멤버 관리
            </div>
            <div className="ws-dd-item" onClick={togglePrivacy}>
              <i className={`fa-solid ${isPrivate ? "fa-lock" : "fa-lock-open"}`}></i>
              <span>{isPrivate ? "공개로 전환" : "비공개로 전환"}</span>
            </div>
            <div className="ws-dd-item" onClick={downloadPDF}>
              <i className="fa-solid fa-file-pdf"></i> PDF 다운로드
            </div>
          </div>
        </div>
      </div>

      <div className="ws-body">
        <div id="view-timeline" className={`content-view ${activeView === "timeline" ? "active" : ""}`}>
          {currentDay === "DAY ALL" ? (
            <DayAllView
              tripId={tripId ?? 0}
              tripTitle={trip.title}
              startDate={trip.startDate}
              endDate={trip.endDate}
              onScheduleGenerated={loadFromExternal}
            />
          ) : (
            <DayDetailView
              dayTitle={currentDay}
              tripTitle={trip.title}
              startDate={trip.startDate}
              endDate={trip.endDate}
              nodes={nodes}
              savedPlaces={savedPlaces}
              dayKeys={dayKeys}
              addNode={addNode}
              addNodeFromPlace={addNodeFromPlace}
              addPlace={addPlace}
              updateNode={updateNode}
              deleteNode={deleteNode}
              reorderNodes={reorderNodes}
              moveNodeToDay={moveNodeToDay}
            />
          )}
        </div>

        <div id="view-expenses" className={`content-view ${activeView === "expenses" ? "active" : ""}`}>
          <div className="ws-inner">
            <ExpenseView store={expenseStore} onOpenSettleDetail={(m) => setSettleTarget(m)} />
            <ExpenseModal store={expenseStore} />
            {settleTarget && (
              <SettleDetailModal
                store={expenseStore}
                target={settleTarget}
                onClose={() => setSettleTarget(null)}
              />
            )}
          </div>
        </div>

        <div id="view-voucher" className={`content-view ${activeView === "voucher" ? "active" : ""}`}>
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
              onSave={(request, file) => {
                if (!file) { alert("파일을 첨부해주세요."); return; }
                return voucherStore.addVoucher(request, file);
              }}
            />
          )}
        </div>

        <div id="view-notice" className={`content-view ${activeView === "notice" ? "active" : ""}`}>
          <NoticeView
            notices={notices}
            isLoading={isNoticeLoading}
            onAdd={openAdd}
            onEdit={openNoticeEdit}
            onDelete={deleteNotice}
            onTogglePin={togglePin}
          />
        </div>
      </div>

      {isEditOpen && (
        <WorkspaceModals
          init={trip}
          onClose={closeEdit}
          onSave={(data) => { void updateTripData(data); closeEdit(); }}
        />
      )}

      <NoticeModal noticeStore={noticeStore} />
    </div>
  );
};

export default WorkspaceCenter;