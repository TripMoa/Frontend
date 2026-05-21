// src/features/myTrips/pages/MyTrips.tsx

import { useState } from "react";
import "../styles/MyTrips.css";
import { useNavigate } from "react-router-dom";
import { useMyTrips } from "./../hooks/useMyTrips";
import { TripCard } from "./../components/TripCard";
import { TripCreateModal } from "./../components/TripCreateModal";
import type { TripFilter } from "./../hooks/useMyTrips";
import { joinTripByInviteCode } from "../../../api/trip.api";
import { ActionPromptModal } from "../../../shared/components/ActionPromptModal";
import type { MyTripSummaryResponse } from "../../../types";

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

  const [createErrorModal, setCreateErrorModal] = useState({
    open: false,
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
    <section className="page-section">
      <button className="fab-btn" onClick={openModal}>
        <i className="fa-solid fa-plus"></i>
        <span className="fab-text">NEW PLAN</span>
      </button>

      <TripCreateModal
        isOpen={isModalOpen}
        onClose={closeModal}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
        currentUser={currentUser}
      />

      <div className="container" id="trip-list-ui">
        <div className="section-header-neob">
          <div className="header-content">
            <h2 className="sec-title">MY PLAN BOARD</h2>
            <p className="sec-desc">수립된 여행 작전 목록입니다.</p>
          </div>

          <div className="filter-wrapper-neob">
            <div className="filter-tabs">
              {/* 왼쪽 그룹 */}
              <div className="filter-left">
                {(["all", "public", "private"] as TripFilter[]).map((type) => (
                  <button
                    key={type}
                    className={`filter-btn ${filter === type ? "active" : ""}`}
                    onClick={() => setFilter(type)}
                  >
                    {type === "all" ? "ALL SECTORS" : type.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* 오른쪽 그룹 */}
              <div className="filter-right">
                <button
                  className="filter-btn invite-join-btn"
                  onClick={openJoinModal}
                >
                  초대코드
                </button>

                <button
                  className={`filter-btn ${filter === "invited" ? "active" : ""}`}
                  onClick={() => setFilter("invited")}
                >
                  초대된 여행
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="trip-grid">
          {isLoading && (
            <p className="empty-text">여행 목록을 불러오는 중입니다.</p>
          )}
          {!isLoading && error && <p className="empty-text">{error}</p>}
          {!isLoading && !error && trips.length === 0 && (
            <p className="empty-text">표시할 여행이 없습니다.</p>
          )}
          {!isLoading &&
            !error &&
            trips.map((trip) => (
              <TripCard
                key={trip.tripId}
                trip={trip}
                status={getTripStatus(trip.tripStartDate, trip.tripEndDate)}
                onDelete={requestDeleteTrip}
                isInvited={filter === "invited"}
              />
            ))}
        </div>
      </div>

      <ActionPromptModal
        open={isJoinModalOpen}
        title="INVITE CODE"
        headline="초대코드로 여행 참여"
        description="공유받은 초대코드를 입력해 여행에 참여할 수 있습니다."
        cancelText="취소"
        confirmText={isJoining ? "참여 중..." : "참여하기"}
        onClose={closeJoinModal}
        onConfirm={handleJoinByInviteCode}
      >
        <input
          className="modal-input"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="초대링크 또는 초대코드 입력"
        />

        {joinError && <p className="modal-error-text">{joinError}</p>}
      </ActionPromptModal>

      <ActionPromptModal
        open={deleteTargetTrip !== null}
        title="DELETE TRIP"
        headline="여행을 삭제하시겠습니까?"
        description="삭제 가능한 여행만 삭제됩니다. 지출 또는 입금 내역이 있으면 삭제할 수 없습니다."
        cancelText="취소"
        confirmText="삭제"
        onClose={() => setDeleteTargetTrip(null)}
        onConfirm={() => void handleConfirmDeleteTrip()}
      />

      <ActionPromptModal
        open={createErrorModal.open}
        title="CREATE FAILED"
        headline="여행을 생성할 수 없습니다"
        description={createErrorModal.message}
        hideCancel
        confirmText="확인"
        onClose={() => setCreateErrorModal({ open: false, message: "" })}
        onConfirm={() => setCreateErrorModal({ open: false, message: "" })}
      />

      <ActionPromptModal
        open={deleteErrorModal.open}
        title="DELETE FAILED"
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
