//src\features\workspace\components\schedule\DayAllView.tsx

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import AddPlaceModal from "../schedule/modal/AddPlaceModal";
import AiScheduleModal from "../schedule/modal/AiScheduleModal";
import type { TimelineNode, AiScheduleSettings } from "../schedule/modal/AiScheduleModal";
import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import { useNaverMap } from "../../hooks/useNaverMap";
import type { NaverMapObject } from "../../hooks/naverMapTypes";
import { CATEGORY_COLOR, CATEGORY_LIST } from "../../hooks/schedule.constants";
import { PIN_SIZE, cssVar, infoHtml, infoWindowBase, pinHtml } from "./mapStyle";
import "../../styles/center.css";
import "../../styles/modals.css";
import { itemMatchesPlace } from "../../hooks/placeMatch";
import type { GenerationLock } from "../../hooks/tripChange";
import { useScheduleUndo } from "../../hooks/useScheduleUndo";
import { ActionPromptModal } from "../../../../shared/components/ActionPromptModal";

interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  imageUrl?: string;
  rating?: number;
  description?: string;
  lat?: number;
  lng?: number;
}

// 가까운 장소끼리 핀이 겹치지 않도록 렌더링 전용 좌표에 작은 원형 오프셋을 적용
// (원본 place.lat/lng는 건드리지 않음 — 정보창/실제 위치는 그대로 유지)
const DECONFLICT_THRESHOLD_DEG = 0.00018; // 약 20m 이내면 같은 그룹으로 취급
const DECONFLICT_OFFSET_DEG = 0.00009; // 약 10m 반경으로 벌림

function deconflictPositions(
  places: { lat?: number; lng?: number }[]
): { lat: number; lng: number }[] {
  const original = places.map((p) => ({ lat: p.lat!, lng: p.lng! }));
  const used = new Set<number>();
  const groups: number[][] = [];

  original.forEach((pos, i) => {
    if (used.has(i)) return;
    const group = [i];
    used.add(i);
    for (let j = i + 1; j < original.length; j++) {
      if (used.has(j)) continue;
      if (
        Math.abs(original[j].lat - pos.lat) < DECONFLICT_THRESHOLD_DEG &&
        Math.abs(original[j].lng - pos.lng) < DECONFLICT_THRESHOLD_DEG
      ) {
        group.push(j);
        used.add(j);
      }
    }
    groups.push(group);
  });

  const result = original.map((p) => ({ ...p }));
  groups.forEach((group) => {
    if (group.length < 2) return;
    group.forEach((idx, k) => {
      if (k === 0) return; // 그룹의 첫 장소는 원래 좌표 유지
      const angle = (2 * Math.PI * k) / group.length;
      result[idx] = {
        lat: original[idx].lat + DECONFLICT_OFFSET_DEG * Math.sin(angle),
        lng: original[idx].lng + DECONFLICT_OFFSET_DEG * Math.cos(angle),
      };
    });
  });

  return result;
}

interface DayAllViewProps {
  tripId: number;
  tripTitle: string;
  startDate: string;
  endDate: string;
  onScheduleGenerated: (allDaysData: Record<string, TimelineNode[]>) => void;
  // 저장된 장소 목록은 WorkspaceCenter가 단일 소스로 들고 있다가 내려줌
  // (DayDetailView와 동일한 usePlaces 인스턴스를 공유해야 탭을 넘나들 때 최신 상태가 유지됨)
  savedPlaces: Place[];
  addPlace: (place: Omit<Place, "id">) => Promise<void>;
  updatePlace: (placeId: string, patch: { category?: string }) => Promise<void>;
  deletePlace: (placeId: string) => Promise<void>;
  // 밖(WorkspaceCenter)에서 AI 생성 모달을 열어달라는 신호 — 여행 기간 변경 안내의 "지금 재생성" 버튼용.
  // DAY ALL 탭이 아직 마운트 전이어도 마운트되는 순간 처리되도록 boolean 신호 + 처리 완료 콜백으로 둔다.
  autoOpenAiModal?: boolean;
  onAutoOpenAiModalHandled?: () => void;
  // 현재 일정에 들어 있는 항목들 — 저장된 장소 중 일정에 못 들어간 것에 "일정 미포함"을 표시하는 데 쓴다.
  // 생성 응답이 아니라 저장된 일정에서 계산하므로 새로고침해도 유지된다.
  scheduledItems?: { title: string; lat?: number; lng?: number }[];
  /** 다른 멤버가 AI 일정을 만드는 중이면 그 정보 — 끝날 때까지 새 AI 생성을 막는다 (서버도 거절한다) */
  generationLock?: GenerationLock | null;
  /** AI 재생성을 되돌린 뒤 — 서버 기준으로 일정을 다시 불러온다 */
  onScheduleRestored?: () => Promise<void> | void;
  /** 다른 멤버의 일정 변경 알림이 올 때마다 올라간다 — 되돌리기 가능 여부를 다시 확인하는 신호 */
  scheduleRevision?: number;
  /** DAY 탭 줄 오른쪽 끝(WorkspaceCenter) — 장소 추가·이전 일정으로·AI 일정 생성 버튼을 여기로 그린다 */
  actionsSlot?: HTMLElement | null;
  /** 일차별 일정 노드 — 장소가 몇 일차 몇 번째에 들어 있는지 보여주는 데 쓴다 */
  scheduledByDay?: Record<string, { title: string; lat?: number; lng?: number }[]>;
}



const DayAllView: React.FC<DayAllViewProps> = ({
  tripId,
  startDate,
  endDate,
  onScheduleGenerated,
  savedPlaces,
  addPlace,
  updatePlace,
  deletePlace,
  autoOpenAiModal = false,
  onAutoOpenAiModalHandled,
  scheduledItems = [],
  generationLock = null,
  onScheduleRestored,
  scheduleRevision = 0,
  actionsSlot = null,
  scheduledByDay = {},
}) => {
  const { selectTab } = useWorkspaceCore();
  const { mapLoaded, mapKey } = useNaverMap();



  // ── 상태 ───────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null); // 펼쳐 둔 장소
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null);
  // AI 재생성 되돌리기 — 다른 멤버의 생성이 끝나거나(generationLock 이 풀리면) 일정이 바뀌었다는 알림이 오면 상태를 다시 확인한다
  const undoState = useScheduleUndo(tripId, `${generationLock !== null}-${scheduleRevision}`);
  const [isUndoConfirmOpen, setIsUndoConfirmOpen] = useState(false);
  // 삭제 유예 — 바로 지우지 않고 몇 초간 "실행취소" 가능한 상태로 숨겨둠
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const pendingDeleteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── 지도 refs ──────────────────────────────────────────────
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<NaverMapObject>(null);
  const markersRef = useRef<NaverMapObject[]>([]);
  const markerByPlaceIdRef = useRef<Record<string, NaverMapObject>>({});
  const infoWindowRef = useRef<NaverMapObject>(null);

  // 삭제 유예 중인 장소는 실행취소 가능한 동안 리스트/지도에서 숨김
  const visiblePlaces = savedPlaces.filter((p) => !pendingDeleteIds.has(p.id));

  // 일정에 아직 못 들어간 장소인지 — 이름이 같거나 좌표가 거의 같은 항목이 일정에 있으면 들어간 것으로 본다.
  // (제목을 고쳐도 좌표로 잡히게 함. 숙소·교통은 방문 후보가 아니라 기준점이라 제외)
  const isUnscheduled = (place: Place) => {
    if (scheduledItems.length === 0) return false; // 일정이 아직 없으면 전부 "미포함"이 되므로 표시하지 않음
    if (place.category === "숙소" || place.category === "교통") return false;
    return !scheduledItems.some((item) => itemMatchesPlace(item, place));
  };

  // ── 지도 초기화 ──────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const current = category === "all" ? visiblePlaces : visiblePlaces.filter((p) => p.category === category);

    if (mapInstanceRef.current) {
      drawMarkers(current);
      return;
    }

    const validAll = visiblePlaces.filter((p) => p.lat != null && p.lng != null);
    const initialCenter = validAll.length > 0
      ? new window.naver.maps.LatLng(validAll[0].lat!, validAll[0].lng!)
      : new window.naver.maps.LatLng(37.5665, 126.978);

    const map = new window.naver.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 12,
      mapTypeControl: false,
      scaleControl: false,
      logoControl: false,
      mapDataControl: false,
    });

    infoWindowRef.current = new window.naver.maps.InfoWindow({
      ...infoWindowBase(),
      pixelOffset: new window.naver.maps.Point(0, -(PIN_SIZE / 2)),
    });

    mapInstanceRef.current = map;
    drawMarkers(current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, visiblePlaces, category]);

  // ── 필터 변경 시 마커 갱신 ────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const current = category === "all" ? visiblePlaces : visiblePlaces.filter((p) => p.category === category);
    drawMarkers(current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, visiblePlaces]);

  // ── 마커 초기화 ────────────────────────────────────────────
  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    markerByPlaceIdRef.current = {};
    infoWindowRef.current?.close();
  };

  // 핀 클릭 시 정보창 오픈 로직
  const openPlaceInfo = (place: Place, marker: NaverMapObject) => {
    const color = CATEGORY_COLOR[place.category] || cssVar("--tm-line-strong", "#999999");
    infoWindowRef.current.setContent(infoHtml(place, color));
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  };

  // ── 마커 그리기 ────────────────────────────────────────────
  const drawMarkers = (places: Place[]) => {
    if (!mapInstanceRef.current || !window.naver) return;
    clearMarkers();

    const validPlaces = places.filter((p) => p.lat != null && p.lng != null);
    if (!validPlaces.length) return;

    const renderPositions = deconflictPositions(validPlaces);
    const bounds = new window.naver.maps.LatLngBounds();

    validPlaces.forEach((place, idx) => {
      const { lat, lng } = renderPositions[idx];
      const pos = new window.naver.maps.LatLng(lat, lng);
      const color = CATEGORY_COLOR[place.category] || cssVar("--tm-line-strong", "#999999");

      const marker = new window.naver.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        icon: {
          content: pinHtml(color, idx + 1),
          anchor: new window.naver.maps.Point(PIN_SIZE / 2, PIN_SIZE / 2),
        },
        zIndex: 100,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        openPlaceInfo(place, marker);
      });

      bounds.extend(pos);
      markersRef.current.push(marker);
      markerByPlaceIdRef.current[place.id] = marker;
    });

    if (validPlaces.length === 1) {
      mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(renderPositions[0].lat, renderPositions[0].lng));
      mapInstanceRef.current.setZoom(15);
    } else {
      mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 40, bottom: 80, left: 40 });
    }
  };

  // ── 리스트 아이템 클릭 → 지도에서 해당 장소 포커스 ─────────
  const handleListClick = (place: Place) => {
    if (!mapInstanceRef.current || !window.naver || place.lat == null || place.lng == null) return;
    mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(place.lat, place.lng));
    mapInstanceRef.current.setZoom(16);
    const marker = markerByPlaceIdRef.current[place.id];
    if (marker) {
      window.naver.maps.Event.trigger(marker, "click");
    }
  };

  // ── 토스트 ─────────────────────────────────────────────────
  const showToast = (message: string, onUndo?: () => void) => {
    setToast({ message, onUndo });
    setTimeout(() => setToast(null), onUndo ? 4000 : 2500);
  };

  // ── CRUD ───────────────────────────────────────────────────
  // 성공 시 토스트는 여기서 띄우지 않음 — AddPlaceModal/AiScheduleModal이 각자
  // 자체 확인 토스트(하단 토스트 / 인라인 "✅ 추가됨")를 이미 보여주고 있어서
  // 여기서도 띄우면 같은 내용이 두 번 뜸. "이미 추가된 장소" 케이스만 여기서 안내.
  const handleAddPlace = async (place: Place) => {
    if (savedPlaces.some((p) => p.id === place.id || (p.name === place.name && p.lat === place.lat))) {
      showToast("이미 추가된 장소입니다.");
      return;
    }
    await addPlace({
      name: place.name,
      category: place.category,
      address: place.address,
      description: place.description,
      lat: place.lat,
      lng: place.lng,
    });
  };

  // 삭제 — 바로 지우지 않고 4초간 유예를 두고 "실행취소" 가능하게 함
  const handleDeleteClick = (place: Place) => {
    setPendingDeleteIds((prev) => new Set(prev).add(place.id));
    pendingDeleteTimers.current[place.id] = setTimeout(() => {
      delete pendingDeleteTimers.current[place.id];
      deletePlace(place.id);
    }, 4000);
    showToast(`'${place.name}' 삭제했습니다.`, () => handleUndoDelete(place.id));
  };

  const handleUndoDelete = (placeId: string) => {
    clearTimeout(pendingDeleteTimers.current[placeId]);
    delete pendingDeleteTimers.current[placeId];
    setPendingDeleteIds((prev) => {
      const next = new Set(prev);
      next.delete(placeId);
      return next;
    });
    setToast(null);
  };

  const updateCategory = (placeId: string, category: string) => {
    updatePlace(placeId, { category });
  };

  const handleOpenAiModal = () => {
    if (generationLock) { showToast("지금 다른 멤버가 AI 일정을 만들고 있어요. 끝나면 다시 시도해주세요."); return; }
    if (savedPlaces.length === 0) { showToast("장소를 먼저 추가해주세요."); return; }
    setIsAiModalOpen(true);
  };

  useEffect(() => {
    if (!autoOpenAiModal) return;
    handleOpenAiModal();
    onAutoOpenAiModalHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenAiModal]);

  // AiScheduleModal이 API 응답을 localStorage에 직접 저장 후 onGenerate 호출.
  // loadFromExternal로 현재 탭 nodes 상태를 즉시 업데이트한다.
  const handleGenerateSchedule = (
    _settings: AiScheduleSettings,
    generatedSchedule: Record<string, TimelineNode[]>,
    dayKeys: string[]
  ) => {
    onScheduleGenerated(generatedSchedule);
    setIsAiModalOpen(false);
    void undoState.refresh();   // 방금 만든 일정을 되돌릴 수 있게 됐다
    // 생성된 첫 번째 DAY로 자동 이동
    const firstDay = dayKeys[0] ?? "DAY 1";
    selectTab(firstDay, "timeline");
  };

  const handleConfirmUndo = async () => {
    setIsUndoConfirmOpen(false);
    try {
      await undoState.undo();
      await onScheduleRestored?.();
      showToast("AI 일정을 이전 상태로 되돌렸어요.");
    } catch (e) {
      showToast((e as Error).message);
    }
  };

  // ── 필터된 장소 ────────────────────────────────────────────
  const q = query.trim().toLowerCase();
  const filteredPlaces = (category === "all"
    ? visiblePlaces
    : visiblePlaces.filter((p) => p.category === category)
  ).filter((p) => !q || p.name.toLowerCase().includes(q) || (p.address ?? "").toLowerCase().includes(q));

  const mapablePlaces = filteredPlaces.filter((p) => p.lat != null && p.lng != null);

  // ── 목록 묶음: 아직 일정에 안 넣은 장소를 위로 (시안과 같은 순서) ──
  const unscheduledList = filteredPlaces.filter(isUnscheduled);
  const scheduledList = filteredPlaces.filter((p) => !isUnscheduled(p));

  // 이 장소가 몇 일차 몇 번째 일정에 들어 있는지
  const dayOf = (place: Place): { key: string; no: number; order: number } | null => {
    const entries = Object.entries(scheduledByDay).sort(
      (a, b) => Number(/\d+/.exec(a[0])?.[0] ?? 0) - Number(/\d+/.exec(b[0])?.[0] ?? 0),
    );
    for (const [key, list] of entries) {
      const idx = list.findIndex((item) => itemMatchesPlace(item, place));
      if (idx >= 0) return { key, no: Number(/\d+/.exec(key)?.[0] ?? 0), order: idx + 1 };
    }
    return null;
  };

  const renderPlace = (place: Place) => {
    const on = selectedId === place.id;
    const day = dayOf(place);
    const color = CATEGORY_COLOR[place.category] || "var(--tm-line-strong)";
    const select = () => {
      setSelectedId(on ? null : place.id);
      if (!on) handleListClick(place);
    };
    return (
      <div key={place.id} className="ws-all__wrap">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={on}
          className={`tm-row-card ws-all__row${on ? " is-on" : ""}`}
          style={{ ["--tm-cat" as string]: color }}
          onClick={select}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              select();
            }
          }}
        >
          <div className="tm-grow ws-all__main">
            <div className="tm-row-card__title">{place.name}</div>
            <div className="tm-row-card__sub tm-ellipsis">
              {place.category} · {place.address || "주소 없음"}
            </div>
          </div>
          {day && <span className="tm-tag tm-tag--yellow">DAY {day.no}</span>}
        </div>

        {on && (
          <div className="ws-all__acts">
            {day && (
              <div className="ws-all__actrow">
                <button
                  type="button"
                  className="tm-chip"
                  onClick={() => selectTab(day.key, "timeline")}
                >
                  {day.key} · {day.order}번째 일정에서 보기 ▸
                </button>
              </div>
            )}
            <div className="ws-all__actrow ws-all__actrow--end">
              <select
                className="tm-select ws-all__cat"
                aria-label={`${place.name} 카테고리`}
                value={place.category}
                onChange={(e) => updateCategory(place.id, e.target.value)}
              >
                {CATEGORY_LIST.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <span className="tm-grow" />
              <button
                type="button"
                className="tm-btn tm-btn--link ws-all__del"
                onClick={() => handleDeleteClick(place)}
              >
                삭제
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const actions = (
    <>
      <button type="button" className="tm-btn tm-btn--sm" onClick={() => setIsAddModalOpen(true)}>
        + 장소 추가
      </button>
      {undoState.status?.available && (
        <button
          type="button"
          className="tm-btn tm-btn--sm"
          onClick={() => setIsUndoConfirmOpen(true)}
          disabled={generationLock !== null || undoState.isUndoing}
          title={`${undoState.status.actorNickname ?? "누군가"}님이 AI로 다시 만들기 직전의 일정으로 되돌려요`}
        >
          {undoState.isUndoing ? "되돌리는 중..." : "이전 일정으로"}
        </button>
      )}
      {savedPlaces.length > 0 && (
        <button
          type="button"
          className="tm-btn tm-btn--sm tm-btn--primary"
          onClick={handleOpenAiModal}
          disabled={generationLock !== null}
          title={generationLock ? "다른 멤버가 AI 일정을 만드는 중이에요" : undefined}
        >
          {generationLock ? "AI 생성 중..." : "AI 일정 생성"}
        </button>
      )}
    </>
  );

  // ── 렌더 ───────────────────────────────────────────────────
  return (
    <>
      {actionsSlot ? createPortal(actions, actionsSlot) : <div className="ws-all-actions">{actions}</div>}

      <div className="ws-all">
        {/* ── 왼쪽: 장소 목록 ── */}
        <div className="ws-all__side">
          <div className="ws-all__filter">
            <input
              className="tm-input"
              type="search"
              placeholder="저장한 장소 검색"
              aria-label="저장한 장소 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="tm-select"
              aria-label="카테고리"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">카테고리 전체</option>
              {CATEGORY_LIST.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="ws-all__scroll">
            {filteredPlaces.length === 0 ? (
              <div className="tm-empty">
                {query || category !== "all" ? "조건에 맞는 장소가 없어요" : "아직 추가된 장소가 없어요"}
              </div>
            ) : (
              <>
                {unscheduledList.length > 0 && (
                  <div className="ws-cap ws-all__cap">
                    아직 안 넣은 장소<b>{unscheduledList.length}</b>
                  </div>
                )}
                {unscheduledList.map(renderPlace)}
                {scheduledList.length > 0 && (
                  <div className="ws-cap ws-all__cap">
                    {unscheduledList.length > 0 ? "일정에 넣은 장소" : "저장한 장소"}
                    <b>{scheduledList.length}</b>
                  </div>
                )}
                {scheduledList.map(renderPlace)}
              </>
            )}
          </div>
        </div>

        {/* ── 오른쪽: 지도 ── */}
        <div className="tm-map ws-all__map">
          <div ref={mapRef} className="tm-map__canvas" />

          <div className="tm-map__legend">
            {CATEGORY_LIST.map((cat) => (
              <span key={cat}>
                <i style={{ background: CATEGORY_COLOR[cat] }} />
                {cat}
              </span>
            ))}
          </div>

          {!mapLoaded && (
            <div className="ws-all__mapmsg">
              {mapKey ? "지도 로딩 중..." : "지도 키가 설정되지 않았어요"}
            </div>
          )}

          {mapLoaded && mapablePlaces.length < filteredPlaces.length && filteredPlaces.length > 0 && (
            <div className="tm-tag tm-tag--dark ws-all__mapcount">
              {mapablePlaces.length}/{filteredPlaces.length}개 표시 중
            </div>
          )}

          {mapLoaded && mapablePlaces.length === 0 && (
            <div className="ws-all__mapmsg">표시할 장소가 없어요</div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <AddPlaceModal
          onClose={() => setIsAddModalOpen(false)}
          onAddPlace={handleAddPlace}
          existingPlaces={savedPlaces}
        />
      )}
      {isAiModalOpen && (
        <AiScheduleModal
          onClose={() => setIsAiModalOpen(false)}
          onGenerate={handleGenerateSchedule}
          onAddPlace={handleAddPlace}
          savedPlaces={savedPlaces}
          startDate={startDate}
          endDate={endDate}
          tripId={tripId}
          hasExistingSchedule={scheduledItems.length > 0}
          generationLock={generationLock}
        />
      )}

      <ActionPromptModal
        open={isUndoConfirmOpen}
        title="UNDO AI SCHEDULE"
        headline="AI 일정을 이전 상태로 되돌릴까요?"
        description={`${undoState.status?.actorNickname ?? "누군가"}님이 AI로 다시 만들기 직전의 일정으로 돌아가요. 다시 만들어진 일정은 사라지고, 되돌린 뒤에는 이 작업을 취소할 수 없어요. 다시 만들 때 일정에서 빠졌던 장소에 걸려 있던 지출·바우처 연결은 복원되지 않아요(지출·바우처 자체는 그대로예요).`}
        cancelText="취소"
        confirmText="되돌리기"
        onClose={() => setIsUndoConfirmOpen(false)}
        onConfirm={() => void handleConfirmUndo()}
      />

      {toast && (
        <div className="tm-toast" role="status">
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button type="button" onClick={toast.onUndo}>
              실행취소
            </button>
          )}
        </div>
      )}
    </>
  );
};
export default DayAllView;