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

const boxBase: React.CSSProperties = {
  flexShrink: 0, marginBottom: "12px", padding: "10px 14px", borderRadius: "6px", fontSize: "12px", lineHeight: 1.6,
};

const linkButton: React.CSSProperties = {
  padding: "4px 12px", border: "1.5px solid #000", borderRadius: "4px", background: "#fff",
  fontSize: "12px", fontWeight: 700, cursor: "pointer",
};

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
      <div style={{ ...boxBase, background: "#fafafa", border: "1.5px dashed #ccc", color: "#666" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ flex: 1, minWidth: "220px" }}>
            {hasNodes
              ? "이 날의 시각은 직접 정해진 값이에요. 자동 계산을 켜면 순서와 머무는 시간에 맞춰 시각을 계산해 드려요."
              : "자동 계산을 켜 두면 장소를 넣는 대로 시각이 채워져요."}
          </span>
          {!confirming && (
            <button
              style={linkButton}
              disabled={busy}
              onClick={() => (hasNodes ? setConfirming(true) : void run(() => onToggleAuto(true)))}
            >
              ⏱ 자동 계산 켜기
            </button>
          )}
        </div>
        {confirming && (
          <div style={{ marginTop: "8px", padding: "8px 12px", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "4px", color: "#6d4c00" }}>
            켜면 머무는 시간을 지금 시각 간격에서 추정해 채우고, {dayTitle}의 시각을 다시 계산해요.
            <b> 지금 적혀 있는 시각이 바뀔 수 있어요.</b>
            <div style={{ marginTop: "6px", display: "flex", gap: "8px" }}>
              <button style={{ ...linkButton, background: "#000", color: "#fff" }} disabled={busy} onClick={() => void run(() => onToggleAuto(true))}>
                {busy ? "계산 중…" : "켜기"}
              </button>
              <button style={linkButton} disabled={busy} onClick={() => setConfirming(false)}>취소</button>
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
    <div style={{ flexShrink: 0, marginBottom: "12px" }}>
      <div style={{ ...boxBase, marginBottom: over ? "8px" : 0, background: "#f1f8ff", border: "1px solid #bbdefb", color: "#0d47a1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <b>⏱ 시각 자동 계산</b>

          <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            시작
            {isEditing
              ? <ClockInput value={dayInfo.startTime} onCommit={(v) => onSettings({ startTime: v })} />
              : <b style={{ fontFamily: "var(--font-mono)" }}>{dayInfo.startTime ?? "-"}</b>}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            종료
            {isEditing
              ? <ClockInput value={dayInfo.endTime} onCommit={(v) => onSettings({ endTime: v })} />
              : <b style={{ fontFamily: "var(--font-mono)" }}>{dayInfo.endTime ?? "-"}</b>}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            이동수단
            {isEditing ? (
              <select
                value={dayInfo.transportMode ?? ""}
                onChange={(e) => void onSettings({ transportMode: e.target.value })}
                style={{ padding: "3px 6px", border: "1.5px solid #ddd", borderRadius: "4px", fontSize: "12px", background: "#fff" }}
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
              onClick={() => {
                if (window.confirm("자동 계산을 끌까요? 지금 시각은 그대로 남고, 이후 순서를 바꿔도 시각이 자동으로 바뀌지 않아요.")) {
                  void run(() => onToggleAuto(false));
                }
              }}
              disabled={busy}
              style={{ marginLeft: "auto", padding: "3px 10px", border: "1.5px solid #90caf9", borderRadius: "4px", background: "#fff", color: "#1565c0", fontSize: "11px", cursor: "pointer" }}
            >
              자동 계산 끄기
            </button>
          )}
        </div>
        <div style={{ marginTop: "2px", fontSize: "11px", color: "#5c7fa8" }}>
          순서를 바꾸거나 머무는 시간을 조절하면 뒤 일정의 시각이 자동으로 따라와요. 이동 시간은 직선거리 기준 추정이에요.
        </div>
      </div>

      {over && (
        <div style={{ ...boxBase, marginBottom: 0, background: "#fff3e0", border: "1px solid #ffb74d", color: "#e65100" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ flex: 1, minWidth: "200px" }}>⚠️ {over.message}</span>
            {moveNode && otherDays.length > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                ‘{moveNode.title}’을(를)
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) onMoveNode(moveIdx, e.target.value); }}
                  style={{ padding: "3px 6px", border: "1.5px solid #ffb74d", borderRadius: "4px", fontSize: "12px", background: "#fff", cursor: "pointer" }}
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
