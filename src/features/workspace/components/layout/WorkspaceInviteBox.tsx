// src/features/workspace/components/layout/WorkspaceInviteBox.tsx
//
// 친구 초대 내용(링크 · 복사 · 재발급 · 링크 초대 켜고 끄기). "멤버 관리" 창 안의 "친구 초대" 구역에서 쓴다.
// 동작은 예전 초대 모달 그대로이고, 확인창만 작업 화면용(WsConfirm)으로 바꿨다.
import React, { useState } from "react";
import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import { useTripContext } from "../../hooks/useTripContext";
import { regenerateTripInviteCode, updateTripInviteEnabled } from "../../../../api/trip.api";
import { apiMessage } from "../../hooks/apiError";
import WsConfirm from "./WsConfirm";

const WorkspaceInviteBox: React.FC = () => {
  const { isOwner, tripId, tripDetail } = useTripContext();
  const { trip } = useWorkspaceCore();

  // 소유자가 링크를 다시 만들거나 켜고 끈 뒤의 값. 없으면 서버에서 받아온 값을 쓴다.
  const [override, setOverride] = useState<{ code: string; enabled: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const code = override?.code ?? tripDetail?.inviteCode ?? trip?.inviteCode;
  const enabled = override?.enabled ?? tripDetail?.inviteEnabled ?? true;
  const link = code ? `${window.location.origin}/invite/${code}` : "";

  const handleToggle = async () => {
    if (busy || !Number.isFinite(tripId)) return;
    setBusy(true);
    try {
      const { data } = await updateTripInviteEnabled(tripId, !enabled);
      setOverride({ code: data.inviteCode, enabled: data.inviteEnabled });
      setMsg(null);
    } catch (e) {
      setMsg({ text: apiMessage(e, "변경하지 못했어요. 잠시 후 다시 시도해주세요."), ok: false });
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    setConfirmRegenerate(false);
    if (busy || !Number.isFinite(tripId)) return;
    setBusy(true);
    try {
      const { data } = await regenerateTripInviteCode(tripId);
      setOverride({ code: data.inviteCode, enabled: data.inviteEnabled });
      setMsg({ text: "초대 링크를 새로 만들었어요. 이전 링크는 더 이상 쓸 수 없어요.", ok: true });
    } catch (e) {
      setMsg({ text: apiMessage(e, "링크를 만들지 못했어요. 잠시 후 다시 시도해주세요."), ok: false });
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!code) {
      setMsg({ text: "초대코드를 찾을 수 없어요. 여행 정보를 다시 불러온 뒤 시도해주세요.", ok: false });
      return;
    }
    if (!enabled) {
      setMsg({
        text: isOwner
          ? "링크 초대가 꺼져 있어요. 아래에서 다시 켜면 링크를 공유할 수 있어요."
          : "여행 소유자가 링크 초대를 닫아 두었어요.",
        ok: false,
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setMsg({ text: "초대 링크를 복사했어요. 친구에게 공유해 보세요.", ok: true });
    } catch {
      setMsg({ text: "복사하지 못했어요. 브라우저 권한 또는 보안 설정을 확인해주세요.", ok: false });
    }
  };

  return (
    <>
      {enabled && code ? (
        <b className="ws-invite-url">{link}</b>
      ) : (
        <span className="tm-hint">{enabled ? "초대코드를 불러오는 중이에요" : "초대가 꺼져 있어요"}</span>
      )}

      {msg && (
        <p className="ws-invite-msg" role="status" style={{ color: msg.ok ? "var(--tm-ok)" : "var(--tm-red-strong)" }}>
          {msg.text}
        </p>
      )}

      <div className="tm-row tm-gap-2">
        <button type="button" className="tm-btn tm-btn--sm tm-grow" onClick={handleCopy}>
          링크 복사
        </button>
        {isOwner && (
          <button
            type="button"
            className="tm-btn tm-btn--sm tm-grow"
            onClick={() => setConfirmRegenerate(true)}
            disabled={busy}
            title="새 링크를 만들고 이전 링크는 못 쓰게 해요"
          >
            재발급
          </button>
        )}
      </div>

      {isOwner && (
        <label className="tm-check tm-mt-2" title="끄면 링크로 새로 참여할 수 없어요 (이미 참여한 멤버는 그대로예요)">
          <input type="checkbox" checked={enabled} onChange={() => void handleToggle()} disabled={busy} />
          <span>초대 링크 {enabled ? "ON" : "OFF"}</span>
        </label>
      )}

      <WsConfirm
        open={confirmRegenerate}
        title="초대 링크 재발급"
        headline="초대 링크를 새로 만들까요?"
        description="이전에 공유한 링크는 바로 못 쓰게 돼요. 이미 참여한 멤버는 그대로 유지돼요."
        confirmText="새로 만들기"
        onClose={() => setConfirmRegenerate(false)}
        onConfirm={() => void handleRegenerate()}
      />
    </>
  );
};

export default WorkspaceInviteBox;
