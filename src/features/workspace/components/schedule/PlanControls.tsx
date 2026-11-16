// src/features/workspace/components/schedule/PlanControls.tsx
//
// 계산되는 일정의 "언제" 블록 — 시작 · 끝 · 머무는 시간(− / + 버튼)과 "시작 시각 고정".
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
  label?: string;
}> = ({ value, onCommit, width = "104px", title, label = "시각" }) => {
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
      className="tm-input ws-clock"
      value={draft ?? value ?? ""}
      title={title}
      aria-label={label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      onClick={(e) => e.stopPropagation()}
      style={{ width }}
    />
  );
};

interface Props {
  stayMinutes?: number;
  startTime: string;
  endTime?: string;
  pinnedTime?: string;
  /** true면 값만 보여주고 바꾸지 못한다 (일정 수정 중이 아니거나 고정 노드) */
  readOnly?: boolean;
  onStay: (minutes: number) => Promise<boolean>;
  onPin: (time: string | null) => Promise<boolean>;
}

const PlanControls: React.FC<Props> = ({ stayMinutes, startTime, endTime, pinnedTime, readOnly = false, onStay, onPin }) => {
  // 버튼으로 바꾼 값(저장 대기 중) — 저장이 끝나면 비우고 서버가 준 값을 보여준다
  const [pending, setPending] = useState<number | null>(null);
  const [tipOpen, setTipOpen] = useState(false);
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

  const shown = pending ?? stayMinutes;
  const hasEnd = !!endTime && (stayMinutes ?? 0) > 0;

  return (
    <>
      <div className="ws-when">
        <div className="ws-when__cell">
          <span className="ws-when__l">시작</span>
          <b className="ws-when__v">{startTime}</b>
        </div>
        <div className="ws-when__cell">
          <span className="ws-when__l">끝</span>
          <b className="ws-when__v">{hasEnd ? endTime : "-"}</b>
        </div>
        <div className="ws-when__cell">
          <span className="ws-when__l">머무는 시간</span>
          {readOnly ? (
            <b className="ws-when__v">{shown != null ? `${shown}분` : "-"}</b>
          ) : (
            <div className="ws-step" role="group" aria-label="머무는 시간">
              <button
                type="button"
                aria-label="10분 줄이기"
                disabled={shown == null || shown <= STAY_MIN}
                onClick={() => change(-STAY_STEP)}
              >
                −
              </button>
              <b aria-live="polite">{shown != null ? `${shown}분` : "-"}</b>
              <button
                type="button"
                aria-label="10분 늘리기"
                disabled={shown == null || shown >= STAY_MAX}
                onClick={() => change(STAY_STEP)}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {readOnly ? (
        pinnedTime && <p className="tm-hint tm-mt-3">{pinnedTime}에 시작하도록 고정돼 있어요</p>
      ) : (
        <div className="tm-row tm-mt-3 ws-pinrow">
          <label className="tm-check">
            <input
              type="checkbox"
              checked={!!pinnedTime}
              onChange={(e) => void onPin(e.target.checked ? startTime : null)}
            />
            <span>시작 시각 고정</span>
          </label>
          <button
            type="button"
            className="ws-info"
            aria-label="시작 시각 고정 설명"
            aria-expanded={tipOpen}
            onClick={() => setTipOpen((v) => !v)}
          >
            i
          </button>
          {pinnedTime && <ClockInput value={pinnedTime} onCommit={(v) => onPin(v)} label="고정할 시작 시각" />}
          {tipOpen && (
            <>
              <div className="ws-tip" role="note">
                앞 일정이 밀려도 이 시각에 시작해요. 끄면 앞 일정에 맞춰 시각이 자동으로 바뀌어요.
              </div>
              <div className="tm-backdrop" onClick={() => setTipOpen(false)} />
            </>
          )}
        </div>
      )}
    </>
  );
};

export default PlanControls;
