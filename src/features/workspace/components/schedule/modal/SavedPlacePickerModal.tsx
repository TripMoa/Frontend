// src/features/workspace/components/schedule/modal/SavedPlacePickerModal.tsx
//
// 일차 화면의 "장소 추가" — DAY ALL에 저장해 둔 장소에서 먼저 고르고, 없을 때만 새로 검색한다.
// (AI가 시간이 모자라 뺀 "일정 미포함" 장소를 검색 없이 바로 되살릴 수 있다)

import React, { useMemo, useState } from "react";
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

  const chip = (value: string, label: string) => (
    <button
      key={value}
      type="button"
      className={`tm-pill${category === value ? " is-on" : ""}`}
      aria-pressed={category === value}
      onClick={() => setCategory(value)}
    >
      {label}
    </button>
  );

  return (
    <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="tm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={replacing ? "장소 바꾸기" : "장소 추가"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tm-modal__head">
          <h3 className="tm-modal__title">
            {replacing ? `‘${replacing.title}’을(를) 대신 넣을 장소` : "저장한 장소에서 고르기"}
          </h3>
          <button type="button" className="tm-btn tm-btn--sm" onClick={onClose}>닫기</button>
        </div>

        <div className="tm-modal__body">
          {replacing && <p className="tm-hint">고른 장소로 바뀌어요. 순서와 머무는 시간은 그대로예요.</p>}
          {unscheduledCount > 0 && (
            <p className="tm-hint">일정 미포함 {unscheduledCount}곳이 위에 있어요.</p>
          )}
          <div className="ws-fld">
            <input
              type="text"
              className="tm-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="저장한 장소 검색"
              placeholder="저장한 장소에서 이름·주소로 찾기"
            />
          </div>
          <div className="tm-row tm-row--wrap tm-gap-2 tm-mb-2">
            {chip("all", "전체")}
            {FILTER_CATEGORIES.map((c) => chip(c, c))}
          </div>

          {message && (
            <div className={`tm-notice tm-mb-2${message.error ? " tm-notice--danger" : " tm-notice--ok"}`} role="status">
              {message.text}
            </div>
          )}

          {visible.length === 0 ? (
            <p className="tm-empty">
              {rows.length === 0
                ? "저장한 장소가 없어요. 아래에서 새로 검색해 추가해 보세요."
                : "조건에 맞는 저장 장소가 없어요."}
            </p>
          ) : (
            <ul className="tm-list">
              {visible.map(({ place, inThisDay, otherDays, noCoords, unscheduled }) => {
                const disabled = inThisDay || noCoords || addingId != null;
                const sub = [
                  place.category,
                  place.address || null,
                  unscheduled ? "일정 미포함" : null,
                  !inThisDay && otherDays.length > 0 ? `${otherDays.join(", ")}에 있어요` : null,
                  noCoords ? "좌표 없음" : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={place.id} className="tm-list__item">
                    <div className="tm-list__main">
                      <div className="tm-list__title">{place.name}</div>
                      <div className="tm-list__sub">{sub}</div>
                    </div>
                    <button
                      type="button"
                      className="tm-btn tm-btn--sm"
                      onClick={() => void handleAdd(place)}
                      disabled={disabled}
                      title={noCoords ? "좌표가 없는 장소는 일정에 넣을 수 없어요" : inThisDay ? "이미 이 날 일정에 있어요" : undefined}
                    >
                      {addingId === place.id
                        ? (replacing ? "바꾸는 중…" : "추가 중…")
                        : inThisDay ? "일정에 있음" : (replacing ? "이 장소로 바꾸기" : "이 날에 추가")}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="tm-modal__foot">
          <button type="button" className="tm-btn tm-btn--link ws-ulink tm-mr-auto" onClick={onSearchNew}>
            + 새로 검색해서 추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavedPlacePickerModal;
