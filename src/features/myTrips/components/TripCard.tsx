// src/features/myTrips/components/TripCard.tsx

import { useNavigate } from "react-router-dom";
import type { MyTripSummaryResponse } from "../../../types";
import type { TripStatusInfo } from "./../hooks/useMyTrips";

interface TripCardProps {
  trip: MyTripSummaryResponse;
  status: TripStatusInfo;
  onDelete: (trip: MyTripSummaryResponse) => void;
  isInvited: boolean;
  onWriteReview?: () => void;
}

const MAX_VISIBLE_MEMBERS = 6;

export const TripCard = ({
  trip,
  status,
  onDelete,
  isInvited,
  onWriteReview,
}: TripCardProps) => {
  const navigate = useNavigate();
  const members = trip.members ?? [];

  const visibleMembers = members.slice(0, MAX_VISIBLE_MEMBERS);
  const extraMemberCount = Math.max(members.length - MAX_VISIBLE_MEMBERS, 0);

  const visibilityText = trip.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";
  const visibilityClass = trip.visibility === "PRIVATE" ? "private" : "public";

  const startDate = trip.tripStartDate ?? "";
  const endDate = trip.tripEndDate ?? "";

    // 후기 작성 가능 여부 (종료 후 30일 이내) ← 여기
  const canWriteReview = (() => {
    if (!status.isEnd) return false;
    const end = new Date(endDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 60;
  })();

  return (
    <div
      className="mate-ticket trip-card"
      style={{
        opacity: status.isEnd ? 0.6 : 1,
        cursor: "pointer",
        position: "relative",
        zIndex: 1,
      }}
      onClick={() => navigate(`/workspace/${trip.tripId}`)}
    >
      <div
        className="mt-side"
        style={{
          background: status.isEnd ? "#eee" : "#000",
          color: status.isEnd ? "#999" : "#fff",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: "bold" }}>STATUS</span>
        <span style={{ fontSize: "24px", fontWeight: "900" }}>
          {status.leftLabel}
        </span>
      </div>

      <div className="mt-center" style={{ flex: 1, padding: "20px" }}>
        <div className="top-badges" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "5px" }}>
            <span
              className="sys-tag"
              style={{
                background: status.isEnd ? "#fff" : "#000",
                color: status.isEnd ? "#555" : "#fff",
                border: status.isEnd ? "1px solid #999" : "none",
              }}
            >
              {status.rightLabel}
            </span>
            <span className={`sys-tag ${visibilityClass}`}>
              <i
                className={`fa-solid ${
                  trip.visibility === "PRIVATE" ? "fa-lock" : "fa-lock-open"
                }`}
              ></i>{" "}
              {visibilityText}
            </span>
          </div>

          {!isInvited && (
            <button
              className="delete-trip-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(trip);
              }}
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          )}
        </div>

        <h3 className="mt-tit">{trip.title}</h3>
        <p className="mt-txt">
          {startDate} - {endDate}
        </p>

        <div className="participants">
          <span className="p-label">AGENTS:</span>
          <div className="p-avatars">
            {visibleMembers.map((member) => (
              <div
                key={member.memberId}
                className="p-circle"
                style={
                  member.sortOrder === 1
                    ? { border: "2px solid #000" }
                    : undefined
                }
                title={member.nickname}
              >
                {member.profileType === "CUSTOM" && member.profileImage ? (
                  <img
                    src={member.profileImage}
                    alt={member.nickname}
                    className="p-avatar-img"
                  />
                ) : member.profileType === "AVATAR" &&
                  member.avatarEmoji &&
                  member.avatarColor ? (
                  <span
                    className="p-avatar-emoji"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.avatarEmoji}
                  </span>
                ) : (
                  <span className="p-avatar-text">
                    {(member.nickname ?? "").substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            ))}

            {extraMemberCount > 0 && (
              <div className="p-circle">+{extraMemberCount}</div>
            )}
          </div>
        </div>

        {/* 후기 작성 버튼 - 오른쪽 아래 */}
        {canWriteReview && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onWriteReview) onWriteReview();
              }}
              style={{
                padding: "6px 12px",
                background: "#000",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontFamily: "Share Tech Mono, monospace",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              REVIEW
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
