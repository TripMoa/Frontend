//src\features\workspace\components\schedule\DayAllView.tsx

import React, { useState, useEffect, useRef } from "react";
import AddPlaceModal from "../schedule/modal/AddPlaceModal";
import AiScheduleModal from "../schedule/modal/AiScheduleModal";
import type { TimelineNode } from "../schedule/modal/AiScheduleModal";
import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import { useNaverMap } from "../../hooks/useNaverMap";
import { CATEGORY_COLOR, CATEGORY_LIST, getCategoryIcon } from "../../hooks/schedule.constants";
import "../../styles/center.css";
import "../../styles/modals.css";

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
}



const DayAllView: React.FC<DayAllViewProps> = ({
  tripId,
  tripTitle,
  startDate,
  endDate,
  onScheduleGenerated,
  savedPlaces,
  addPlace,
  updatePlace,
  deletePlace,
}) => {
  const { selectTab } = useWorkspaceCore();
  const { mapLoaded, mapKey } = useNaverMap();



  // ── 상태 ───────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [viewTab, setViewTab] = useState<"list" | "map">("list");
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null);
  // 삭제 유예 — 바로 지우지 않고 몇 초간 "실행취소" 가능한 상태로 숨겨둠
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const pendingDeleteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── 지도 refs ──────────────────────────────────────────────
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerByPlaceIdRef = useRef<Record<string, any>>({});
  const infoWindowRef = useRef<any>(null);

  // 삭제 유예 중인 장소는 실행취소 가능한 동안 리스트/지도에서 숨김
  const visiblePlaces = savedPlaces.filter((p) => !pendingDeleteIds.has(p.id));

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
      anchorSkew: true,
      backgroundColor: "#fff",
      borderColor: "#000",
      borderWidth: 2,
      pixelOffset: new window.naver.maps.Point(0, -10),
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
  const openPlaceInfo = (place: Place, marker: any) => {
    const color = CATEGORY_COLOR[place.category] || "#333";
    infoWindowRef.current.setContent(`
      <div style="padding:12px 16px;min-width:180px;max-width:240px;font-family:inherit">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
          <span style="background:${color};color:#fff;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:bold">
            ${getCategoryIcon(place.category)} ${place.category}
          </span>
          ${place.rating ? `<span style="font-size:12px;color:#ff9800;font-weight:bold">⭐ ${place.rating}</span>` : ""}
        </div>
        <div style="font-weight:bold;font-size:14px;margin-bottom:4px">${place.name}</div>
        <div style="font-size:11px;color:#666">${place.address || ""}</div>
      </div>
    `);
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
      const color = CATEGORY_COLOR[place.category] || "#333";

      const marker = new window.naver.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        icon: {
          content: `
            <div style="position:relative;width:30px;height:30px;">
              <div style="
                position:absolute;top:0;left:0;
                background:${color};color:#fff;
                border:1.5px solid #fff;border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);width:30px;height:30px;
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 3px 8px rgba(0,0,0,0.25);cursor:pointer;
                font-size:14px;">
                <span style="transform:rotate(45deg)">${getCategoryIcon(place.category)}</span>
              </div>
              <div style="
                position:absolute;top:-4px;right:-4px;
                width:15px;height:15px;border-radius:50%;
                background:#fff;border:1.5px solid ${color};
                display:flex;align-items:center;justify-content:center;
                font-size:9px;font-weight:bold;color:${color};
                box-shadow:0 1px 3px rgba(0,0,0,0.25);">
                ${idx + 1}
              </div>
            </div>`,
          anchor: new window.naver.maps.Point(15, 30),
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
    if (savedPlaces.length === 0) { showToast("장소를 먼저 추가해주세요."); return; }
    setIsAiModalOpen(true);
  };

  // AiScheduleModal이 API 응답을 localStorage에 직접 저장 후 onGenerate 호출.
  // loadFromExternal로 현재 탭 nodes 상태를 즉시 업데이트한다.
  const handleGenerateSchedule = (
    _settings: any,
    generatedSchedule: Record<string, TimelineNode[]>,
    dayKeys: string[]
  ) => {
    onScheduleGenerated(generatedSchedule);
    setIsAiModalOpen(false);
    // 생성된 첫 번째 DAY로 자동 이동
    const firstDay = dayKeys[0] ?? "DAY 1";
    selectTab(firstDay, "timeline");
  };

  // ── 필터된 장소 ────────────────────────────────────────────
  const filteredPlaces = category === "all"
    ? visiblePlaces
    : visiblePlaces.filter((p) => p.category === category);

  const mapablePlaces = filteredPlaces.filter((p) => p.lat != null && p.lng != null);

  // ── 렌더 ───────────────────────────────────────────────────
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 0 }}>

        {/* ── 헤더 ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>MY SAVED PLACES</h2>
            <p style={{ color: "#999", marginTop: "4px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
              {startDate} — {endDate} · {savedPlaces.length}개
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{ padding: "10px 20px", background: "#fff", color: "#000", border: "2px solid #000", fontWeight: "bold", fontSize: "14px", cursor: "pointer", borderRadius: "4px" }}
            >
              + 새 장소 추가
            </button>
            {savedPlaces.length > 0 && (
              <button
                onClick={handleOpenAiModal}
                style={{ padding: "10px 20px", background: "#000", color: "#fff", border: "2px solid #000", borderRadius: "4px", fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}
              >
                ✨ AI 일정 생성
              </button>
            )}
          </div>
        </div>

        {/* ── 바디: 리스트 + 지도 ── */}
        <div style={{ display: "flex", gap: "16px", flex: 1, minHeight: 0 }}>

          {/* ── 왼쪽: 카드 리스트 ── */}
          <div style={{ width: "420px", flexShrink: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>

            {/* 카테고리 필터 — 한 줄에 다 들어가도록 압축, 넘치면 가로 스크롤 */}
            <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap", overflowX: "auto", marginBottom: "12px", flexShrink: 0, paddingBottom: "2px" }}>
              {["all", ...CATEGORY_LIST].map((cat) => {
                const active = category === cat;
                const color = CATEGORY_COLOR[cat] || "#000";
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      flexShrink: 0,
                      padding: "3px 9px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold",
                      border: `1.5px solid ${active ? (cat === "all" ? "#000" : color) : "#ddd"}`,
                      background: active ? (cat === "all" ? "#000" : color) : "#fff",
                      color: active ? "#fff" : "#888",
                      cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                    }}
                  >
                    {cat === "all" ? "전체" : cat}
                  </button>
                );
              })}
            </div>

            {/* 카드 목록 */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {filteredPlaces.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#bbb" }}>
                  <p style={{ fontSize: "28px", marginBottom: "8px" }}>📍</p>
                  <p style={{ fontSize: "13px" }}>아직 추가된 장소가 없습니다</p>
                </div>
              ) : (
                filteredPlaces.map((place) => {
                  const color = CATEGORY_COLOR[place.category] || "#333";
                  return (
                    <div
                      key={place.id}
                      onClick={() => handleListClick(place)}
                      style={{
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        border: "1px solid #000",
                        borderLeft: `4px solid ${color}`,
                        background: "#fff",
                        boxShadow: "2px 2px 0px #ccc",
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: "16px", flexShrink: 0 }}>
                        {getCategoryIcon(place.category)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {place.name}
                          </h3>
                          {place.rating && (
                            <span style={{ fontSize: "11px", color: "#ff9800", flexShrink: 0 }}>⭐ {place.rating}</span>
                          )}
                        </div>
                        <p style={{ fontSize: "12px", color: "#999", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {place.address || "주소 없음"}
                        </p>
                      </div>
                      <select
                        value={place.category}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateCategory(place.id, e.target.value)}
                        style={{
                          flexShrink: 0,
                          fontSize: "11px", fontWeight: "bold", color,
                          border: `1.5px solid ${color}`, borderRadius: "10px",
                          padding: "3px 6px", background: "#fff", cursor: "pointer",
                        }}
                      >
                        {CATEGORY_LIST.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(place); }}
                        title="삭제"
                        style={{
                          flexShrink: 0, width: "26px", height: "26px",
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: "14px", color: "#bbb", borderRadius: "4px",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fdecea"; e.currentTarget.style.color = "#e53935"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#bbb"; }}
                      >
                        🗑
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── 오른쪽: 지도 ── */}
          <div style={{
            flex: 1,
            position: "relative",
            border: "2px solid #000",
            borderRadius: "8px",
            overflow: "hidden",
            minHeight: 0,
          }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

            {!mapLoaded && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f5f5f5", color: "#999" }}>
                <p style={{ fontSize: "28px", marginBottom: "8px" }}>🗺️</p>
                <p style={{ fontSize: "13px" }}>{mapKey ? "지도 로딩 중..." : "지도 키가 설정되지 않았습니다"}</p>
              </div>
            )}

            {mapLoaded && mapablePlaces.length < filteredPlaces.length && filteredPlaces.length > 0 && (
              <div style={{ position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.65)", color: "#fff", padding: "5px 14px", borderRadius: "14px", fontSize: "11px", pointerEvents: "none", whiteSpace: "nowrap" }}>
                📍 {mapablePlaces.length}/{filteredPlaces.length}개 표시 중
              </div>
            )}

            {mapLoaded && mapablePlaces.length === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.9)", color: "#bbb" }}>
                <p style={{ fontSize: "32px", marginBottom: "10px" }}>🗺️</p>
                <p style={{ fontSize: "13px" }}>표시할 장소가 없습니다</p>
              </div>
            )}

          </div>
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
        />
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: "32px", left: "50%",
          transform: "translateX(-50%)",
          background: "#222", color: "#fff",
          padding: "10px 14px 10px 22px", borderRadius: "20px",
          fontSize: "13px", fontWeight: "bold",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          zIndex: 9999,
          display: "flex", alignItems: "center", gap: "12px",
          animation: "fadeInUp 0.2s ease",
        }}>
          <span style={{ pointerEvents: "none" }}>{toast.message}</span>
          {toast.onUndo && (
            <button
              onClick={toast.onUndo}
              style={{
                background: "none", border: "none", color: "#8ab4ff",
                fontWeight: "bold", fontSize: "13px", cursor: "pointer", padding: 0,
              }}
            >
              실행취소
            </button>
          )}
        </div>
      )}

      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </>
  );
};
export default DayAllView;