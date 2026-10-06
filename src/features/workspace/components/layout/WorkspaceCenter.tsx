// src/features/workspace/components/layout/WorkspaceCenter.tsx

import React, { useState, useMemo, useEffect } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { leaveTrip } from "../../../../api/trip.api";

import "../../styles/center.css";
import "../../styles/layout.css";

import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import { useTimeline } from "../../hooks/useTimeline";
import { computeDayTabs, countTripDays, dayKeysWithItems } from "../../hooks/dayTabs";
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

  const {
    activeView,
    currentDay,
    trip,
    updateTripData,
    syncDateLogs,
    selectTab,
  } = useWorkspaceCore();

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
    dayInfo,
    setNodeStay,
    setNodePin,
    setDayAutoCompute,
    updateDaySettings,
    replaceNodePlace,
    setNodeMemo,
    addNode,
    addNodeFromPlace,
    updateNode,
    deleteNode,
    reorderNodes,
    moveNodeToDay,
    loadFromExternal,
    refetch,
    error: timelineLoadError,
    actionError: timelineActionError,
  } = useTimeline(currentDay, tripId);

  // 타임라인 조작(추가·수정·삭제·이동) 실패 안내 — 서버 기준으로 되돌린 뒤에도 사용자가 이유를 알 수 있게 토스트로 보여준다
  const [timelineToast, setTimelineToast] = useState<string | null>(null);
  useEffect(() => {
    if (!timelineActionError) return;
    setTimelineToast(timelineActionError.message);
    const timer = setTimeout(() => setTimelineToast(null), 3500);
    return () => clearTimeout(timer);
  }, [timelineActionError]);
  useEffect(() => {
    if (!timelineLoadError) return;
    setTimelineToast(timelineLoadError);
    const timer = setTimeout(() => setTimelineToast(null), 3500);
    return () => clearTimeout(timer);
  }, [timelineLoadError]);

  // AI 일정 생성 직후 처리
  // 1) 응답으로 바로 화면을 채우고(체감 속도), 2) 사이드바 일차 탭을 새 구성으로 교체(줄어든 일차 탭 제거),
  // 3) 서버 기준으로 다시 불러와 카테고리/좌표/요금·환승 정보 등 응답 매칭이 놓친 값과 빈 날의 scheduleId를 보정한다.
  const handleScheduleGenerated = (
    generated: Parameters<typeof loadFromExternal>[0],
  ) => {
    loadFromExternal(generated);
    syncDateLogs(Object.keys(generated), true);
    void refetch();
  };

  // 여행 기간을 바꿨을 때 일정에 있는 일수와 어긋나면 안내 — 일정은 자동으로 지우지 않고 사용자가 고르게 함
  const [dateChangePrompt, setDateChangePrompt] = useState({
    open: false,
    headline: "",
    description: "",
  });
  const [autoOpenAiModal, setAutoOpenAiModal] = useState(false);

  const checkScheduleAfterDateChange = (next: typeof trip) => {
    if (next.startDate === trip.startDate && next.endDate === trip.endDate) return;

    const scheduledDays = Math.max(
      0,
      ...Object.keys(allDays).map((key) => Number(/\d+/.exec(key)?.[0] ?? 0)),
    );
    if (scheduledDays === 0) return; // 생성된 일정이 아직 없음

    const newDays = countTripDays(next.startDate, next.endDate);
    if (newDays == null || newDays === scheduledDays) return;

    setDateChangePrompt({
      open: true,
      headline:
        newDays < scheduledDays
          ? `여행 기간이 ${newDays}일로 줄었는데, 일정에는 ${scheduledDays}일치가 있어요`
          : `여행 기간이 ${newDays}일로 늘었는데, 일정은 ${scheduledDays}일치만 있어요`,
      description:
        "AI 일정을 지금 다시 생성할 수 있어요. 다시 생성하면 기존 일정이 새로 만들어지고, 일정에 연결해둔 바우처·지출의 연결은 풀려요. 직접 정리하려면 '직접 정리할게요'를 눌러주세요.",
    });
  };

  const closeDateChangePrompt = () =>
    setDateChangePrompt((prev) => ({ ...prev, open: false }));

  const regenerateNow = () => {
    closeDateChangePrompt();
    selectTab("DAY ALL", "timeline");
    setAutoOpenAiModal(true);
  };

  // 일차 목록 = 여행 기간의 DAY 1..N + 노드가 있는 일차. 사이드바 탭과 "다른 날로 이동" 목록이 같은 목록을 쓴다.
  // 기간 밖 일차는 노드가 남아 있을 때만 보이고(정리를 끝내면 사라짐), 기간 안의 빈 일차는 옮겨 오거나 직접 채울 수 있게 보인다.
  const dayKeys: string[] = useMemo(
    () => computeDayTabs(trip.startDate, trip.endDate, dayKeysWithItems(allDays)),
    [allDays, trip.startDate, trip.endDate],
  );

  useEffect(() => {
    syncDateLogs(dayKeys, true);
    // 보고 있던 일차 탭이 사라졌으면(기간을 줄이고 비운 일차) DAY ALL로 돌아간다
    if (dayKeys.length > 0 && activeView === "timeline" && currentDay !== "DAY ALL" && !dayKeys.includes(currentDay)) {
      selectTab("DAY ALL", "timeline");
    }
  }, [dayKeys]);


  // 현재 일정에 들어 있는 항목(제목·좌표) — DAY ALL의 "일정 미포함" 표시용
  const scheduledItems = useMemo(
    () =>
      Object.values(allDays)
        .flat()
        .map((n) => ({ title: n.title, lat: n.placeInfo?.lat, lng: n.placeInfo?.lng })),
    [allDays],
  );

  // 일차별로 일정에 들어 있는 노드(제목·좌표) — 일차 화면의 "저장한 장소에서 고르기"가 어느 날에 있는지 표시하는 데 쓴다
  const scheduledByDay = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(allDays).map(([day, dayNodes]) => [
          day,
          dayNodes.map((n) => ({ title: n.title, lat: n.placeInfo?.lat, lng: n.placeInfo?.lng })),
        ]),
      ),
    [allDays],
  );

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
  const [prefillExpenseScheduleItemId, setPrefillExpenseScheduleItemId] =
    useState<number | null>(null);

  // 지출 모달이 닫히면(저장/취소 무관) 프리필 값을 비워서, 다음에 일반 "+ ADD" 버튼으로
  // 열었을 때 이전 일정 연결 값이 새어 들어가지 않게 함
  useEffect(() => {
    if (!expenseStore.isExpenseModalOpen) {
      setPrefillExpenseScheduleItemId(null);
    }
  }, [expenseStore.isExpenseModalOpen]);

  const voucherStore = useVouchers();
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [prefillScheduleItemId, setPrefillScheduleItemId] = useState<number | null>(null);

  // 바우처/지출 연결 드롭다운·배지에 공통으로 쓸 "일정 항목 목록" (day별로 묶어서 보여주기 위함)
  const scheduleItemOptions = useMemo(
    () =>
      Object.entries(allDays).flatMap(([day, dayNodes]) =>
        dayNodes
          .filter((n) => n.id != null)
          .map((n) => ({ id: n.id as number, day, time: n.time, title: n.title })),
      ),
    [allDays],
  );

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
                onScheduleGenerated={handleScheduleGenerated}
                savedPlaces={savedPlaces}
                addPlace={addPlace}
                updatePlace={updatePlace}
                deletePlace={deletePlace}
                autoOpenAiModal={autoOpenAiModal}
                onAutoOpenAiModalHandled={() => setAutoOpenAiModal(false)}
                scheduledItems={scheduledItems}
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
                scheduledByDay={scheduledByDay}
                dayInfo={dayInfo[currentDay]}
                setNodeStay={setNodeStay}
                setNodePin={setNodePin}
                setDayAutoCompute={setDayAutoCompute}
                updateDaySettings={updateDaySettings}
                replaceNodePlace={replaceNodePlace}
                setNodeMemo={setNodeMemo}
                addNode={addNode}
                addNodeFromPlace={addNodeFromPlace}
                addPlace={addPlace}
                updateNode={updateNode}
                deleteNode={deleteNode}
                reorderNodes={reorderNodes}
                moveNodeToDay={moveNodeToDay}
                vouchers={voucherStore.vouchers}
                onAddVoucherForItem={(scheduleItemId) => {
                  setPrefillScheduleItemId(scheduleItemId);
                  setIsVoucherModalOpen(true);
                }}
                expenses={expenseStore.expenses}
                onAddExpenseForItem={(scheduleItemId) => {
                  setPrefillExpenseScheduleItemId(scheduleItemId);
                  expenseStore.openAddModal();
                }}
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
              scheduleItemOptions={scheduleItemOptions}
            />
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
              onAdd={() => {
                setPrefillScheduleItemId(null);
                setIsVoucherModalOpen(true);
              }}
              onDelete={voucherStore.deleteVoucher}
              onDownload={voucherStore.downloadVoucher}
              onPreview={voucherStore.previewVoucher}
              scheduleItemOptions={scheduleItemOptions}
            />
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

      {/*
        Voucher/Expense 모달은 일정(timeline) 탭의 일정 항목에서도 열 수 있어야 해서
        탭별 content-view(display:none으로 숨겨짐) 밖, 전역 레벨에 둔다.
      */}
      <ExpenseModal
        store={expenseStore}
        scheduleItemOptions={scheduleItemOptions}
        initialScheduleItemId={prefillExpenseScheduleItemId}
      />

      {isVoucherModalOpen && (
        <VoucherModal
          onClose={() => {
            setIsVoucherModalOpen(false);
            setPrefillScheduleItemId(null);
          }}
          onSave={(request, file) => {
            if (!file) return;
            return voucherStore.addVoucher(request, file);
          }}
          scheduleItemOptions={scheduleItemOptions}
          initialScheduleItemId={prefillScheduleItemId}
        />
      )}

      {isEditOpen && (
        <WorkspaceTripModal
          init={trip}
          onClose={closeEdit}
          onSave={(data) => {
            const next = { ...trip, ...data };
            void updateTripData(next);
            closeEdit();
            checkScheduleAfterDateChange(next);
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
        open={dateChangePrompt.open}
        title="여행 기간 변경"
        headline={dateChangePrompt.headline}
        description={dateChangePrompt.description}
        cancelText="직접 정리할게요"
        confirmText="지금 AI 일정 재생성"
        onClose={closeDateChangePrompt}
        onConfirm={regenerateNow}
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

      {timelineToast && (
        <div
          role="alert"
          style={{
            position: "fixed", bottom: "32px", left: "50%",
            transform: "translateX(-50%)",
            background: "#222", color: "#fff",
            padding: "10px 22px", borderRadius: "20px",
            fontSize: "13px", fontWeight: "bold",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          {timelineToast}
        </div>
      )}
    </div>
  );
};

export default WorkspaceCenter;
