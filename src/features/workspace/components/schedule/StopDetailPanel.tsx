// src/features/workspace/components/schedule/StopDetailPanel.tsx
//
// "정거장 상세" — 일차 목록 자리에 열리는 패널. 장소 소개가 아니라 "이 일정 칸에 대해 알아야 할 것과 할 수 있는 것"을 모은다.
//   언제(시각·머무는 시간·고정·경고) / 가는 길(앞뒤 구간, 실제 경로) / 예약과 비용 / 멤버 공용 메모 / 조작(장소 바꾸기·이동·삭제)
// 지도는 옆에 그대로 보이고, 선택한 장소가 지도 중심에 온다(DayDetailView가 처리).

import React, { useState } from "react";
import type { DayInfo, TimelineNode } from "../../hooks/useTimeline";
import type { VoucherResponse } from "../../../../types/voucher.types";
import type { ExpenseItem } from "../../hooks/expense.ui.types";
import { CATEGORY_COLOR, getCategoryIcon } from "../../hooks/schedule.constants";
import PlanControls from "./PlanControls";

const MAX_MEMO = 1000;

const getVoucherIcon = (type: string) => {
  if (type === "AIR") return "fa-plane";
  if (type === "HTL") return "fa-hotel";
  return "fa-ticket";
};

interface Props {
  node: TimelineNode;
  idx: number;
  total: number;
  dayTitle: string;
  dayInfo?: DayInfo;
  isEditing: boolean;
  prev?: TimelineNode;
  next?: TimelineNode;
  otherDays: string[];
  vouchers: VoucherResponse[];
  expenses: ExpenseItem[];
  /** 앞뒤 구간의 실시간 경로를 조회할 수 있는지 / 조회 (fromIdx → fromIdx+1) */
  canTransit: (fromIdx: number) => boolean;
  onTransit: (fromIdx: number) => void;
  onBack: () => void;
  onNav: (delta: number) => void;
  onStay: (minutes: number) => Promise<boolean>;
  onPin: (time: string | null) => Promise<boolean>;
  onTime: (value: string) => void;
  onMemo: (memo: string) => Promise<boolean>;
  onReplace: () => void;
  onMove: (targetDay: string) => void;
  onDelete: () => void;
  onAddVoucher?: () => void;
  onAddExpense?: () => void;
}

const sectionLabel: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#999", margin: "0 0 8px", letterSpacing: "0.5px",
};

const smallButton: React.CSSProperties = {
  padding: "5px 10px", background: "#fff", color: "#000", border: "1.5px solid #000", borderRadius: "4px",
  fontSize: "12px", fontWeight: 700, cursor: "pointer",
};

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ padding: "14px 0", borderTop: "1px solid #eee" }}>
    <p style={sectionLabel}>{label}</p>
    {children}
  </div>
);

const StopDetailPanel: React.FC<Props> = ({
  node, idx, total, dayTitle, dayInfo, isEditing, prev, next, otherDays, vouchers, expenses,
  canTransit, onTransit, onBack, onNav, onStay, onPin, onTime, onMemo, onReplace, onMove, onDelete,
  onAddVoucher, onAddExpense,
}) => {
  const autoOn = !!dayInfo?.autoCompute;
  const cat = node.placeInfo?.category ?? "";
  const color = CATEGORY_COLOR[cat] || "#9e9e9e";
  const isFixed = cat === "교통" || cat === "숙소";
  const address = node.placeInfo?.address || node.desc || "";
  const warnings = autoOn ? node.warnings ?? [] : [];
  const [copied, setCopied] = useState(false);

  // 메모 — 입력 중인 값(draft)만 들고 있다가 포커스를 벗어나면 저장한다. 저장이 끝나면 서버 값을 그대로 보여준다.
  const [draft, setDraft] = useState<string | null>(null);
  const [memoState, setMemoState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const memoValue = draft ?? node.memo ?? "";

  const saveMemo = async () => {
    if (draft == null || draft === (node.memo ?? "")) {
      setDraft(null);
      return;
    }
    setMemoState("saving");
    const ok = await onMemo(draft);
    setMemoState(ok ? "saved" : "failed");
    if (ok) setDraft(null); // 실패하면 쓰던 글을 남겨서 다시 저장할 수 있게 한다
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 복사 권한이 없으면 조용히 넘어간다 */
    }
  };

  const totalCost = expenses.reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const travelBox = (label: string, minutes: number | undefined, fromIdx: number) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "7px 0", fontSize: "13px" }}>
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
        <span style={{ color: "#999" }}>
          {minutes != null && minutes > 0 ? ` · ${dayInfo?.transportMode ?? ""} 약 ${minutes}분(추정)` : ""}
        </span>
      </span>
      {canTransit(fromIdx) && (
        <button onClick={() => onTransit(fromIdx)} style={{ ...smallButton, flexShrink: 0, padding: "3px 8px", fontSize: "11px" }}>
          실제 경로
        </button>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflowY: "auto", paddingRight: "6px" }}>
      {/* 상단: 목록으로 · 이전/다음 장소 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexShrink: 0 }}>
        <button onClick={onBack} style={{ ...smallButton, borderColor: "#ccc", color: "#444" }}>← {dayTitle} 목록</button>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#888", fontFamily: "var(--font-mono)" }}>
          {idx + 1} / {total}
          <button disabled={idx === 0} onClick={() => onNav(-1)} aria-label="이전 장소" style={{ ...smallButton, padding: "3px 9px", borderColor: "#ccc", color: idx === 0 ? "#ccc" : "#444", cursor: idx === 0 ? "not-allowed" : "pointer" }}>‹</button>
          <button disabled={idx >= total - 1} onClick={() => onNav(1)} aria-label="다음 장소" style={{ ...smallButton, padding: "3px 9px", borderColor: "#ccc", color: idx >= total - 1 ? "#ccc" : "#444", cursor: idx >= total - 1 ? "not-allowed" : "pointer" }}>›</button>
        </span>
      </div>

      {/* 이름·주소 */}
      <div style={{ borderLeft: `4px solid ${color}`, paddingLeft: "12px", marginBottom: "10px" }}>
        <div style={{ fontSize: "12px", color: "#888" }}>
          {cat ? `${getCategoryIcon(cat)} ${cat}` : "장소"}{address ? ` · ${address}` : ""}
        </div>
        <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "2px 0 0", color: "#000", lineHeight: 1.3 }}>{node.title}</h3>
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
        {address && (
          <button onClick={() => void copyAddress()} style={{ ...smallButton, borderColor: "#ccc", color: "#444", fontWeight: 600 }}>
            {copied ? "복사했어요" : "주소 복사"}
          </button>
        )}
        <a
          href={`https://map.naver.com/p/search/${encodeURIComponent(node.title)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ ...smallButton, borderColor: "#ccc", color: "#444", fontWeight: 600, textDecoration: "none" }}
        >
          네이버 지도에서 검색
        </a>
      </div>

      {/* 언제 */}
      <Section label="언제">
        <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-mono)", lineHeight: 1.2 }}>
          {node.time}
          {node.endTime && (node.stayMinutes ?? 0) > 0 && <span style={{ color: "#999" }}> ~ {node.endTime}</span>}
        </div>

        {autoOn ? (
          isEditing && !isFixed ? (
            <PlanControls stayMinutes={node.stayMinutes} startTime={node.time} pinnedTime={node.pinnedTime} onStay={onStay} onPin={onPin} />
          ) : (
            <div style={{ marginTop: "6px", fontSize: "13px", color: "#555", display: "flex", gap: "14px", flexWrap: "wrap" }}>
              {node.stayMinutes != null && <span>머무는 시간 {node.stayMinutes}분</span>}
              {node.pinnedTime && <span style={{ color: "#e65100" }}>📌 {node.pinnedTime}에 고정</span>}
            </div>
          )
        ) : (
          isEditing && !isFixed ? (
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "#888" }}>시작 시각</span>
              <input
                type="text" value={node.time} onChange={(e) => onTime(e.target.value)} placeholder="HH:MM"
                style={{ width: "70px", padding: "4px 8px", border: "1.5px solid #ddd", borderRadius: "4px", fontSize: "13px", fontFamily: "var(--font-mono)" }}
              />
              <span style={{ fontSize: "11px", color: "#aaa" }}>이 날은 시각을 직접 적어요</span>
            </div>
          ) : (
            <div style={{ marginTop: "6px", fontSize: "12px", color: "#aaa" }}>이 날은 시각을 직접 적는 날이에요</div>
          )
        )}

        {warnings.map((w, i) => (
          <div key={i} style={{ marginTop: "8px", padding: "6px 10px", background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: "4px", fontSize: "12px", color: "#e65100" }}>
            ⚠️ {w.message}
          </div>
        ))}
      </Section>

      {/* 가는 길 */}
      {(prev || next) && (
        <Section label="가는 길">
          {prev && travelBox(`‘${prev.title}’에서 오는 길`, prev.travelMinutes, idx - 1)}
          {next && travelBox(`‘${next.title}’(으)로 가는 길`, node.travelMinutes, idx)}
        </Section>
      )}

      {/* 예약과 비용 */}
      {(onAddVoucher || onAddExpense) && (
        <Section label="예약과 비용">
          {onAddVoucher && (
            <div style={{ marginBottom: "10px" }}>
              {vouchers.length === 0 && <p style={{ fontSize: "13px", color: "#999", margin: "0 0 6px" }}>연결된 바우처가 없어요.</p>}
              {vouchers.map((v) => (
                <div key={v.voucherId} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", marginBottom: "5px", background: "#f7f7f7", border: "1px solid #eee", borderRadius: "4px", fontSize: "13px" }}>
                  <i className={`fa-solid ${getVoucherIcon(v.type)}`} />
                  <span style={{ fontWeight: 700 }}>{v.title}</span>
                </div>
              ))}
              <button onClick={onAddVoucher} style={smallButton}>+ 바우처 추가</button>
            </div>
          )}
          {onAddExpense && (
            <div>
              {expenses.length === 0 && <p style={{ fontSize: "13px", color: "#999", margin: "0 0 6px" }}>연결된 지출이 없어요.</p>}
              {expenses.map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: "8px", padding: "7px 10px", marginBottom: "5px", background: "#f7f7f7", border: "1px solid #eee", borderRadius: "4px", fontSize: "13px" }}>
                  <span style={{ fontWeight: 700 }}>{e.title || e.storeName}</span>
                  <span>{e.cost.toLocaleString()}원</span>
                </div>
              ))}
              {expenses.length > 1 && (
                <p style={{ fontSize: "12px", color: "#666", margin: "0 0 6px", textAlign: "right" }}>합계 {totalCost.toLocaleString()}원</p>
              )}
              <button onClick={onAddExpense} style={smallButton}>+ 지출 추가</button>
            </div>
          )}
        </Section>
      )}

      {/* 메모 */}
      <Section label="메모 · 멤버 모두에게 보여요">
        <textarea
          value={memoValue}
          onChange={(e) => { setDraft(e.target.value.slice(0, MAX_MEMO)); setMemoState("idle"); }}
          onBlur={() => void saveMemo()}
          placeholder="예약번호, 먹을 메뉴, 챙길 것을 적어 두세요"
          rows={4}
          style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1.5px solid #ddd", borderRadius: "4px", fontSize: "13px", lineHeight: 1.6, resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: memoState === "failed" ? "#e53935" : "#aaa", marginTop: "3px" }}>
          <span>
            {memoState === "saving" && "저장 중…"}
            {memoState === "saved" && "저장했어요"}
            {memoState === "failed" && "저장하지 못했어요. 다시 눌러 저장해 보세요"}
            {memoState === "idle" && draft != null && "입력을 마치면 저장돼요"}
          </span>
          <span>{memoValue.length} / {MAX_MEMO}</span>
        </div>
      </Section>

      {/* 조작 — 일정 수정 중에만 */}
      {isEditing && !isFixed && (
        <Section label="이 일정에 하기">
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={onReplace} style={smallButton}>장소 바꾸기</button>
            {otherDays.length > 0 && (
              <select
                value=""
                onChange={(e) => { if (e.target.value) onMove(e.target.value); }}
                style={{ padding: "5px 8px", border: "1.5px solid #000", borderRadius: "4px", fontSize: "12px", fontWeight: 700, background: "#fff", cursor: "pointer" }}
              >
                <option value="">다른 날로 옮기기 ▸</option>
                {otherDays.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <button
              onClick={() => { if (window.confirm(`‘${node.title}’을(를) 일정에서 삭제할까요?`)) onDelete(); }}
              style={{ ...smallButton, borderColor: "#e53935", color: "#e53935" }}
            >
              삭제
            </button>
          </div>
        </Section>
      )}
      {isEditing && isFixed && (
        <p style={{ fontSize: "12px", color: "#aaa", margin: "8px 0 0" }}>
          {cat === "숙소" ? "숙소" : "출발지"}는 순서·장소를 바꾸거나 옮길 수 없어요.
        </p>
      )}
    </div>
  );
};

export default StopDetailPanel;
