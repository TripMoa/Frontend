//src\features\workspace\components\schedule\DayDetailView.tsx

import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import AddPlaceModal from "../schedule/modal/AddPlaceModal";
import SavedPlacePickerModal from "../schedule/modal/SavedPlacePickerModal";
import TransitDetailModal from "../schedule/modal/TransitDetailModal";
import DayComputeBanner from "./DayComputeBanner";
import StopDetailPanel from "./StopDetailPanel";
import TimelineBoard from "./TimelineBoard";
import type { DayInfo, ScheduleWarning } from "../../hooks/useTimeline";
import type { TransitResult } from "../schedule/modal/TransitDetailModal";
import { getTransitRoutes } from "../../../../api/schedule.api";
import { useNaverMap } from "../../hooks/useNaverMap";
import { CATEGORY_COLOR, getCategoryIcon } from "../../hooks/schedule.constants";
import type { NaverMapObject } from "../../hooks/naverMapTypes";
import { apiMessage } from "../../hooks/apiError";
import type { VoucherResponse } from "../../../../types/voucher.types";
import type { ExpenseItem } from "../../hooks/expense.ui.types";

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
  id?: number;
  time: string;
  stayMinutes?: number;
  endTime?: string;
  pinnedTime?: string;
  memo?: string;
  warnings?: ScheduleWarning[];
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
  /** 일차별 일정 노드(제목·좌표) — "저장한 장소에서 고르기"에서 어느 날에 있는지 표시 */
  scheduledByDay?: Record<string, { title: string; lat?: number; lng?: number }[]>;
  storageError?: string | null;
  /** 이 날의 자동 시각 계산 상태·설정·경고 (서버에 일차 행이 없으면 undefined) */
  dayInfo?: DayInfo;
  setNodeStay?: (idx: number, minutes: number) => Promise<boolean>;
  setNodePin?: (idx: number, time: string | null) => Promise<boolean>;
  setDayAutoCompute?: (enabled: boolean) => Promise<boolean>;
  updateDaySettings?: (patch: { startTime?: string; endTime?: string; transportMode?: string }) => Promise<boolean>;
  /** 노드의 장소 바꾸기 — 순서·머무는 시간은 그대로. 실패하면 던진다 */
  /** 메모 저장(멤버 공용) — 성공 여부를 돌려준다 */
  setNodeMemo?: (idx: number, memo: string) => Promise<boolean>;
  replaceNodePlace?: (idx: number, place: {
    name: string;
    category?: string;
    address?: string;
    lat?: number;
    lng?: number;
    description?: string;
    rating?: number;
  }) => Promise<void>;
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
  vouchers?: VoucherResponse[];
  onAddVoucherForItem?: (scheduleItemId: number) => void;
  expenses?: ExpenseItem[];
  onAddExpenseForItem?: (scheduleItemId: number) => void;
}

const DayDetailView: React.FC<DayDetailViewProps> = ({
  dayTitle,
  startDate,
  nodes,
  savedPlaces,
  dayKeys = [],
  scheduledByDay = {},
  storageError = null,
  dayInfo,
  setNodeStay,
  setNodePin,
  setDayAutoCompute,
  updateDaySettings,
  replaceNodePlace,
  setNodeMemo,
  addNodeFromPlace,
  addPlace,
  updateNode,
  deleteNode,
  reorderNodes,
  moveNodeToDay,
  vouchers = [],
  onAddVoucherForItem,
  expenses = [],
  onAddExpenseForItem,
}) => {
  // 열려 있는 정거장 상세 — 노드 id로 잡아서 순서가 바뀌어도 같은 노드를 가리키고, 다른 일차로 가면 자동으로 닫힌다
  const [sel, setSel] = useState<{ day: string; id: number } | null>(null);
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  // 장소 추가는 저장한 장소에서 먼저 고르고(picker), 없으면 새로 검색(AddPlaceModal)한다
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // 장소 바꾸기 중인 노드 — 있으면 같은 선택창·검색창이 "추가"가 아니라 "바꾸기"로 동작한다
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null);
  // 자동 계산이 켜진 날은 목록 / 시간표 두 가지로 볼 수 있다
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  const { mapLoaded, mapKey } = useNaverMap();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<NaverMapObject>(null);
  const markersRef = useRef<NaverMapObject[]>([]);
  const markerByIdxRef = useRef<Record<number, NaverMapObject>>({});
  const polylineRef = useRef<NaverMapObject>(null);
  const focusLineRef = useRef<NaverMapObject>(null);
  const infoWindowRef = useRef<NaverMapObject>(null);

  const dragFromIdx = React.useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const autoOn = !!dayInfo?.autoCompute;
  const showBoard = autoOn && viewMode === "board" && nodes.length > 0;
  const overWarning = autoOn ? dayInfo?.warnings.find((w) => w.code === "over_end") : undefined;

  const startReplace = (idx: number) => {
    setReplaceIdx(idx);
    // 저장한 장소가 하나도 없으면 고를 게 없으니 바로 검색으로
    if (savedPlaces.some((p) => p.category !== "숙소" && p.category !== "교통")) setIsPickerOpen(true);
    else setIsAddNodeModalOpen(true);
  };
  const [lockTooltipIdx, setLockTooltipIdx] = useState<number | null>(null);
  const [travelPopover, setTravelPopover] = useState<{ idx: number; top: number; left: number } | null>(null);
  // 구간 실시간 대중교통 경로 패널 — 결과는 이 상태에만 두고 저장하지 않는다(닫으면 사라짐)
  const [transitView, setTransitView] = useState<{
    fromIdx: number;
    status: "loading" | "done" | "error";
    result?: TransitResult;
    errorMessage?: string;
  } | null>(null);

  const openTransit = async (idx: number) => {
    const from = nodes[idx];
    const to = nodes[idx + 1];
    setTravelPopover(null);
    if (!from?.id || !to?.id) return;
    if (transitView?.status === "loading") return; // 조회 중 중복 호출 방지(호출 1건 = 하루 한도 1건)
    setTransitView({ fromIdx: idx, status: "loading" });
    try {
      const { data } = await getTransitRoutes(from.id, to.id);
      setTransitView({ fromIdx: idx, status: "done", result: data as TransitResult });
    } catch (e) {
      setTransitView({
        fromIdx: idx,
        status: "error",
        errorMessage: apiMessage(e, "실시간 경로를 가져오지 못했어요. 잠시 후 다시 시도해주세요."),
      });
    }
  };

  // 이 구간(idx → idx+1)을 실시간 조회할 수 있는지: 두 노드가 저장돼 있고 좌표가 있어야 한다
  const canLookupTransit = (idx: number) => {
    const a = nodes[idx];
    const b = nodes[idx + 1];
    return !!(
      a?.id && b?.id &&
      a.placeInfo?.lat != null && a.placeInfo?.lng != null &&
      b.placeInfo?.lat != null && b.placeInfo?.lng != null
    );
  };

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

  const openPlaceInfo = (place: SavedPlace & { _time: string }, marker: NaverMapObject) => {
    infoWindowRef.current.setContent(buildInfoHtml(place));
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  };

  const drawMarkers = (places: (SavedPlace & { _idx: number; _time: string })[]) => {
    if (!mapInstanceRef.current || !window.naver) return;
    clearMarkers();

    if (!places.length) return;

    const renderPositions = deconflictPositions(places);
    const bounds = new window.naver.maps.LatLngBounds();
    const pathCoords: NaverMapObject[] = [];

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

  const foundIdx = sel && sel.day === dayTitle ? nodes.findIndex((n) => n.id === sel.id) : -1;
  const selectedIdx = foundIdx >= 0 ? foundIdx : null;

  const selectNode = (node: TimelineNode) => {
    if (node.id != null) setSel({ day: dayTitle, id: node.id });
  };
  const navigateStop = (delta: number) => {
    const target = nodes[(selectedIdx ?? 0) + delta];
    if (target) selectNode(target);
  };

  // 정거장 상세가 열리면 그 장소를 지도 중심에 두고 앞뒤 구간만 진하게 잇는다. 닫히면 전체가 보이게 되돌린다.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!mapLoaded || !map || !window.naver) return;
    focusLineRef.current?.setMap(null);
    focusLineRef.current = null;

    if (selectedIdx == null) {
      const positions = Object.values(markerByIdxRef.current).map((m: NaverMapObject) => m.getPosition());
      if (positions.length > 1) {
        const bounds = new window.naver.maps.LatLngBounds();
        positions.forEach((pos: NaverMapObject) => bounds.extend(pos));
        map.fitBounds(bounds, { top: 60, right: 40, bottom: 80, left: 40 });
      }
      return;
    }

    infoWindowRef.current?.close();
    const marker = markerByIdxRef.current[selectedIdx];
    if (!marker) return;
    const path = [selectedIdx - 1, selectedIdx, selectedIdx + 1]
      .map((i) => markerByIdxRef.current[i]?.getPosition())
      .filter(Boolean);
    if (path.length > 1) {
      focusLineRef.current = new window.naver.maps.Polyline({
        map, path, strokeColor: "#000", strokeOpacity: 0.85, strokeWeight: 5, zIndex: 60,
      });
    }
    map.setCenter(marker.getPosition());
    map.setZoom(15);
  }, [selectedIdx, mapLoaded, mapPlaces]);

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
                onClick={() => {
                  // 저장한 장소가 하나도 없으면 고를 게 없으니 바로 검색으로
                  const hasCandidates = savedPlaces.some((p) => p.category !== "숙소" && p.category !== "교통");
                  if (hasCandidates) setIsPickerOpen(true);
                  else setIsAddNodeModalOpen(true);
                }}
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

        {/* ── 시각 자동 계산 안내·설정 — 일정 수정 중에만 보인다 ── */}
        {isEditing && setDayAutoCompute && updateDaySettings && (
          <DayComputeBanner
            dayTitle={dayTitle}
            dayInfo={dayInfo}
            nodes={nodes}
            otherDays={dayKeys.filter((d) => d !== dayTitle)}
            isEditing={isEditing}
            onToggleAuto={setDayAutoCompute}
            onSettings={updateDaySettings}
            onMoveNode={moveNodeToDay}
          />
        )}

        {/* 일반 보기에서도 종료 시간 초과는 작게 알린다 (정리는 일정 수정하기에서) */}
        {!isEditing && overWarning && (
          <div style={{ flexShrink: 0, marginBottom: "10px", padding: "6px 12px", background: "#fff3e0", border: "1px solid #ffb74d", borderRadius: "6px", fontSize: "12px", color: "#e65100" }}>
            ⚠️ {overWarning.message} <span style={{ color: "#bf7a3a" }}>— ‘일정 수정하기’에서 정리할 수 있어요</span>
          </div>
        )}

        {/* ── 바디: 타임라인 + 지도 ── */}
        <div style={{ display: "flex", gap: "16px", flex: 1, minHeight: 0, overflow: "hidden" }}>

          {/* ── 왼쪽: 타임라인 노드 ── */}
          <div style={{ width: isEditing ? "640px" : "440px", flexShrink: 0, display: "flex", flexDirection: "column", minHeight: 0, transition: "width 0.25s ease" }}>
            {selectedIdx != null && nodes[selectedIdx] && setNodeStay && setNodePin && setNodeMemo ? (
              <StopDetailPanel
                key={nodes[selectedIdx].id}
                node={nodes[selectedIdx]}
                idx={selectedIdx}
                total={nodes.length}
                dayTitle={dayTitle}
                dayInfo={dayInfo}
                isEditing={isEditing}
                prev={nodes[selectedIdx - 1]}
                next={nodes[selectedIdx + 1]}
                otherDays={dayKeys.filter((d) => d !== dayTitle)}
                vouchers={nodes[selectedIdx].id != null ? vouchers.filter((v) => v.scheduleItemId === nodes[selectedIdx].id) : []}
                expenses={nodes[selectedIdx].id != null ? expenses.filter((e) => e.scheduleItemId === nodes[selectedIdx].id) : []}
                canTransit={canLookupTransit}
                onTransit={(from) => void openTransit(from)}
                onBack={() => setSel(null)}
                onNav={navigateStop}
                onStay={(m) => setNodeStay(selectedIdx, m)}
                onPin={(t) => setNodePin(selectedIdx, t)}
                onTime={(v) => updateNode(selectedIdx, "time", v)}
                onMemo={(m) => setNodeMemo(selectedIdx, m)}
                onReplace={() => startReplace(selectedIdx)}
                onMove={(day) => moveNodeToDay(selectedIdx, day)}
                onDelete={() => deleteNode(selectedIdx)}
                onAddVoucher={
                  nodes[selectedIdx].id != null && onAddVoucherForItem
                    ? () => onAddVoucherForItem(nodes[selectedIdx].id!)
                    : undefined
                }
                onAddExpense={
                  nodes[selectedIdx].id != null && onAddExpenseForItem
                    ? () => onAddExpenseForItem(nodes[selectedIdx].id!)
                    : undefined
                }
              />
            ) : (
            <>
            {autoOn && nodes.length > 0 && (
              <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexShrink: 0 }}>
                {([["list", "☰ 목록"], ["board", "🕒 시간표"]] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      padding: "4px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer", borderRadius: "14px",
                      border: "1.5px solid #000", background: viewMode === mode ? "#000" : "#fff", color: viewMode === mode ? "#fff" : "#000",
                    }}
                  >
                    {label}
                  </button>
                ))}
                {showBoard && isEditing && (
                  <span style={{ alignSelf: "center", fontSize: "11px", color: "#999" }}>
                    카드를 끌면 순서가, 아래 손잡이를 끌면 머무는 시간이 바뀌어요
                  </span>
                )}
              </div>
            )}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0" }}>
              {showBoard && setNodeStay && setNodePin ? (
                <TimelineBoard
                  nodes={nodes}
                  dayInfo={dayInfo}
                  isEditing={isEditing}
                  onReorder={reorderNodes}
                  onStay={setNodeStay}
                  onPin={setNodePin}
                  onOpen={selectNode}
                />
              ) : nodes.length === 0 ? (
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
                        {autoOn && n.pinnedTime && <span title="이 시각에 고정" style={{ marginRight: "2px" }}>📌</span>}
                        {n.time}
                        {autoOn && n.endTime && (n.stayMinutes ?? 0) > 0 && (
                          <div style={{ marginTop: "3px", fontSize: "10px", color: "#ccc" }}>~{n.endTime}</div>
                        )}

                        {n.travelMinutes != null && n.travelMinutes > 0 && (
                          <div style={{ marginTop: "5px" }}>
                            {idx < nodes.length - 1 ? (
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
                                {n.travelPayment != null || n.travelTransfer != null ? "🚇" : "+"}{n.travelMinutes}분
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

                        {/* 카드를 누르면 정거장 상세가 열린다 — 시각·머무는 시간·장소 바꾸기·이동·삭제·메모는 거기서 한다 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ cursor: "pointer" }} onClick={() => selectNode(n)}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                              <h3 style={{ fontSize: "14px", fontWeight: "700", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#111" }}>
                                {n.title}
                              </h3>
                              {n.memo && <span title="메모가 있어요" style={{ fontSize: "11px", flexShrink: 0 }}>📝</span>}
                            </div>
                            <p style={{ fontSize: "12px", color: "#aaa", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.5 }}>
                              {n.desc}
                            </p>
                            {autoOn && (n.warnings ?? []).map((w, wi) => (
                              <p key={wi} style={{ fontSize: "11px", color: "#e65100", margin: "3px 0 0", lineHeight: 1.4 }}>
                                ⚠️ {w.message}
                              </p>
                            ))}
                          </div>
                        </div>

                        {n.placeInfo?.category && (
                          <span style={{ fontSize: "11px", fontWeight: "600", flexShrink: 0, color, padding: "3px 10px", border: `1.5px solid ${color}`, borderRadius: "20px", background: `${color}10` }}>
                            {n.placeInfo.category}
                          </span>
                        )}

                        <span style={{ color: "#ccc", fontSize: "16px", flexShrink: 0 }}>›</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </>
            )}
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
            <div style={{ color: "#333", fontWeight: 600, marginBottom: "6px" }}>
              이동 약 {nodes[travelPopover.idx].travelMinutes}분 <span style={{ fontWeight: 400, color: "#999" }}>(추정)</span>
            </div>
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
            {canLookupTransit(travelPopover.idx) ? (
              <>
                <button
                  onClick={() => void openTransit(travelPopover.idx)}
                  style={{
                    marginTop: "8px", width: "100%", padding: "6px 10px", background: "#000", color: "#fff",
                    border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", cursor: "pointer",
                  }}
                >
                  실제 대중교통 경로 확인
                </button>
                <div style={{ marginTop: "4px", fontSize: "10px", color: "#aaa" }}>
                  하루 조회 횟수에 한도가 있어요
                </div>
              </>
            ) : (
              <div style={{ marginTop: "6px", fontSize: "11px", color: "#aaa" }}>
                좌표가 없는 장소가 있어 경로를 조회할 수 없어요
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      {/* 구간 실시간 대중교통 경로 (ODsay) */}
      {transitView && nodes[transitView.fromIdx] && nodes[transitView.fromIdx + 1] && (
        <TransitDetailModal
          fromName={nodes[transitView.fromIdx].placeInfo?.name ?? nodes[transitView.fromIdx].title}
          toName={nodes[transitView.fromIdx + 1].placeInfo?.name ?? nodes[transitView.fromIdx + 1].title}
          from={{ lat: nodes[transitView.fromIdx].placeInfo!.lat!, lng: nodes[transitView.fromIdx].placeInfo!.lng! }}
          to={{ lat: nodes[transitView.fromIdx + 1].placeInfo!.lat!, lng: nodes[transitView.fromIdx + 1].placeInfo!.lng! }}
          estimateMinutes={nodes[transitView.fromIdx].travelMinutes}
          status={transitView.status}
          result={transitView.result}
          errorMessage={transitView.errorMessage}
          onClose={() => setTransitView(null)}
        />
      )}

      {/* 저장한 장소에서 고르기 (기본) */}
      {isPickerOpen && (
        <SavedPlacePickerModal
          dayTitle={dayTitle}
          savedPlaces={savedPlaces}
          scheduledByDay={scheduledByDay}
          currentNodes={nodes.map((n) => ({ title: n.title, lat: n.placeInfo?.lat, lng: n.placeInfo?.lng }))}
          replacing={replaceIdx != null && nodes[replaceIdx] ? { title: nodes[replaceIdx].title } : undefined}
          onAdd={async (place) => {
            const picked = {
              name: place.name,
              category: place.category,
              address: place.address,
              lat: place.lat,
              lng: place.lng,
              rating: place.rating,
            };
            if (replaceIdx != null && replaceNodePlace) await replaceNodePlace(replaceIdx, picked);
            else await addNodeFromPlace(picked);
          }}
          onSearchNew={() => {
            setIsPickerOpen(false);
            setIsAddNodeModalOpen(true);
          }}
          onClose={() => { setIsPickerOpen(false); setReplaceIdx(null); }}
        />
      )}

      {/* 노드 추가용 장소 검색 모달 */}
      {isAddNodeModalOpen && (
        <AddPlaceModal
          onBackToSaved={
            savedPlaces.some((p) => p.category !== "숙소" && p.category !== "교통")
              ? () => {
                  setIsAddNodeModalOpen(false);
                  setIsPickerOpen(true);
                }
              : undefined
          }
          onClose={() => { setIsAddNodeModalOpen(false); setReplaceIdx(null); }}
          // "이미 추가됨" 기준은 저장된 장소 전체가 아니라 "이 날 일정에 이미 있는 장소"다.
          // 전체를 기준으로 하면 저장은 돼 있지만 일정에 못 들어간 장소(AI가 제외한 것 등)를
          // 이 화면에서 다시 넣을 수 없어서, 직접 추가하라는 안내가 막다른 길이 된다.
          existingPlaces={nodes
            .filter((n) => n.placeInfo?.name)
            .map((n, idx) => ({
              id: `day-node-${idx}`,
              name: n.placeInfo!.name,
              category: n.placeInfo!.category ?? "",
              address: n.placeInfo!.address ?? "",
              // 새로고침 뒤에는 수동 추가 노드에 좌표가 저장돼 있지 않아서 저장된 장소에서 보충
              lat: n.placeInfo!.lat ?? savedPlaces.find((sp) => sp.name === n.placeInfo!.name)?.lat,
            }))}
          onAddPlace={async (place) => {
            // 1. 노드로 추가 (장소 바꾸기 중이면 그 노드의 장소를 교체)
            const picked = {
              name: place.name,
              category: place.category,
              address: place.address,
              lat: place.lat,
              lng: place.lng,
              description: place.description,
              rating: place.rating,
            };
            if (replaceIdx != null && replaceNodePlace) await replaceNodePlace(replaceIdx, picked);
            else await addNodeFromPlace(picked);
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
            setReplaceIdx(null);
          }}
        />
      )}
    </>
  );
};

export default DayDetailView;