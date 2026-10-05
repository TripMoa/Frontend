// src/features/workspace/components/schedule/TimelineBoard.tsx
//
// 하루를 시간축으로 보여주는 "시간표" 보기 — 카드의 세로 길이가 머무는 시간, 카드 사이 간격이 이동·대기 시간이다.
// 편집 모드에서는
//   · 카드를 위아래로 끌면 순서가 바뀌고
//   · 카드 아래쪽 손잡이를 끌면 머무는 시간이 바뀐다(10분 단위).
// 화면은 끌어서 만든 "요청"만 서버에 보내고, 바뀐 시각은 서버(엔진)가 계산해 돌려준 값을 그대로 그린다.

import React, { useMemo, useRef, useState } from "react";
import type { DayInfo, TimelineNode } from "../../hooks/useTimeline";
import { CATEGORY_COLOR, getCategoryIcon } from "../../hooks/schedule.constants";

const PX_PER_MIN = 1.3;       // 1분당 세로 픽셀
const MIN_BLOCK_H = 34;       // 짧은 카드(숙소·출발지 등)도 글자가 보이게
const BLOCK_GAP = 3;
const AXIS_W = 46;
const STAY_STEP = 10;
const STAY_MIN = 10;
const STAY_MAX = 720;
const DRAG_THRESHOLD_PX = 5;  // 이만큼 움직여야 "끌기"로 본다(클릭과 구분)
const FIXED_CATEGORIES = ["숙소", "출발지", "교통"];

const toMin = (hhmm?: string | null): number | null => {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const clock = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

interface Props {
  nodes: TimelineNode[];
  dayInfo?: DayInfo;
  isEditing: boolean;
  onReorder: (from: number, to: number) => void;
  onStay: (idx: number, minutes: number) => Promise<boolean>;
  onPin: (idx: number, time: string | null) => Promise<boolean>;
  onOpen: (node: TimelineNode) => void;
}

type Gesture =
  | { kind: "move"; idx: number; startY: number; dy: number; moved: boolean }
  | { kind: "resize"; idx: number; startY: number; dy: number };

interface Layout {
  top: number;
  height: number;
  startMin: number;
  stay: number;
}

const TimelineBoard: React.FC<Props> = ({ nodes, dayInfo, isEditing, onReorder, onStay, onPin, onOpen }) => {
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const [pendingStay, setPendingStay] = useState<Record<number, number>>({});

  const setG = (g: Gesture | null) => {
    gestureRef.current = g;
    setGesture(g);
  };

  // 축의 범위 — 하루 시작(없으면 첫 카드) ~ 하루 끝과 마지막 카드 끝 중 늦은 쪽
  const { axisStart, axisEnd, dayEnd } = useMemo(() => {
    const first = toMin(nodes[0]?.time);
    const start = toMin(dayInfo?.startTime) ?? first ?? 9 * 60;
    const dayEndMin = toMin(dayInfo?.endTime);
    const lastEnd = nodes.reduce((mx, n) => Math.max(mx, toMin(n.endTime) ?? toMin(n.time) ?? 0), 0);
    const end = Math.max(dayEndMin ?? 0, lastEnd, start + 60);
    return {
      axisStart: Math.floor(Math.min(start, first ?? start) / 60) * 60,
      axisEnd: Math.ceil((end + 20) / 60) * 60,
      dayEnd: dayEndMin,
    };
  }, [nodes, dayInfo]);

  // 카드 위치 — 시각에 비례해 놓되, 앞 카드와 겹치면(짧은 카드의 최소 높이 때문에) 그 아래로 민다
  const layouts = useMemo<Layout[]>(() => {
    const out: Layout[] = [];
    let prevBottom = -Infinity;
    nodes.forEach((n, i) => {
      const startMin = toMin(n.time) ?? axisStart;
      const stay = pendingStay[i] ?? n.stayMinutes ?? 0;
      const top = Math.max((startMin - axisStart) * PX_PER_MIN, prevBottom + BLOCK_GAP);
      const height = Math.max(stay * PX_PER_MIN, MIN_BLOCK_H);
      out.push({ top, height, startMin, stay });
      prevBottom = top + height;
    });
    return out;
  }, [nodes, axisStart, pendingStay]);

  const totalH = Math.max((axisEnd - axisStart) * PX_PER_MIN, (layouts.at(-1)?.top ?? 0) + (layouts.at(-1)?.height ?? 0) + 20);
  const hours: number[] = [];
  for (let m = axisStart; m <= axisEnd; m += 60) hours.push(m);

  // ── 끌기 ──
  const begin = (e: React.PointerEvent, g: Gesture) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
    setG(g);
  };

  const move = (e: React.PointerEvent) => {
    const g = gestureRef.current;
    if (!g) return;
    const dy = e.clientY - g.startY;
    setG(g.kind === "move" ? { ...g, dy, moved: g.moved || Math.abs(dy) > DRAG_THRESHOLD_PX } : { ...g, dy });
  };

  const end = async (e: React.PointerEvent) => {
    const g = gestureRef.current;
    if (!g) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setG(null);

    if (g.kind === "move") {
      if (!g.moved) {
        onOpen(nodes[g.idx]);
        return;
      }
      // 끌던 카드의 중심이 다른 카드들의 중심보다 아래로 몇 개 지나갔는지가 새 위치
      const me = layouts[g.idx];
      const center = me.top + g.dy + me.height / 2;
      const others = layouts.filter((_, i) => i !== g.idx);
      const to = others.filter((l) => l.top + l.height / 2 < center).length;
      if (to !== g.idx) onReorder(g.idx, to);
    } else {
      const base = layouts[g.idx].stay;
      const next = Math.min(STAY_MAX, Math.max(STAY_MIN, Math.round((base + g.dy / PX_PER_MIN) / STAY_STEP) * STAY_STEP));
      if (next === (nodes[g.idx].stayMinutes ?? base)) return;
      setPendingStay((p) => ({ ...p, [g.idx]: next }));
      await onStay(g.idx, next);
      setPendingStay((p) => {
        const { [g.idx]: _drop, ...rest } = p;
        void _drop;
        return rest;
      });
    }
  };

  // 끄는 동안의 미리보기 값
  const dragging = gesture?.kind === "move" && gesture.moved ? gesture : null;
  const resizing = gesture?.kind === "resize" ? gesture : null;

  return (
    <div style={{ position: "relative", height: totalH, marginRight: "6px", userSelect: "none", touchAction: "none" }}>
      {/* 시간 눈금 */}
      {hours.map((m) => (
        <div key={m} style={{ position: "absolute", left: 0, right: 0, top: (m - axisStart) * PX_PER_MIN, borderTop: "1px solid #f0f0f0" }}>
          <span style={{ position: "absolute", left: 0, top: "-7px", width: AXIS_W - 8, textAlign: "right", fontSize: "10px", fontFamily: "var(--font-mono)", color: "#bbb", background: "#fff" }}>
            {clock(m % (24 * 60))}
          </span>
        </div>
      ))}

      {/* 종료 시각 — 이 선 아래는 하루 계획 밖 */}
      {dayEnd != null && (
        <>
          <div style={{ position: "absolute", left: AXIS_W, right: 0, top: (dayEnd - axisStart) * PX_PER_MIN, bottom: 0, background: "repeating-linear-gradient(135deg, #fafafa, #fafafa 6px, #f3f3f3 6px, #f3f3f3 12px)", opacity: 0.8, pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: AXIS_W, right: 0, top: (dayEnd - axisStart) * PX_PER_MIN, borderTop: "2px dashed #e53935", pointerEvents: "none" }}>
            <span style={{ position: "absolute", right: 0, top: "-16px", fontSize: "10px", color: "#e53935", fontWeight: 700 }}>종료 {clock(dayEnd)}</span>
          </div>
        </>
      )}

      {/* 카드 사이 이동·대기 */}
      {nodes.slice(0, -1).map((n, i) => {
        const a = layouts[i];
        const b = layouts[i + 1];
        const gapTop = a.top + a.height;
        const gapH = b.top - gapTop;
        const travel = n.travelMinutes ?? 0;
        if (gapH < 12) return null;
        return (
          <div key={`gap-${i}`} style={{ position: "absolute", left: AXIS_W + 14, top: gapTop, height: gapH, borderLeft: "2px dashed #d5d5d5", paddingLeft: "8px", display: "flex", alignItems: "center", fontSize: "10px", color: "#9e9e9e", pointerEvents: "none" }}>
            {travel > 0 ? `이동 ${travel}분` : "대기"}
          </div>
        );
      })}

      {/* 카드 */}
      {nodes.map((n, i) => {
        const l = layouts[i];
        const cat = n.placeInfo?.category ?? "";
        const color = CATEGORY_COLOR[cat] || "#9e9e9e";
        const fixed = FIXED_CATEGORIES.includes(cat);
        const canDrag = isEditing && !fixed;
        const isMoving = dragging?.idx === i;
        const isResizing = resizing?.idx === i;
        const resizedStay = isResizing ? Math.min(STAY_MAX, Math.max(STAY_MIN, Math.round((l.stay + resizing!.dy / PX_PER_MIN) / STAY_STEP) * STAY_STEP)) : null;
        const height = isResizing ? Math.max(resizedStay! * PX_PER_MIN, MIN_BLOCK_H) : l.height;
        const startMin = l.startMin;
        const endLabel = isResizing ? clock(Math.min(startMin + resizedStay!, 24 * 60 - 1)) : n.endTime;
        const warns = n.warnings ?? [];
        const pinned = !!n.pinnedTime;
        const tight = height < 52;

        return (
          <div
            key={n.id ?? i}
            onPointerDown={(e) => { if (canDrag) begin(e, { kind: "move", idx: i, startY: e.clientY, dy: 0, moved: false }); }}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={() => setG(null)}
            onClick={() => { if (!canDrag) onOpen(n); }}
            style={{
              position: "absolute", left: AXIS_W + 34, right: 0, top: l.top, height,
              transform: isMoving ? `translateY(${dragging!.dy}px)` : undefined,
              zIndex: isMoving ? 20 : 1,
              boxSizing: "border-box", padding: tight ? "4px 10px" : "8px 10px 14px",
              background: isMoving ? "#fffde7" : "#fff",
              borderTop: `1px solid ${warns.length ? "#ffb74d" : "#e6e6e6"}`,
              borderRight: `1px solid ${warns.length ? "#ffb74d" : "#e6e6e6"}`,
              borderBottom: `1px solid ${warns.length ? "#ffb74d" : "#e6e6e6"}`,
              borderLeft: `4px solid ${color}`, borderRadius: "0 6px 6px 0",
              boxShadow: isMoving ? "0 6px 16px rgba(0,0,0,0.2)" : "none",
              cursor: canDrag ? (isMoving ? "grabbing" : "grab") : "pointer",
              overflow: "hidden",
              transition: isMoving || isResizing ? "none" : "top 0.15s, height 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
              <span style={{ fontSize: "14px", flexShrink: 0 }}>{cat ? getCategoryIcon(cat) : ""}</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</span>
              {pinned && <span title={`${n.pinnedTime}에 고정`} style={{ fontSize: "11px", flexShrink: 0 }}>📌</span>}
              {warns.length > 0 && <span title={warns.map((w) => w.message).join("\n")} style={{ fontSize: "11px", flexShrink: 0 }}>⚠️</span>}
              <span style={{ marginLeft: "auto", fontSize: "11px", fontFamily: "var(--font-mono)", color: "#777", flexShrink: 0 }}>
                {n.time}{endLabel && (isResizing || (n.stayMinutes ?? 0) > 0) ? ` ~ ${endLabel}` : ""}
              </span>
            </div>

            {!tight && (
              <div style={{ marginTop: "3px", fontSize: "11px", color: "#999", display: "flex", gap: "8px", alignItems: "center" }}>
                <span>{isResizing ? resizedStay : l.stay}분</span>
                {warns[0] && <span style={{ color: "#e65100", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{warns[0].message}</span>}
              </div>
            )}

            {/* 고정 토글 — 편집 모드 */}
            {canDrag && !tight && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); void onPin(i, pinned ? null : n.time); }}
                title={pinned ? "고정 해제" : "지금 시작 시각으로 고정"}
                style={{ position: "absolute", right: 8, bottom: 16, padding: "1px 7px", fontSize: "10px", border: `1px ${pinned ? "solid #e65100" : "dashed #bbb"}`, borderRadius: "3px", background: "#fff", color: pinned ? "#e65100" : "#888", cursor: "pointer" }}
              >
                {pinned ? "📌 해제" : "📌 고정"}
              </button>
            )}

            {/* 머무는 시간 손잡이 — 편집 모드 */}
            {canDrag && (n.stayMinutes ?? 0) > 0 && (
              <div
                onPointerDown={(e) => begin(e, { kind: "resize", idx: i, startY: e.clientY, dy: 0 })}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={() => setG(null)}
                title="아래로 끌면 오래 머물러요"
                style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "10px", cursor: "ns-resize", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.05))" }}
              >
                <span style={{ width: "26px", height: "3px", borderRadius: "2px", background: "#bbb" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TimelineBoard;
