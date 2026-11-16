// src/features/myTrips/components/TripCard.tsx
//
// 여행 카드 — 시안(design-proposal-merged 의 내 여행) 모양: 색 머리(상태 · 기간 · 제목) + 아래 칸(날짜 · 멤버 · 버튼).
// 눌러서 작업 화면으로 가는 동작, 후기 작성, 삭제는 예전과 같다. 이모지는 쓰지 않는다(아바타는 닉네임 첫 글자).

import { useNavigate } from "react-router-dom";
import type { MyTripSummaryResponse } from "../../../types";
import type { TripStatusInfo } from "./../hooks/useMyTrips";

interface TripCardProps {
  trip: MyTripSummaryResponse;
  status: TripStatusInfo;
  /** 머리 색 순서(노랑 · 하늘 · 민트 순서로 돌아간다) */
  index: number;
  onDelete: (trip: MyTripSummaryResponse) => void;
  isInvited: boolean;
  onWriteReview?: () => void;
}

const MAX_VISIBLE_MEMBERS = 6;
const HEAD_TONES = ["yellow", "blue", "mint"] as const;

/** "3박 4일" — 당일이면 "당일치기" */
function nightsLabel(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  const nights = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  if (nights <= 0) return "당일치기";
  return `${nights}박 ${nights + 1}일`;
}

/** "2025.10.12 – 10.15" (같은 해면 끝 날짜는 월.일만) */
function rangeLabel(start: string, end: string) {
  const dot = (v: string) => v.replace(/-/g, ".");
  if (!start && !end) return "";
  if (start.slice(0, 4) === end.slice(0, 4)) return `${dot(start)} – ${dot(end).slice(5)}`;
  return `${dot(start)} – ${dot(end)}`;
}

export const TripCard = ({
  trip,
  status,
  index,
  onDelete,
  isInvited,
  onWriteReview,
}: TripCardProps) => {
  const navigate = useNavigate();
  const members = trip.members ?? [];

  const visibleMembers = members.slice(0, MAX_VISIBLE_MEMBERS);
  const extraMemberCount = Math.max(members.length - MAX_VISIBLE_MEMBERS, 0);

  // visibility 는 "공개 여부"가 아니라 사실상 "함께하는 멤버가 있는지"를 나타낸다
  // (멤버가 둘 이상이면 PUBLIC, 혼자면 PRIVATE — 서버가 멤버 수에 따라 자동으로 바꾸고, 다른 사람에게 공개되지는 않는다).
  // 그래서 화면에는 PUBLIC/PRIVATE 대신 뜻에 맞는 이름을 보여준다.
  const isShared = trip.visibility !== "PRIVATE";
  const visibilityText = isShared ? "함께하는 여행" : "나만의 여행";

  const startDate = trip.tripStartDate ?? "";
  const endDate = trip.tripEndDate ?? "";

  // 후기 작성 가능 여부 (종료 후 60일 이내)
  const canWriteReview = (() => {
    if (!status.isEnd) return false;
    const end = new Date(endDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 60;
  })();

  const statusText =
    status.rightLabel === "출발 전" ? `출발 전 · ${status.leftLabel}` : status.rightLabel;
  const statusTone = status.isEnd ? " tm-tag--dark" : status.rightLabel === "여행 중" ? " tm-tag--ok" : " tm-tag--red";

  return (
    <article className="mt-card" onClick={() => navigate(`/workspace/${trip.tripId}`)}>
      <div className={`mt-card__head mt-card__head--${HEAD_TONES[index % HEAD_TONES.length]}`}>
        <div className="mt-card__tags">
          <span className={`tm-tag${statusTone}`}>{statusText}</span>
          <span className="tm-tag">{visibilityText}</span>
          <span className="mt-card__sp" />
          <span className="tm-tag">{nightsLabel(startDate, endDate)}</span>
        </div>
        <h3 className="mt-card__title">{trip.title}</h3>
      </div>

      <div className="mt-card__body">
        <div className="mt-card__date">{rangeLabel(startDate, endDate)}</div>

        <div className="mt-card__row">
          <span className="mt-card__label">멤버</span>
          <div className="mt-card__members">
            {visibleMembers.map((member, i) => (
              <span
                key={member.memberId}
                className={`tm-avatar${member.sortOrder === 1 ? " tm-avatar--dark" : i === 1 ? " tm-avatar--red" : ""}`}
                title={member.nickname}
              >
                {member.profileType === "CUSTOM" && member.profileImage ? (
                  <img src={member.profileImage} alt={member.nickname} />
                ) : (
                  (member.nickname ?? "").substring(0, 1)
                )}
              </span>
            ))}
            {extraMemberCount > 0 && <span className="tm-avatar">+{extraMemberCount}</span>}
          </div>

          <span className="mt-card__sp" />

          {canWriteReview && (
            <button
              type="button"
              className="tm-btn tm-btn--sm"
              onClick={(e) => {
                e.stopPropagation();
                if (onWriteReview) onWriteReview();
              }}
            >
              후기 작성
            </button>
          )}
          {!isInvited && (
            <button
              type="button"
              className="tm-btn tm-btn--sm tm-btn--danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(trip);
              }}
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
