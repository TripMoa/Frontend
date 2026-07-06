// src/features/workspace/components/layout/WorkspaceCenter.tsx

import React, { useState, useMemo, useEffect } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { leaveTrip } from "../../../../api/trip.api";

import "../../styles/center.css";
import "../../styles/layout.css";

import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import { useTimeline } from "../../hooks/useTimeline";
import { usePlaces } from "../../hooks/usePlaces";
import { useTopOption } from "../../hooks/useTopOption";
import { useExpenses } from "../../hooks/useExpenses";
import type { ExpenseMember } from "../../hooks/expense.ui.types";

import { ExpenseView } from "../expense";
import { VoucherView } from "../voucher";
import { NoticeView } from "../notice";
import { DayAllView, DayDetailView } from "../schedule";
import WorkspaceTripModal from "./WorkspaceTripModal";
import WorkspaceMemberModal from "./WorkspaceMemberModal";
import NoticeModal from "../notice/NoticeItemModal";
import ExpenseModal from "../expense/modal/ExpenseModal";
import SettleDetailModal from "../../components/expense/modal/SettleDetailModal";
import VoucherModal from "../voucher/VoucherModal";

import { useVouchers } from "../../hooks/useVouchers";
import type { UseNoticesStore } from "../../hooks/useNotices";
import { useTripContext } from "../../hooks/useTripContext";

import { ActionPromptModal } from "../../../../shared/components/ActionPromptModal";

interface Props {
  noticeStore: UseNoticesStore;
}

const WorkspaceCenter: React.FC<Props> = ({ noticeStore }) => {
  const navigate = useNavigate();

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const { activeView, currentDay, trip, updateTripData, syncDateLogs } =
    useWorkspaceCore();

  const params = useParams<{ tripId: string }>();
  const tripId = Number(params.tripId) || null;

  const { ownerUserId, currentUserId } = useTripContext();

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const [noticeModal, setNoticeModal] = useState({
    open: false,
    title: "",
    headline: "",
    description: "",
  });

  const showNotice = (title: string, headline: string, description: string) => {
    setNoticeModal({ open: true, title, headline, description });
  };

  const closeNotice = () => {
    setNoticeModal((prev) => ({ ...prev, open: false }));
  };

  const isOwner = ownerUserId === currentUserId;

  // usePlaces: 장소 목록 (localStorage 대체)
  // DayAllView/DayDetailView가 동일한 인스턴스를 공유해야 탭 전환 시에도 최신 상태가 유지됨
  const { places: savedPlaces, addPlace, updatePlace, deletePlace } = usePlaces(tripId);

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
    togglePrivacy,
    dropdownRef,
  } = useTopOption();

  const expenseStore = useExpenses();
  const [settleTarget, setSettleTarget] = useState<ExpenseMember | null>(null);

  const voucherStore = useVouchers();
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  const handleLeaveTrip = async () => {
    if (!tripId) return;

    try {
      await leaveTrip(tripId);
      navigate("/mytrip");
    } catch (error: any) {
      console.error("여행 나가기 실패:", error);

      const message =
        error?.response?.data?.message ||
        "지출 또는 입금 내역이 있어 여행에서 나갈 수 없습니다.";

      showNotice("나가기 불가", "여행에서 나갈 수 없습니다", message);
    }
  };

  return (
    <div className="ws-main">
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
            {isOwner && (
              <div
                className="ws-dd-item"
                onClick={(e) => {
                  e.stopPropagation();
                  openTripEdit();
                  toggle();
                }}
              >
                <i className="fa-solid fa-pen-to-square"></i> 여행 수정
              </div>
            )}

            <div
              className="ws-dd-item"
              onClick={(e) => {
                e.stopPropagation();
                setIsMemberModalOpen(true);
                toggle();
              }}
            >
              <i className="fa-solid fa-users"></i> 멤버 관리
            </div>

            <div
              className="ws-dd-item danger"
              onClick={(e) => {
                e.stopPropagation();
                setIsLeaveModalOpen(true);
                toggle();
              }}
            >
              <i className="fa-solid fa-right-from-bracket"></i> 여행 나가기
            </div>
          </div>
        </div>
      </div>

      <div className="ws-body">
        <div
          id="view-timeline"
          className={`content-view ${activeView === "timeline" ? "active" : ""}`}
        >
          <div className="ws-inner">
            {currentDay === "DAY ALL" ? (
              <DayAllView
                tripId={tripId ?? 0}
                tripTitle={trip.title}
                startDate={trip.startDate}
                endDate={trip.endDate}
                onScheduleGenerated={loadFromExternal}
                savedPlaces={savedPlaces}
                addPlace={addPlace}
                updatePlace={updatePlace}
                deletePlace={deletePlace}
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
        </div>

        <div
          id="view-expenses"
          className={`content-view ${activeView === "expenses" ? "active" : ""}`}
        >
          <div className="ws-inner">
            <ExpenseView
              store={expenseStore}
              onOpenSettleDetail={(m) => setSettleTarget(m)}
            />
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

        <div
          id="view-voucher"
          className={`content-view ${activeView === "voucher" ? "active" : ""}`}
        >
          <div className="ws-inner">
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
                  if (!file) return;
                  return voucherStore.addVoucher(request, file);
                }}
              />
            )}
          </div>
        </div>

        <div
          id="view-notice"
          className={`content-view ${activeView === "notice" ? "active" : ""}`}
        >
          <div className="ws-inner">
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
      </div>

      {isEditOpen && (
        <WorkspaceTripModal
          init={trip}
          onClose={closeEdit}
          onSave={(data) => {
            void updateTripData({
              ...trip,
              ...data,
            });
            closeEdit();
          }}
        />
      )}

      {isMemberModalOpen && (
        <WorkspaceMemberModal
          tripId={tripId ?? 0}
          ownerUserId={ownerUserId ?? 0}
          onClose={() => setIsMemberModalOpen(false)}
        />
      )}

      <NoticeModal noticeStore={noticeStore} />

      <ActionPromptModal
        open={isLeaveModalOpen}
        title="LEAVE TRIP"
        headline="여행에서 나가시겠습니까?"
        description="소유주인 경우 자동으로 소유권이 양도될 수 있습니다."
        cancelText="취소"
        confirmText="나가기"
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={() => {
          setIsLeaveModalOpen(false);
          void handleLeaveTrip();
        }}
      />

      <ActionPromptModal
        open={noticeModal.open}
        title={noticeModal.title}
        headline={noticeModal.headline}
        description={noticeModal.description}
        confirmText="확인"
        hideCancel
        onClose={closeNotice}
        onConfirm={closeNotice}
      />
    </div>
  );
};

export default WorkspaceCenter;
