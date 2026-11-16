// src/features/myTrips/pages/MyTrips.tsx

import { useState } from "react";
import "../styles/MyTrips.css";
import { useNavigate } from "react-router-dom";
import { useMyTrips } from "./../hooks/useMyTrips";
import { TripCard } from "./../components/TripCard";
import { TripCreateModal } from "./../components/TripCreateModal";
import type { TripFilter } from "./../hooks/useMyTrips";
import { joinTripByInviteCode } from "../../../api/trip.api";
import MtConfirm from "../components/MtConfirm";
import { checkReviewExists } from "../../../api/stories.api";
import type { MyTripSummaryResponse } from "../../../types";

// 필터 이름 — 서버의 PUBLIC/PRIVATE 는 "공개 여부"가 아니라 "함께하는 멤버가 있는지"라서 뜻에 맞게 보여준다
const FILTER_LABEL: Record<TripFilter, string> = {
  all: "전체",
  public: "함께하는 여행",
  private: "나만의 여행",
  invited: "초대된 여행",
};

export default function MyTrips() {
  const {
    filter,
    setFilter,
    isModalOpen,
    setIsModalOpen,
    trips,
    isLoading,
    error,
    currentUser,
    formData,
    setFormData,
    resetForm,
    removeTrip,
    getTripStatus,
    handleSubmit,
    isSubmitting,
  } = useMyTrips();

  const navigate = useNavigate();

  const [inviteCode, setInviteCode] = useState("");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const [deleteTargetTrip, setDeleteTargetTrip] =
    useState<MyTripSummaryResponse | null>(null);

  // 생성 실패 · 후기 안내처럼 확인 버튼 하나만 있는 안내창
  const [createErrorModal, setCreateErrorModal] = useState({
    open: false,
    title: "여행 만들기",
    headline: "여행을 만들 수 없습니다",
    message: "",
  });

  const [deleteErrorModal, setDeleteErrorModal] = useState({
    open: false,
    message: "",
  });

  const openJoinModal = () => {
    setInviteCode("");
    setJoinError("");
    setIsJoinModalOpen(true);
  };

  const closeJoinModal = () => {
    setInviteCode("");
    setJoinError("");
    setIsJoinModalOpen(false);
  };

  const extractInviteCode = (value: string) => {
    const text = value.trim();

    if (!text) return "";

    try {
      const url = new URL(text);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? "";
    } catch {
      return text;
    }
  };

  const handleJoinByInviteCode = async () => {
    const code = extractInviteCode(inviteCode);

    if (!code) {
      setJoinError("초대링크 또는 초대코드를 입력해주세요.");
      return;
    }

    try {
      setIsJoining(true);
      setJoinError("");

      const res = await joinTripByInviteCode(code);

      closeJoinModal();
      navigate(`/workspace/${res.data.tripId}`);
    } catch {
      setJoinError("유효하지 않은 초대코드이거나 이미 참여 중인 여행입니다.");
    } finally {
      setIsJoining(false);
    }
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    try {
      await handleSubmit(e);
    } catch (error: any) {
      setCreateErrorModal({
        open: true,
        title: "여행 만들기",
        headline: "여행을 만들 수 없습니다",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "여행 생성에 실패했습니다.",
      });
    }
  };

  const requestDeleteTrip = (trip: MyTripSummaryResponse) => {
    const ownerMember = trip.members?.find((member) => member.sortOrder === 1);
    const isTripOwner = ownerMember?.userId === currentUser?.id;

    if (!isTripOwner) {
      setDeleteErrorModal({
        open: true,
        message: "여행 삭제는 소유주만 할 수 있습니다.",
      });
      return;
    }

    setDeleteTargetTrip(trip);
  };

  const handleConfirmDeleteTrip = async () => {
    if (!deleteTargetTrip) return;

    try {
      await removeTrip(deleteTargetTrip.tripId);
      setDeleteTargetTrip(null);
    } catch (error: any) {
      console.error("여행 삭제 실패:", error);

      setDeleteTargetTrip(null);
      setDeleteErrorModal({
        open: true,
        message:
          error?.response?.data?.message ||
          "지출 내역 또는 입금 내역이 존재하여 여행을 삭제할 수 없습니다.",
      });
    }
  };

  return (
    <section className="page-section tm-grid-bg mt-page">
      <TripCreateModal
        isOpen={isModalOpen}
        onClose={closeModal}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
        currentUser={currentUser}
      />

      <div className="tm-page" id="trip-list-ui">
        <div className="tm-page-head">
          <div className="tm-page-head__text">
            <h1 className="tm-page-head__title">내 여행</h1>
          </div>
          <div className="tm-page-head__actions">
            <button type="button" className="tm-btn" onClick={openJoinModal}>
              초대코드로 참여
            </button>
            <button type="button" className="tm-btn tm-btn--primary" onClick={openModal}>
              + 새 여행
            </button>
          </div>
        </div>

        <div className="tm-row tm-row--wrap tm-gap-2 mt-filters">
          {(["all", "public", "private", "invited"] as TripFilter[]).map((type) => (
            <button
              key={type}
              type="button"
              className={`tm-pill${filter === type ? " is-on" : ""}`}
              aria-pressed={filter === type}
              onClick={() => setFilter(type)}
            >
              {FILTER_LABEL[type]}
            </button>
          ))}
        </div>

        {isLoading && <div className="tm-loading">여행 목록을 불러오는 중입니다.</div>}
        {!isLoading && error && <div className="tm-empty">{error}</div>}
        {!isLoading && !error && trips.length === 0 && (
          <div className="tm-empty">표시할 여행이 없습니다.</div>
        )}

        {!isLoading && !error && trips.length > 0 && (
          <div className="mt-grid">
            {trips.map((trip, i) => (
              <TripCard
                key={trip.tripId}
                trip={trip}
                index={i}
                status={getTripStatus(trip.tripStartDate, trip.tripEndDate)}
                onDelete={requestDeleteTrip}
                isInvited={filter === "invited"}
                onWriteReview={async () => {
                  // 이미 작성된 리뷰 있는지 확인
                  const res = await checkReviewExists(trip.tripId);
                  if (res.data === true) {
                    setCreateErrorModal({
                      open: true,
                      title: "후기 작성",
                      headline: "이미 후기를 작성했어요",
                      message: "해당 여행의 후기는 이미 작성되어 있습니다.",
                    });
                    return;
                  }

                  localStorage.setItem("reviewFrom", "mytrips");

                  const start = new Date(trip.tripStartDate);
                  const end = new Date(trip.tripEndDate);
                  const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                  const duration = diffDays === 0 ? "당일치기"
                    : diffDays === 1 ? "1박 2일"
                    : diffDays === 2 ? "2박 3일"
                    : diffDays === 3 ? "3박 4일"
                    : diffDays === 4 ? "4박 5일"
                    : diffDays === 5 ? "5박 6일"
                    : "1주일 이상";

                  navigate("/travelstory", {
                    state: {
                      goToWrite: true,
                      writeType: "REVIEW",
                      tripData: {
                        departureDate: trip.tripStartDate,
                        duration,
                        tripId: trip.tripId,
                      },
                    },
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      <MtConfirm
        open={isJoinModalOpen}
        title="초대코드로 여행 참여"
        description="공유받은 초대링크 또는 초대코드를 입력해 여행에 참여할 수 있습니다."
        cancelText="취소"
        confirmText={isJoining ? "참여 중..." : "참여하기"}
        disabled={isJoining}
        onClose={closeJoinModal}
        onConfirm={handleJoinByInviteCode}
      >
        <input
          className={`tm-input${joinError ? " tm-input--error" : ""}`}
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleJoinByInviteCode();
          }}
          placeholder="초대링크 또는 초대코드 입력"
          aria-label="초대링크 또는 초대코드"
        />
        {joinError && <p className="tm-field__error" role="alert">{joinError}</p>}
      </MtConfirm>

      <MtConfirm
        open={deleteTargetTrip !== null}
        title="여행 삭제"
        headline="여행을 삭제할까요?"
        description="삭제 가능한 여행만 삭제됩니다. 지출 또는 입금 내역이 있으면 삭제할 수 없습니다."
        cancelText="취소"
        confirmText="삭제"
        danger
        onClose={() => setDeleteTargetTrip(null)}
        onConfirm={() => void handleConfirmDeleteTrip()}
      />

      <MtConfirm
        open={createErrorModal.open}
        title={createErrorModal.title}
        headline={createErrorModal.headline}
        description={createErrorModal.message}
        hideCancel
        confirmText="확인"
        onClose={() => setCreateErrorModal((p) => ({ ...p, open: false }))}
        onConfirm={() => setCreateErrorModal((p) => ({ ...p, open: false }))}
      />

      <MtConfirm
        open={deleteErrorModal.open}
        title="여행 삭제"
        headline="여행을 삭제할 수 없습니다"
        description={deleteErrorModal.message}
        hideCancel
        confirmText="확인"
        onClose={() => setDeleteErrorModal({ open: false, message: "" })}
        onConfirm={() => setDeleteErrorModal({ open: false, message: "" })}
      />
    </section>
  );
}
