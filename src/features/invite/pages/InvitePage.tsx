// src/features/invite/pages/InvitePage.tsx
//
// 초대 링크(/invite/:code) 랜딩 페이지.
// 로그인 전: 로그인 안내 (코드는 sessionStorage에 보관 → 로그인 후 이 주소로 복귀)
// 로그인 후: 여행 미리보기 → [참여하기] → 워크스페이스. 이미 멤버면 바로 워크스페이스로 보낸다.

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTripInviteInfo, joinTripByInviteCode } from "../../../api/trip.api";
import type { TripInviteResponse } from "../../../types/trip.types";
import { apiMessage } from "../../workspace/hooks/apiError";
import { useAuth } from "../../user/pages/AuthContext";
import {
  clearPendingInvite,
  isValidInviteCode,
  savePendingInvite,
} from "../inviteStorage";
import "../styles/invite.css";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; info: TripInviteResponse }
  | { kind: "error"; message: string };

const INVALID_LINK_MESSAGE = "유효하지 않은 초대 링크예요. 링크를 보낸 친구에게 다시 확인해 주세요.";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, authReady } = useAuth();

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const validCode = isValidInviteCode(code) ? code : null;

  // 로그인 전이면 코드를 보관해 둔다 (헤더의 로그인 버튼으로 가도 이어지도록 진입 즉시 저장)
  useEffect(() => {
    if (authReady && !isAuthenticated && validCode) savePendingInvite(validCode);
  }, [authReady, isAuthenticated, validCode]);

  // 로그인 후: 미리보기 조회
  useEffect(() => {
    if (!authReady || !isAuthenticated || !validCode) return;

    clearPendingInvite();
    let cancelled = false;

    getTripInviteInfo(validCode)
      .then(({ data }) => {
        if (cancelled) return;
        // 이미 멤버면 에러 없이 바로 이동 (서버가 alreadyMember 와 tripId 를 함께 준다)
        if (data.alreadyMember && data.tripId != null) {
          navigate(`/workspace/${data.tripId}`, { replace: true });
          return;
        }
        setState({ kind: "ready", info: data });
      })
      .catch((e) => {
        if (cancelled) return;
        setState({ kind: "error", message: apiMessage(e, INVALID_LINK_MESSAGE) });
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, isAuthenticated, validCode, navigate]);

  const handleJoin = useCallback(async () => {
    if (!validCode || joining) return;
    setJoining(true);
    setJoinError("");
    try {
      const { data } = await joinTripByInviteCode(validCode);
      navigate(`/workspace/${data.tripId}`, { replace: true });
    } catch (e) {
      setJoinError(apiMessage(e, "참여하지 못했어요. 잠시 후 다시 시도해 주세요."));
      setJoining(false);
    }
  }, [validCode, joining, navigate]);

  if (!authReady) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <p className="invite-desc">확인 중이에요...</p>
        </div>
      </div>
    );
  }

  // 로그인 전
  if (!isAuthenticated) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-label">Trip Invitation</div>
          <h1 className="invite-title">여행에 초대받았어요</h1>
          {validCode ? (
            <>
              <p className="invite-desc">로그인하면 이 여행에 바로 참여할 수 있어요.</p>
              <div className="invite-actions">
                <button
                  type="button"
                  className="invite-btn primary"
                  onClick={() => {
                    savePendingInvite(validCode);
                    navigate("/login");
                  }}
                >
                  로그인하고 참여하기
                </button>
              </div>
            </>
          ) : (
            <p className="invite-error">{INVALID_LINK_MESSAGE}</p>
          )}
        </div>
      </div>
    );
  }

  // 로그인 후인데 코드 형식이 잘못된 경우는 조회 없이 바로 안내
  if (!validCode || state.kind === "error") {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-label">Trip Invitation</div>
          <h1 className="invite-title">참여할 수 없어요</h1>
          <p className="invite-error">
            {state.kind === "error" ? state.message : INVALID_LINK_MESSAGE}
          </p>
          <div className="invite-actions">
            <button type="button" className="invite-btn" onClick={() => navigate("/mytrips")}>
              내 여행으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.kind === "loading") {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <p className="invite-desc">초대 정보를 불러오는 중이에요...</p>
        </div>
      </div>
    );
  }

  const { info } = state;
  return (
    <div className="invite-page">
      <div className="invite-card">
        <div className="invite-label">Trip Invitation</div>
        <h1 className="invite-title">{info.title}</h1>
        <p className="invite-meta">
          {info.tripStartDate} ~ {info.tripEndDate}
        </p>
        <p className="invite-meta">
          {info.ownerNickname}님이 초대했어요 · 멤버 {info.memberCount}명
        </p>
        <ul className="invite-members">
          {info.members.map((m) => (
            <li key={m.nickname}>{m.nickname}</li>
          ))}
        </ul>
        {joinError && <p className="invite-error">{joinError}</p>}
        <div className="invite-actions">
          <button type="button" className="invite-btn" onClick={() => navigate("/mytrips")}>
            나중에
          </button>
          <button
            type="button"
            className="invite-btn primary"
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? "참여 중..." : "참여하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
