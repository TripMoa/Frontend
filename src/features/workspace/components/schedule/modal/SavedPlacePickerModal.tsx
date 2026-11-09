// src/features/workspace/components/schedule/modal/SavedPlacePickerModal.tsx
//
// 일차 화면의 "장소 추가" — DAY ALL에 저장해 둔 장소에서 먼저 고르고, 없을 때만 새로 검색한다.
// (AI가 시간이 모자라 뺀 "일정 미포함" 장소를 검색 없이 바로 되살릴 수 있다)

import React, { useMemo, useState } from "react";
import "../../../styles/modals.css";
import { CATEGORY_COLOR, getCategoryIcon } from "../../../hooks/schedule.constants";
import { itemMatchesPlace } from "../../../hooks/placeMatch";
import type { ItemRef } from "../../../hooks/placeMatch";

export interface PickerPlace {
  id: string;
  name: string;
  category: string;
  address: string;
  rating?: number;
  lat?: number;
  lng?: number;
}

interface Props {
  dayTitle: string;
  savedPlaces: PickerPlace[];
  /** 일차별로 일정에 들어 있는 노드 (제목·좌표) */
  scheduledByDay: Record<string, ItemRef[]>;
  /** 지금 보고 있는 일차의 노드 */
  currentNodes: ItemRef[];
  onAdd: (place: PickerPlace) => Promise<void>;
  /** 있으면 "장소 바꾸기" 모드 — 이 노드 대신 넣을 장소를 고르고, 고르면 창을 닫는다 */
  replacing?: { title: string };
  onSearchNew: () => void;
  onClose: () => void;
}

// 숙소·교통은 방문 후보가 아니라 기준점 — AI 일정 설정의 체크리스트로만 일정에 들어간다
const EXCLUDED_CATEGORIES = ["숙소", "교통"];
const FILTER_CATEGORIES = ["관광", "맛집", "카페", "쇼핑"];

const dayNo = (key: string) => Number(/\d+/.exec(key)?.[0] ?? 0);

const SavedPlacePickerModal: React.FC<Props> = ({
  dayTitle, savedPlaces, scheduledByDay, currentNodes, onAdd, replacing, onSearchNew, onClose,
}) => {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // 일정이 아직 하나도 없으면 전부 "미포함"이 되므로 그 표시는 하지 않는다 (DAY ALL과 같은 기준)
  const hasAnySchedule =
    currentNodes.length > 0 || Object.values(scheduledByDay).some((list) => list.length > 0);

  const rows = useMemo(() => {
    const built = savedPlaces
      .filter((p) => !EXCLUDED_CATEGORIES.includes(p.category))
      .map((place) => {
        const inThisDay = currentNodes.some((n) => itemMatchesPlace(n, place));
        const otherDays = Object.entries(scheduledByDay)
          .filter(([day, list]) => day !== dayTitle && list.some((n) => itemMatchesPlace(n, place)))
          .map(([day]) => day)
          .sort((a, b) => dayNo(a) - dayNo(b));
        return {
          place,
          inThisDay,
          otherDays,
          noCoords: place.lat == null || place.lng == null,
          unscheduled: hasAnySchedule && !inThisDay && otherDays.length === 0,
        };
      });
    // "일정 미포함"을 위로 (같은 그룹 안에서는 저장한 순서 유지)
    return [...built.filter((r) => r.unscheduled), ...built.filter((r) => !r.unscheduled)];
  }, [savedPlaces, scheduledByDay, currentNodes, dayTitle, hasAnySchedule]);

  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      (category === "all" || r.place.category === category) &&
      (!q || r.place.name.toLowerCase().includes(q) || (r.place.address ?? "").toLowerCase().includes(q)),
  );
  const unscheduledCount = rows.filter((r) => r.unscheduled).length;

  const handleAdd = async (place: PickerPlace) => {
    if (addingId) return;
    setAddingId(place.id);
    setMessage(null);
    try {
      await onAdd(place);
      if (replacing) {
        onClose();
        return;
      }
      setMessage({ text: `'${place.name}'을(를) ${dayTitle}에 추가했어요.`, error: false });
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setMessage({
        text: err?.response?.data?.message || err?.message || `'${place.name}' ${replacing ? "로 바꾸기" : "추가"}에 실패했어요.`,
        error: true,
      });
    } finally {
      setAddingId(null);
    }
  };

  const chip = (value: string, label: string, count?: number) => (
    <button
      key={value}
      onClick={() => setCategory(value)}
      style={{
        padding: "5px 12px", borderRadius: "16px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
        border: "1.5px solid #000", background: category === value ? "#000" : "#fff",
        color: category === value ? "#fff" : "#000",
      }}
    >
      {label}{count != null ? ` ${count}` : ""}
    </button>
  );

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="modal-window"
        style={{ width: "92%", maxWidth: "640px", maxHeight: "86vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="mh-title">
            {replacing ? `>> '${replacing.title}' 대신 넣을 장소` : `>> ${dayTitle}에 장소 추가`}
          </span>
          <button className="mh-close" onClick={onClose}>CLOSE [X]</button>
        </div>

        <div style={{ padding: "14px 20px 10px", borderBottom: "2px solid #eee", flexShrink: 0 }}>
          <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#666", lineHeight: 1.5 }}>
            {replacing ? "고른 장소로 바뀌어요. 순서와 머무는 시간은 그대로예요. " : ""}저장해 둔 장소에서 먼저 골라 보세요.
            {unscheduledCount > 0 && (
              <> <b style={{ color: "#e65100" }}>일정 미포함 {unscheduledCount}곳</b>이 위에 있어요.</>
            )}
          </p>
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 저장한 장소에서 이름·주소로 찾기"
            style={{
              width: "100%", boxSizing: "border-box", height: "36px", padding: "0 12px",
              border: "1.5px solid #ddd", borderRadius: "6px", fontSize: "13px", marginBottom: "8px",
            }}
          />
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {chip("all", "전체", rows.length)}
            {FILTER_CATEGORIES.map((c) => chip(c, c, rows.filter((r) => r.place.category === c).length))}
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: "10px 20px", flex: 1, minHeight: "160px" }}>
          {visible.length === 0 && (
            <p style={{ fontSize: "13px", color: "#999", textAlign: "center", padding: "32px 0", lineHeight: 1.7, whiteSpace: "pre-line" }}>
              {rows.length === 0
                ? "저장한 장소가 없어요.\n아래에서 새로 검색해 추가해 보세요."
                : "조건에 맞는 저장 장소가 없어요."}
            </p>
          )}

          {visible.map(({ place, inThisDay, otherDays, noCoords, unscheduled }) => {
            const color = CATEGORY_COLOR[place.category] || "#999";
            const disabled = inThisDay || noCoords || addingId != null;
            return (
              <div
                key={place.id}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", marginBottom: "6px",
                  border: "1px solid #eee", borderLeft: `4px solid ${color}`, borderRadius: "0 6px 6px 0",
                  background: unscheduled ? "#fffaf0" : "#fff",
                }}
              >
                <span style={{ fontSize: "18px", flexShrink: 0 }}>{getCategoryIcon(place.category)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#111" }}>{place.name}</span>
                    {unscheduled && (
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#e65100", border: "1px solid #ffcc80", background: "#fff3e0", borderRadius: "10px", padding: "1px 7px" }}>
                        일정 미포함
                      </span>
                    )}
                    {inThisDay && (
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#2e7d32", border: "1px solid #a5d6a7", background: "#e8f5e9", borderRadius: "10px", padding: "1px 7px" }}>
                        이 날에 있어요
                      </span>
                    )}
                    {!inThisDay && otherDays.length > 0 && (
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "#1565c0", border: "1px solid #90caf9", background: "#e3f2fd", borderRadius: "10px", padding: "1px 7px" }}>
                        {otherDays.join(", ")}에 있어요
                      </span>
                    )}
                    {noCoords && (
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "#757575", border: "1px solid #ddd", background: "#f5f5f5", borderRadius: "10px", padding: "1px 7px" }}>
                        좌표 없음
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {place.category}{place.address ? ` · ${place.address}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => void handleAdd(place)}
                  disabled={disabled}
                  title={noCoords ? "좌표가 없는 장소는 일정에 넣을 수 없어요" : inThisDay ? "이미 이 날 일정에 있어요" : undefined}
                  style={{
                    flexShrink: 0, padding: "6px 12px", borderRadius: "5px", border: "none", fontSize: "12px", fontWeight: 700,
                    background: disabled ? "#ddd" : "#000", color: disabled ? "#888" : "#fff",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  {addingId === place.id
                    ? (replacing ? "바꾸는 중…" : "추가 중…")
                    : inThisDay ? (replacing ? "이미 있어요" : "추가됨") : (replacing ? "이 장소로 바꾸기" : "이 날에 추가")}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "2px solid #eee", flexShrink: 0 }}>
          {message && (
            <p style={{ margin: "0 0 8px", fontSize: "12px", color: message.error ? "#e53935" : "#2e7d32", fontWeight: 600 }}>
              {message.error ? "⚠️ " : "✅ "}{message.text}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={onSearchNew}
              style={{ background: "none", border: "1.5px dashed #999", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", cursor: "pointer", color: "#333" }}
            >
              🔍 찾는 장소가 없나요? 새로 검색하기
            </button>
            <button
              onClick={onClose}
              style={{ background: "#000", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedPlacePickerModal;
