//src\features\workspace\components\schedule\DayAllView.tsx

import React, { useState, useEffect, useRef } from "react";
import AddPlaceModal from "../schedule/modal/AddPlaceModal";
import AiScheduleModal from "../schedule/modal/AiScheduleModal";
import type { TimelineNode } from "../schedule/modal/AiScheduleModal";
import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import { useNaverMap } from "../../hooks/useNaverMap";
import { usePlaces } from "../../hooks/usePlaces";
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
  memo?: string;
}

interface DayAllViewProps {
  tripId: number;
  tripTitle: string;
  startDate: string;
  endDate: string;
  onScheduleGenerated: (allDaysData: Record<string, TimelineNode[]>) => void;
}



const DayAllView: React.FC<DayAllViewProps> = ({
  tripId,
  tripTitle,
  startDate,
  endDate,
  onScheduleGenerated,
}) => {
  const { selectTab } = useWorkspaceCore();
  const { mapLoaded, mapKey } = useNaverMap();
  const { places: savedPlaces, addPlace, updatePlace, deletePlace } = usePlaces(tripId);



  // ── 상태 ───────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [viewTab, setViewTab] = useState<"list" | "map">("list");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);

  // ── 지도 refs ──────────────────────────────────────────────
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  // ── 지도 초기화 ──────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const current = category === "all" ? savedPlaces : savedPlaces.filter((p) => p.category === category);

    if (mapInstanceRef.current) {
      drawMarkers(current);
      return;
    }

    const validAll = savedPlaces.filter((p) => p.lat != null && p.lng != null);
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
  }, [mapLoaded, savedPlaces, category]);

  // ── 필터 변경 시 마커 갱신 ────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const current = category === "all" ? savedPlaces : savedPlaces.filter((p) => p.category === category);
    drawMarkers(current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, savedPlaces]);

  // ── 마커 초기화 ────────────────────────────────────────────
  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    infoWindowRef.current?.close();
  };

  // ── 마커 그리기 ────────────────────────────────────────────
  const drawMarkers = (places: Place[]) => {
    if (!mapInstanceRef.current || !window.naver) return;
    clearMarkers();

    const validPlaces = places.filter((p) => p.lat != null && p.lng != null);
    if (!validPlaces.length) return;

    const bounds = new window.naver.maps.LatLngBounds();

    validPlaces.forEach((place, idx) => {
      const pos = new window.naver.maps.LatLng(place.lat!, place.lng!);
      const color = CATEGORY_COLOR[place.category] || "#333";

      const marker = new window.naver.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        icon: {
          content: `
            <div style="
              background:${color};color:#fff;
              border:2px solid #fff;border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);width:30px;height:30px;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 6px rgba(0,0,0,0.35);cursor:pointer;
              font-size:11px;font-weight:bold;">
              <span style="transform:rotate(45deg)">${idx + 1}</span>
            </div>`,
          anchor: new window.naver.maps.Point(15, 30),
        },
        zIndex: 100,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
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
        setSelectedPlace(place);
      });

      bounds.extend(pos);
      markersRef.current.push(marker);
    });

    if (validPlaces.length === 1) {
      mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(validPlaces[0].lat!, validPlaces[0].lng!));
      mapInstanceRef.current.setZoom(15);
    } else {
      mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 40, bottom: 80, left: 40 });
    }
  };

  // ── 토스트 ─────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ── CRUD ───────────────────────────────────────────────────
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
      memo: place.memo,
      lat: place.lat,
      lng: place.lng,
    });
    showToast(`${place.name} 추가됨`);
  };

  const removePlace = (placeId: string) => {
    setConfirmTargetId(placeId);
  };

  const confirmRemove = async () => {
    if (!confirmTargetId) return;
    await deletePlace(confirmTargetId);
    setConfirmTargetId(null);
    setExpandedId(null);
  };

  const updateCategory = (placeId: string, category: string) => {
    updatePlace(placeId, { category });
  };

  const updateMemo = (placeId: string, memo: string) => {
    updatePlace(placeId, { memo });
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
    ? savedPlaces
    : savedPlaces.filter((p) => p.category === category);

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

            {/* 카테고리 필터 */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px", flexShrink: 0 }}>
              {["all", ...CATEGORY_LIST].map((cat) => {
                const active = category === cat;
                const color = CATEGORY_COLOR[cat] || "#000";
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold",
                      border: `1.5px solid ${active ? (cat === "all" ? "#000" : color) : "#ddd"}`,
                      background: active ? (cat === "all" ? "#000" : color) : "#fff",
                      color: active ? "#fff" : "#888",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {cat === "all" ? "전체" : `${getCategoryIcon(cat)} ${cat}`}
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
                  const isExpanded = expandedId === place.id;
                  return (
                    <div key={place.id} style={{ flexShrink: 0 }}>
                      {/* ── 카드 행 ── */}
                      <div
                        className="tl-box"
                        onClick={() => setExpandedId(isExpanded ? null : place.id)}
                        style={{
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          borderLeft: `4px solid ${color}`,
                          cursor: "pointer",
                          background: isExpanded ? "#fafafa" : "#fff",
                          transition: "background 0.15s",
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
                          {!isExpanded && place.memo && (
                            <p style={{ fontSize: "11px", color: "#bbb", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>
                              💭 {place.memo}
                            </p>
                          )}
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "bold", flexShrink: 0, color: color, padding: "2px 8px", border: `1.5px solid ${color}`, borderRadius: "10px" }}>
                          {place.category}
                        </span>
                        <span style={{ fontSize: "11px", color: "#bbb", flexShrink: 0, transition: "transform 0.15s", display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                      </div>

                      {/* ── 인라인 펼침 패널 ── */}
                      {isExpanded && (
                        <div style={{
                          padding: "14px 16px 16px",
                          background: "#fafafa",
                          borderLeft: `4px solid ${color}`,
                          borderTop: "1px solid #eee",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}>

                          {/* 카테고리 변경 */}
                          <div>
                            <p style={{ fontSize: "11px", fontWeight: "bold", color: "#999", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>카테고리</p>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {CATEGORY_LIST.map((cat) => {
                                const catColor = CATEGORY_COLOR[cat] || "#333";
                                const isActive = place.category === cat;
                                return (
                                  <button
                                    key={cat}
                                    onClick={(e) => { e.stopPropagation(); updateCategory(place.id, cat); }}
                                    style={{
                                      padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold",
                                      border: `1.5px solid ${isActive ? catColor : "#ddd"}`,
                                      background: isActive ? catColor : "#fff",
                                      color: isActive ? "#fff" : "#aaa",
                                      cursor: "pointer", transition: "all 0.15s",
                                    }}
                                  >
                                    {getCategoryIcon(cat)} {cat}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 메모 */}
                          <div>
                            <p style={{ fontSize: "11px", fontWeight: "bold", color: "#999", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>메모</p>
                            <textarea
                              value={place.memo || ""}
                              onChange={(e) => { e.stopPropagation(); updateMemo(place.id, e.target.value); }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="이 장소에 대한 메모를 남겨보세요..."
                              style={{
                                width: "100%", minHeight: "70px",
                                padding: "10px 12px",
                                border: "2px solid #e0e0e0", borderRadius: "6px",
                                fontSize: "13px", resize: "vertical",
                                fontFamily: "inherit", outline: "none",
                                background: "#fff", boxSizing: "border-box",
                                transition: "border-color 0.15s",
                              }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = "#000"; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; }}
                            />
                          </div>

                          {/* 삭제 */}
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            {confirmTargetId === place.id ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "12px", color: "#555" }}>정말 삭제할까요?</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); confirmRemove(); }}
                                  style={{ padding: "5px 12px", background: "#e53935", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
                                >
                                  삭제
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConfirmTargetId(null); }}
                                  style={{ padding: "5px 12px", background: "#fff", color: "#555", border: "1.5px solid #ddd", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); removePlace(place.id); }}
                                style={{ padding: "6px 14px", background: "#fff", color: "#e53935", border: "1.5px solid #e53935", borderRadius: "5px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
                                onMouseOver={(e) => { e.currentTarget.style.background = "#e53935"; e.currentTarget.style.color = "#fff"; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#e53935"; }}
                              >
                                🗑 삭제
                              </button>
                            )}
                          </div>
                        </div>
                      )}
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

            {selectedPlace && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "2px solid #000", padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "bold", color: CATEGORY_COLOR[selectedPlace.category] || "#333" }}>
                      {getCategoryIcon(selectedPlace.category)} {selectedPlace.category}
                    </span>
                    <span style={{ fontWeight: "bold", fontSize: "14px" }}>{selectedPlace.name}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>📍 {selectedPlace.address}</p>
                </div>
                <button
                  onClick={() => setSelectedPlace(null)}
                  style={{ padding: "6px 14px", background: "#fff", color: "#000", border: "2px solid #000", borderRadius: "5px", fontWeight: "bold", fontSize: "12px", cursor: "pointer", flexShrink: 0 }}
                >
                  닫기
                </button>
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
          padding: "10px 22px", borderRadius: "20px",
          fontSize: "13px", fontWeight: "bold",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          zIndex: 9999, pointerEvents: "none",
          animation: "fadeInUp 0.2s ease",
        }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </>
  );
};
export default DayAllView;