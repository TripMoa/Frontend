// src/features/workspace/components/schedule/PlanControls.tsx
//
// 계산되는 일정의 노드 조작 — 머무는 시간(± 버튼)과 고정 시각(📌).
// 화면은 값을 서버에 보내기만 하고, 그 결과로 바뀌는 시각은 서버(엔진)가 계산해 돌려준다.

import React, { useEffect, useRef, useState } from "react";

const STAY_STEP = 10;
const STAY_MIN = 10;
const STAY_MAX = 720;
const COMMIT_DELAY_MS = 500; // 버튼을 연달아 누르면 마지막 값만 서버에 보낸다(요청 1건 = 그날 전체 재계산)

/** HH:MM 시각 입력 — 입력을 마치면(포커스를 벗어나거나 Enter) 한 번만 저장한다. 저장에 실패하면 이전 값으로 되돌린다. */
export const ClockInput: React.FC<{
  value?: string | null;
  onCommit: (value: string) => Promise<boolean>;
  width?: string;
  title?: string;
}> = ({ value, onCommit, width = "84px", title }) => {
  // 입력 중인 값 — 저장이 끝나거나 취소되면 비우고, 그다음부터는 서버가 준 값을 그대로 보여준다
  const [draft, setDraft] = useState<string | null>(null);

  const commit = async () => {
    const pending = draft;
    if (pending && pending !== value) await onCommit(pending);
    setDraft(null);
  };

  return (
    <input
      type="time"
      value={draft ?? value ?? ""}
      title={title}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      onClick={(e) => e.stopPropagation()}
      style={{
        width, padding: "3px 6px", border: "1.5px solid #ddd", borderRadius: "4px",
        fontSize: "12px", fontFamily: "var(--font-mono)", boxSizing: "border-box",
      }}
    />
  );
};

interface Props {
  stayMinutes?: number;
  startTime: string;
  pinnedTime?: string;
  onStay: (minutes: number) => Promise<boolean>;
  onPin: (time: string | null) => Promise<boolean>;
}

const PlanControls: React.FC<Props> = ({ stayMinutes, startTime, pinnedTime, onStay, onPin }) => {
  // 버튼으로 바꾼 값(저장 대기 중) — 저장이 끝나면 비우고 서버가 준 값을 보여준다
  const [pending, setPending] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const change = (delta: number) => {
    const base = pending ?? stayMinutes ?? 60;
    const next = Math.min(STAY_MAX, Math.max(STAY_MIN, base + delta));
    if (next === base) return;
    setPending(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await onStay(next);
      setPending(null);
    }, COMMIT_DELAY_MS);
  };

  const stepButton = (label: string, delta: number, disabled: boolean) => (
    <button
      onClick={(e) => { e.stopPropagation(); change(delta); }}
      disabled={disabled}
      style={{
        width: "22px", height: "22px", padding: 0, lineHeight: 1, fontSize: "14px", fontWeight: 700,
        border: "1.5px solid #ddd", borderRadius: "4px", background: "#fff",
        color: disabled ? "#ccc" : "#333", cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );

  const shown = pending ?? stayMinutes;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginTop: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }} onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: "11px", color: "#888", whiteSpace: "nowrap" }}>머무는 시간</span>
        {stepButton("−", -STAY_STEP, shown == null || shown <= STAY_MIN)}
        <span style={{ minWidth: "44px", textAlign: "center", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
          {shown != null ? `${shown}분` : "-"}
        </span>
        {stepButton("+", STAY_STEP, shown == null || shown >= STAY_MAX)}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
        {pinnedTime ? (
          <>
            <span style={{ fontSize: "11px", color: "#e65100", fontWeight: 700 }}>📌 이 시각에 시작</span>
            <ClockInput value={pinnedTime} onCommit={(v) => onPin(v)} />
            <button
              onClick={() => void onPin(null)}
              title="고정 해제"
              style={{ padding: "2px 7px", border: "1.5px solid #eee", borderRadius: "4px", background: "#fff", color: "#999", fontSize: "11px", cursor: "pointer" }}
            >
              해제
            </button>
          </>
        ) : (
          <button
            onClick={() => void onPin(startTime)}
            title="지금 시작 시각으로 고정 — 앞 일정이 밀려도 이 시각에 시작하도록 맞춰요"
            style={{ padding: "2px 9px", border: "1.5px dashed #bbb", borderRadius: "4px", background: "#fff", color: "#666", fontSize: "11px", cursor: "pointer" }}
          >
            📌 시각 고정
          </button>
        )}
      </div>
    </div>
  );
};

export default PlanControls;
