//src\features\workspace\components\schedule\DayDetailView.tsx

import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PlaceDetailModal from "../schedule/modal/PlaceDetailModal";
import AddPlaceModal from "../schedule/modal/AddPlaceModal";
import { useNaverMap } from "../../hooks/useNaverMap";
import { CATEGORY_COLOR, getCategoryIcon } from "../../hooks/schedule.constants";

interface PlaceInfo {
  name: string;
  time?: string;
  imageUrl?: string;
  address?: string;
  rating?: number;
  category?: string;
  description?: string;
  lat?: number;
  lng?: number;
}

interface TimelineNode {
  time: string;
  title: string;
  desc: string;
  travelMinutes?: number;
  travelPayment?: number;
  travelTransfer?: number;
  placeInfo?: PlaceInfo;
}

interface SavedPlace {
  id: string;
  name: string;
  category: string;
  address: string;
  rating?: number;
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

interface DayDetailViewProps {
  dayTitle: string;
  tripTitle: string;
  startDate: string;
  endDate: string;
  nodes: TimelineNode[];
  savedPlaces: SavedPlace[];
  dayKeys?: string[];
  storageError?: string | null;
  addNode: () => void;
  addNodeFromPlace: (place: {
    name: string;
    category?: string;
    address?: string;
    lat?: number;
    lng?: number;
    description?: string;
    rating?: number;
  }) => Promise<void>;
  addPlace: (place: Omit<SavedPlace, "id">) => Promise<void>;
  updateNode: (idx: number, field: string, value: string) => void;
  deleteNode: (idx: number) => void;
  reorderNodes: (fromIdx: number, toIdx: number) => void;
  moveNodeToDay: (idx: number, targetDay: string) => void;
}

const DayDetailView: React.FC<DayDetailViewProps> = ({
  dayTitle,
  tripTitle,
  startDate,
  nodes,
  savedPlaces,
  dayKeys = [],
  storageError = null,
  addNode,
  addNodeFromPlace,
  addPlace,
  updateNode,
  deleteNode,
  reorderNodes,
  moveNodeToDay,
}) => {
  const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null>(null);
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);

  const { mapLoaded, mapKey } = useNaverMap();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerByIdxRef = useRef<Record<number, any>>({});
  const polylineRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  const dragFromIdx = React.useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lockTooltipIdx, setLockTooltipIdx] = useState<number | null>(null);
  const [travelPopover, setTravelPopover] = useState<{ idx: number; top: number; left: number } | null>(null);

  // 현재 날짜 계산
  const currentDate = useMemo(() => {
    const dayMatch = dayTitle.match(/DAY\s*(\d+)/i);
    if (!dayMatch) return startDate;
    const dayNumber = parseInt(dayMatch[1], 10);
    const start = new Date(startDate);
    start.setDate(start.getDate() + (dayNumber - 1));
    return start.toISOString().split("T")[0];
  }, [dayTitle, startDate]);

  // 노드에서 좌표를 가진 장소만 추출
  // 1순위: placeInfo에 lat/lng 직접 포함 (AI 생성 일정)
  // 2순위: savedPlaces에서 이름으로 매칭 (수동 추가 노드)
  const mapPlaces = useMemo(() => {
    return nodes
      .filter((n) => n.placeInfo?.name)
      .map((n, idx) => {
        const info = n.placeInfo!;

        // 1순위: placeInfo에 좌표 직접 있는 경우
        if (info.lat != null && info.lng != null) {
          return {
            id: String(idx),
            name: info.name,
            category: info.category || "",
            address: info.address || "",
            lat: info.lat,
            lng: info.lng,
            rating: info.rating,
            _idx: idx,
            _time: n.time,
          };
        }

        // 2순위: savedPlaces에서 이름 매칭
        const matched = savedPlaces.find((sp) => sp.name === info.name)
          ?? savedPlaces.find((sp) =>
            info.name && (sp.name.includes(info.name) || info.name.includes(sp.name))
          );

        return matched && matched.lat != null && matched.lng != null
          ? { ...matched, _idx: idx, _time: n.time }
          : null;
      })
      .filter((p): p is SavedPlace & { _idx: number; _time: string } => p !== null && p.lat != null && p.lng != null);
  }, [nodes, savedPlaces]);

  // 오늘 지도에 실제로 등장하는 카테고리만 범례에 표시
  // (교통은 일반 선택 카테고리는 아니지만 출발지/복귀 지점 핀으로는 나올 수 있어서
  //  CATEGORY_LIST가 아니라 색상표에 있는 전체 카테고리 기준으로 필터링)
  const presentCategories = useMemo(
    () => Object.keys(CATEGORY_COLOR).filter((cat) => mapPlaces.some((p) => p.category === cat)),
    [mapPlaces]
  );

  // 지도 초기화 및 마커 그리기
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = mapPlaces.length > 0
        ? new window.naver.maps.LatLng(mapPlaces[0].lat!, mapPlaces[0].lng!)
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
    }

    drawMarkers(mapPlaces);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, mapPlaces]);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    markerByIdxRef.current = {};
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
    infoWindowRef.current?.close();
  };

  // 핀 클릭 / "지도에서 보기" 양쪽에서 재사용하는 정보창 오픈 로직
  const buildInfoHtml = (place: SavedPlace & { _time: string }) => {
    const color = CATEGORY_COLOR[place.category] || "#333";
    return `
      <div style="padding:12px 16px;min-width:180px;max-width:240px;font-family:inherit">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
          <span style="background:${color};color:#fff;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:bold">
            ${getCategoryIcon(place.category)} ${place.category}
          </span>
          ${place.rating ? `<span style="font-size:12px;color:#ff9800;font-weight:bold">⭐ ${place.rating}</span>` : ""}
        </div>
        <div style="font-size:11px;color:#888;margin-bottom:2px">${place._time}</div>
        <div style="font-weight:bold;font-size:14px;margin-bottom:4px">${place.name}</div>
        <div style="font-size:11px;color:#666">${place.address || ""}</div>
      </div>
    `;
  };

  const openPlaceInfo = (place: SavedPlace & { _time: string }, marker: any) => {
    infoWindowRef.current.setContent(buildInfoHtml(place));
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  };

  const drawMarkers = (places: (SavedPlace & { _idx: number; _time: string })[]) => {
    if (!mapInstanceRef.current || !window.naver) return;
    clearMarkers();

    if (!places.length) return;

    const renderPositions = deconflictPositions(places);
    const bounds = new window.naver.maps.LatLngBounds();
    const pathCoords: any[] = [];

    places.forEach((place, i) => {
      const { lat, lng } = renderPositions[i];
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
                ${i + 1}
              </div>
            </div>`,
          anchor: new window.naver.maps.Point(15, 30),
        },
        zIndex: 100,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        openPlaceInfo(place, marker);
      });

      markerByIdxRef.current[place._idx] = marker;
      bounds.extend(pos);
      pathCoords.push(pos);
      markersRef.current.push(marker);
    });

    // 방문 순서 경로선 — 실제 도로 경로가 아니라 동선 흐름 안내용 점선
    polylineRef.current = new window.naver.maps.Polyline({
      map: mapInstanceRef.current,
      path: pathCoords,
      strokeColor: "#888",
      strokeOpacity: 0.55,
      strokeWeight: 3,
      strokeStyle: "shortdash",
      zIndex: 50,
    });

    if (places.length === 1) {
      mapInstanceRef.current.setCenter(pathCoords[0]);
      mapInstanceRef.current.setZoom(15);
    } else {
      mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 40, bottom: 80, left: 40 });
    }
  };

  const handleNodeClick = (node: TimelineNode) => {
    if (node.placeInfo) {
      setSelectedPlace({ ...node.placeInfo, time: node.time });
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 0 }}>

        {/* ── 저장 오류 배너 ── */}
        {storageError && (
          <div style={{
            flexShrink: 0,
            marginBottom: "12px",
            padding: "10px 16px",
            background: "#ffebee",
            border: "2px solid #e53935",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#c62828",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            ⚠️ {storageError}
          </div>
        )}

        {/* ── 헤더 ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>{dayTitle}</h2>
            <p style={{ color: "#999", marginTop: "4px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
              {currentDate}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {isEditing && (
              <button
                onClick={() => setIsAddNodeModalOpen(true)}
                style={{ padding: "10px 20px", background: "#fff", color: "#000", border: "2px solid #000", fontWeight: "bold", fontSize: "14px", cursor: "pointer", borderRadius: "4px" }}
              >
                + 노드 추가
              </button>
            )}
            <button
              onClick={() => setIsEditing((v) => !v)}
              style={{
                padding: "10px 20px",
                background: isEditing ? "#000" : "#fff",
                color: isEditing ? "#fff" : "#000",
                border: "2px solid #000",
                fontWeight: "bold", fontSize: "14px", cursor: "pointer", borderRadius: "4px",
              }}
            >
              {isEditing ? "✓ 완료" : "✏️ 일정 수정하기"}
            </button>
          </div>
        </div>

        {/* ── 바디: 타임라인 + 지도 ── */}
        <div style={{ display: "flex", gap: "16px", flex: 1, minHeight: 0, overflow: "hidden" }}>

          {/* ── 왼쪽: 타임라인 노드 ── */}
          <div style={{ width: isEditing ? "640px" : "440px", flexShrink: 0, display: "flex", flexDirection: "column", minHeight: 0, transition: "width 0.25s ease" }}>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0" }}>
              {nodes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#bbb" }}>
                  <p style={{ fontSize: "28px", marginBottom: "8px" }}>📅</p>
                  <p style={{ fontSize: "13px" }}>아직 추가된 노드가 없습니다</p>
                </div>
              ) : (
                nodes.map((n, idx) => {
                  const color = CATEGORY_COLOR[n.placeInfo?.category ?? ""] || "#d0d0d0";
                  const hasCategory = !!n.placeInfo?.category;
                  const icon = hasCategory ? getCategoryIcon(n.placeInfo!.category!) : null;
                  const isFixed = n.placeInfo?.category === "교통" || n.placeInfo?.category === "숙소";

                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "stretch", minWidth: 0, overflow: "hidden" }}>
                      {/* 시간 + 다음 장소까지 이동시간 */}
                      <div style={{
                        width: "54px",
                        flexShrink: 0,
                        paddingTop: "15px",
                        textAlign: "right",
                        paddingRight: "12px",
                        fontSize: "11px",
                        fontFamily: "var(--font-mono)",
                        color: "#aaa",
                        lineHeight: 1,
                      }}>
                        {n.time}

                        {n.travelMinutes != null && n.travelMinutes > 0 && (
                          <div style={{ marginTop: "5px" }}>
                            {n.travelPayment != null || n.travelTransfer != null ? (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTravelPopover((prev) =>
                                    prev?.idx === idx
                                      ? null
                                      : { idx, top: rect.bottom + 6, left: rect.left }
                                  );
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "2px",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  color: "#1976d2",
                                  cursor: "pointer",
                                  textDecoration: "underline dotted",
                                  textDecorationColor: "#90caf9",
                                }}
                              >
                                🚇{n.travelMinutes}분
                              </span>
                            ) : (
                              <span style={{ fontSize: "10px", color: "#bbb" }}>
                                +{n.travelMinutes}분
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 타임라인 축 */}
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "20px",
                        flexShrink: 0,
                      }}>
                        <div style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: hasCategory ? color : "#ddd",
                          border: `2px solid ${hasCategory ? color : "#ccc"}`,
                          marginTop: "14px",
                          flexShrink: 0,
                          zIndex: 1,
                          boxShadow: hasCategory ? `0 0 0 3px ${color}22` : "none",
                        }} />
                        {idx < nodes.length - 1 && (
                          <div style={{
                            width: "2px",
                            flex: 1,
                            minHeight: "24px",
                            background: "linear-gradient(to bottom, #e0e0e0, #efefef)",
                            marginTop: "4px",
                          }} />
                        )}
                      </div>

                      {/* 카드 */}
                      <div
                        className="tl-box"
                        draggable={isEditing && !isFixed}
                        onDragStart={() => { if (isEditing && !isFixed) dragFromIdx.current = idx; }}
                        onDragOver={(e) => { if (isEditing && !isFixed) { e.preventDefault(); setDragOverIdx(idx); } }}
                        onDragLeave={() => setDragOverIdx(null)}
                        onDrop={() => {
                          if (dragFromIdx.current !== null && dragFromIdx.current !== idx) {
                            reorderNodes(dragFromIdx.current, idx);
                          }
                          dragFromIdx.current = null;
                          setDragOverIdx(null);
                        }}
                        onDragEnd={() => { dragFromIdx.current = null; setDragOverIdx(null); }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          marginLeft: "12px",
                          marginBottom: "12px",
                          padding: "13px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          cursor: (isEditing && !isFixed) ? "grab" : "default",
                          background: (dragOverIdx === idx && !isFixed) ? "#f0f0f0" : "#fff",
                          borderTop: (dragOverIdx === idx && !isFixed) ? "2px dashed #000" : "1px solid #eee",
                          borderRight: (dragOverIdx === idx && !isFixed) ? "2px dashed #000" : "1px solid #eee",
                          borderBottom: (dragOverIdx === idx && !isFixed) ? "2px dashed #000" : "1px solid #eee",
                          borderLeft: `4px solid ${hasCategory ? color : "#e0e0e0"}`,
                          borderRadius: "0 6px 6px 0",
                          transition: "background 0.1s, border 0.1s",
                          userSelect: "none",
                        }}
                      >
                        {/* 드래그 핸들 — 편집 모드 + 고정 아닐 때만 */}
                        {isEditing && !isFixed && (
                          <span style={{ fontSize: "14px", color: "#ccc", flexShrink: 0, cursor: "grab" }}>⠿</span>
                        )}
                        {/* 고정 노드 표시 */}
                        {isEditing && isFixed && (
                          <span
                            style={{ position: "relative", fontSize: "11px", color: "#bbb", flexShrink: 0, cursor: "help" }}
                            onMouseEnter={() => setLockTooltipIdx(idx)}
                            onMouseLeave={() => setLockTooltipIdx(null)}
                          >
                            🔒
                            {lockTooltipIdx === idx && (
                              <span style={{
                                position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
                                transform: "translateX(-50%)",
                                background: "#333", color: "#fff",
                                padding: "5px 10px", borderRadius: "4px",
                                fontSize: "11px", whiteSpace: "nowrap",
                                pointerEvents: "none", zIndex: 100,
                              }}>
                                {n.placeInfo?.category === "숙소" ? "숙소" : "출발지"}는 순서 변경이 불가합니다
                              </span>
                            )}
                          </span>
                        )}

                        {icon && (
                          <span style={{ fontSize: "18px", flexShrink: 0, lineHeight: 1 }}>{icon}</span>
                        )}

                        {/* 클릭 시 상세 모달 / 편집 모드 시 input */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {isEditing && !isFixed ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <input
                                  type="text"
                                  value={n.time}
                                  onChange={(e) => updateNode(idx, "time", e.target.value)}
                                  placeholder="HH:MM"
                                  style={{ width: "64px", padding: "4px 8px", border: "1.5px solid #ddd", borderRadius: "4px", fontSize: "12px", fontFamily: "var(--font-mono)" }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <input
                                  type="text"
                                  value={n.title}
                                  onChange={(e) => updateNode(idx, "title", e.target.value)}
                                  placeholder="장소명"
                                  style={{ flex: 1, padding: "4px 8px", border: "1.5px solid #ddd", borderRadius: "4px", fontSize: "13px", fontWeight: "600" }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <input
                                type="text"
                                value={n.desc}
                                onChange={(e) => updateNode(idx, "desc", e.target.value)}
                                placeholder="설명 (주소 등)"
                                style={{ width: "100%", padding: "4px 8px", border: "1.5px solid #ddd", borderRadius: "4px", fontSize: "12px", color: "#888", boxSizing: "border-box" }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ) : (
                            <div
                              style={{ cursor: n.placeInfo ? "pointer" : "default" }}
                              onClick={() => { if (!isEditing) handleNodeClick(n); }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#111" }}>
                                  {n.title}
                                </h3>
                                {n.placeInfo?.rating && (
                                  <span style={{ fontSize: "11px", color: "#ff9800", flexShrink: 0 }}>⭐ {n.placeInfo.rating}</span>
                                )}
                              </div>
                              <p style={{ fontSize: "12px", color: "#aaa", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.5 }}>
                                {n.desc}
                              </p>
                            </div>
                          )}
                        </div>

                        {n.placeInfo?.category && (
                          <span style={{ fontSize: "11px", fontWeight: "600", flexShrink: 0, color, padding: "3px 10px", border: `1.5px solid ${color}`, borderRadius: "20px", background: `${color}10` }}>
                            {n.placeInfo.category}
                          </span>
                        )}

                        {/* 날짜 이동 + 삭제 — 편집 모드 + 고정 아닐 때만 */}
                        {isEditing && !isFixed && (
                          <>
                            {dayKeys.filter((d) => d !== dayTitle).length > 0 && (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) moveNodeToDay(idx, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{ padding: "3px 6px", border: "1.5px solid #ddd", borderRadius: "4px", fontSize: "11px", color: "#888", cursor: "pointer", background: "#fff", flexShrink: 0 }}
                              >
                                <option value="">이동 ▸</option>
                                {dayKeys.filter((d) => d !== dayTitle).map((d) => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNode(idx); }}
                              style={{ padding: "3px 8px", background: "#fff", color: "#ccc", border: "1.5px solid #eee", borderRadius: "4px", fontSize: "12px", cursor: "pointer", flexShrink: 0, lineHeight: 1 }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "#e53935"; e.currentTarget.style.borderColor = "#e53935"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "#ccc"; e.currentTarget.style.borderColor = "#eee"; }}
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
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

            {mapLoaded && mapPlaces.length === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.9)", color: "#bbb" }}>
                <p style={{ fontSize: "32px", marginBottom: "10px" }}>🗺️</p>
                <p style={{ fontSize: "13px" }}>표시할 장소가 없습니다</p>
              </div>
            )}

            {/* 좌표 없는 장소 안내 */}
            {mapLoaded && mapPlaces.length > 0 && mapPlaces.length < nodes.filter(n => n.placeInfo?.name).length && (
              <div style={{ position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.65)", color: "#fff", padding: "5px 14px", borderRadius: "14px", fontSize: "11px", pointerEvents: "none", whiteSpace: "nowrap" }}>
                📍 {mapPlaces.length}/{nodes.filter(n => n.placeInfo?.name).length}개 표시 중 (좌표 없는 장소 제외)
              </div>
            )}

            {/* 카테고리 색상 범례 — 오늘 등장하는 카테고리만 표시 */}
            {mapLoaded && presentCategories.length > 0 && (
              <div style={{
                position: "absolute", left: "12px", bottom: "12px",
                background: "#fff", border: "1px solid #ddd", borderRadius: "8px",
                padding: "8px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                display: "flex", flexDirection: "column", gap: "5px",
              }}>
                {presentCategories.map((cat) => (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#555" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: CATEGORY_COLOR[cat], flexShrink: 0 }} />
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 장소 상세 모달 */}
      {selectedPlace && (
        <PlaceDetailModal
          placeInfo={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onViewOnMap={() => {
            const matched = mapPlaces.find((p) => p.name === selectedPlace.name);
            if (matched) {
              if (mapInstanceRef.current && matched.lat != null && matched.lng != null) {
                mapInstanceRef.current.setCenter(
                  new window.naver.maps.LatLng(matched.lat, matched.lng)
                );
                mapInstanceRef.current.setZoom(16);
              }
              const marker = markerByIdxRef.current[matched._idx];
              if (marker) openPlaceInfo(matched, marker);
            }
            setSelectedPlace(null);
          }}
        />
      )}

      {/* 이동시간 요금/환승 팝오버 — 스크롤 컨테이너의 overflow 클리핑을 피하려고 body에 포탈로 렌더 */}
      {travelPopover && nodes[travelPopover.idx] && createPortal(
        <>
          <div
            onClick={() => setTravelPopover(null)}
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: travelPopover.top,
              left: travelPopover.left,
              background: "#fff",
              border: "1.5px solid #333",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "12px",
              whiteSpace: "nowrap",
              textAlign: "left",
              zIndex: 9999,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {nodes[travelPopover.idx].travelPayment != null && (
              <div style={{
                display: "flex", alignItems: "center", gap: "6px", color: "#555",
                marginBottom: nodes[travelPopover.idx].travelTransfer != null ? "4px" : 0,
              }}>
                💰 {nodes[travelPopover.idx].travelPayment!.toLocaleString()}원
              </div>
            )}
            {nodes[travelPopover.idx].travelTransfer != null && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#555" }}>
                🔁 환승 {nodes[travelPopover.idx].travelTransfer}회
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      {/* 노드 추가용 장소 검색 모달 */}
      {isAddNodeModalOpen && (
        <AddPlaceModal
          onClose={() => setIsAddNodeModalOpen(false)}
          existingPlaces={savedPlaces}
          onAddPlace={async (place) => {
            // 1. 노드로 추가
            await addNodeFromPlace({
              name: place.name,
              category: place.category,
              address: place.address,
              lat: place.lat,
              lng: place.lng,
              description: place.description,
              rating: place.rating,
            });
            // 2. DAY ALL 장소 목록에도 추가 (중복 체크는 AddPlaceModal에서)
            const alreadyInPlaces = savedPlaces.some(
              (p) => p.name === place.name && p.lat === place.lat
            );
            if (!alreadyInPlaces) {
              await addPlace({
                name: place.name,
                category: place.category,
                address: place.address,
                lat: place.lat,
                lng: place.lng,
              });
            }
            setIsAddNodeModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default DayDetailView;