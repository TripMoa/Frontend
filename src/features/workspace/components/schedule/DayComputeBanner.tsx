// src/features/workspace/components/schedule/DayComputeBanner.tsx
//
// 일차 화면 위쪽의 "시각 자동 계산" 안내 — 켜진 날은 설정(시작·종료·이동수단)과 종료 시간 초과 경고,
// 꺼진 날은 켜기 버튼(켜기 전에 시각이 바뀔 수 있다고 한 번 확인)을 보여준다.

import React, { useState } from "react";
import type { DayInfo, TimelineNode } from "../../hooks/useTimeline";
import { ClockInput } from "./PlanControls";

const TRANSPORT_MODES = ["택시", "대중교통", "도보"];

interface Props {
  dayTitle: string;
  dayInfo?: DayInfo;
  nodes: TimelineNode[];
  otherDays: string[];
  isEditing: boolean;
  onToggleAuto: (enabled: boolean) => Promise<boolean>;
  onSettings: (patch: { startTime?: string; endTime?: string; transportMode?: string }) => Promise<boolean>;
  onMoveNode: (idx: number, targetDay: string) => void;
}

const DayComputeBanner: React.FC<Props> = ({
  dayTitle, dayInfo, nodes, otherDays, isEditing, onToggleAuto, onSettings, onMoveNode,
}) => {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<boolean>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  // ── 자동 계산이 꺼진 날 ──
  if (!dayInfo?.autoCompute) {
    const hasNodes = nodes.length > 0;
    return (
      <div className="tm-notice ws-auto ws-auto--off tm-mb-3">
        <div className="tm-row tm-row--wrap">
          <span className="tm-grow">
            {hasNodes
              ? "이 날의 시각은 직접 정해진 값이에요. 자동 계산을 켜면 순서와 머무는 시간에 맞춰 시각을 계산해 드려요."
              : "자동 계산을 켜 두면 장소를 넣는 대로 시각이 채워져요."}
          </span>
          {!confirming && (
            <button
              type="button"
              className="tm-btn tm-btn--sm"
              disabled={busy}
              onClick={() => (hasNodes ? setConfirming(true) : void run(() => onToggleAuto(true)))}
            >
              자동 계산 켜기
            </button>
          )}
        </div>
        {confirming && (
          <div className="tm-notice tm-notice--warn ws-auto__confirm">
            켜면 머무는 시간을 지금 시각 간격에서 추정해 채우고, {dayTitle}의 시각을 다시 계산해요.
            <b> 지금 적혀 있는 시각이 바뀔 수 있어요.</b>
            <div className="tm-row tm-mt-2">
              <button type="button" className="tm-btn tm-btn--sm tm-btn--primary" disabled={busy} onClick={() => void run(() => onToggleAuto(true))}>
                {busy ? "계산 중…" : "켜기"}
              </button>
              <button type="button" className="tm-btn tm-btn--sm" disabled={busy} onClick={() => setConfirming(false)}>취소</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── 자동 계산이 켜진 날 ──
  const over = dayInfo.warnings.find((w) => w.code === "over_end");
  const moveIdx = over?.suggestMoveItemId != null ? nodes.findIndex((n) => n.id === over.suggestMoveItemId) : -1;
  const moveNode = moveIdx >= 0 ? nodes[moveIdx] : undefined;

  return (
    <div className="tm-mb-3">
      <div className="tm-notice tm-notice--auto ws-auto">
        <div className="tm-row tm-row--wrap ws-auto__row">
          <b>시각 자동 계산</b>

          <label>
            시작
            {isEditing
              ? <ClockInput value={dayInfo.startTime} onCommit={(v) => onSettings({ startTime: v })} label="하루 시작 시각" width="136px" />
              : <b>{dayInfo.startTime ?? "-"}</b>}
          </label>
          <label>
            종료
            {isEditing
              ? <ClockInput value={dayInfo.endTime} onCommit={(v) => onSettings({ endTime: v })} label="하루 종료 시각" width="136px" />
              : <b>{dayInfo.endTime ?? "-"}</b>}
          </label>
          <label>
            이동수단
            {isEditing ? (
              <select
                className="tm-select"
                value={dayInfo.transportMode ?? ""}
                onChange={(e) => void onSettings({ transportMode: e.target.value })}
              >
                {!dayInfo.transportMode && <option value="">-</option>}
                {TRANSPORT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <b>{dayInfo.transportMode ?? "-"}</b>
            )}
          </label>

          {isEditing && (
            <button
              type="button"
              className="tm-btn tm-btn--sm ws-auto__off"
              disabled={busy}
              onClick={() => {
                if (window.confirm("자동 계산을 끌까요? 지금 시각은 그대로 남고, 이후 순서를 바꿔도 시각이 자동으로 바뀌지 않아요.")) {
                  void run(() => onToggleAuto(false));
                }
              }}
            >
              자동 계산 끄기
            </button>
          )}
        </div>
        <div className="ws-auto__note">
          순서를 바꾸거나 머무는 시간을 조절하면 뒤 일정의 시각이 자동으로 따라와요. 이동 시간은 직선거리 기준 추정이에요.
        </div>
      </div>

      {over && (
        <div className="tm-notice tm-notice--warn tm-mt-2">
          <div className="tm-row tm-row--wrap">
            <span className="tm-grow">{over.message}</span>
            {moveNode && otherDays.length > 0 && (
              <span className="tm-row tm-gap-2">
                ‘{moveNode.title}’을(를)
                <select
                  className="tm-select ws-auto__move"
                  aria-label="다른 날로 옮기기"
                  value=""
                  onChange={(e) => { if (e.target.value) onMoveNode(moveIdx, e.target.value); }}
                >
                  <option value="">다른 날로 옮기기 ▸</option>
                  {otherDays.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DayComputeBanner;
