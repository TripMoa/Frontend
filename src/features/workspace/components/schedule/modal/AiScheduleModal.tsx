// src/features/workspace/components/schedule/modal/AiScheduleModal.tsx

import React, { useState, useEffect, useMemo } from "react";
import "../../../styles/modals.css";
import {
  CATEGORY_TO_BACKEND,
  TRANSPORT_TO_BACKEND,
  PACE_TO_BACKEND,
  STORAGE_KEYS,
} from "../../../hooks/schedule.constants";

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

interface HotelSetting {
  name: string;
  lat?: number;
  lng?: number;
  address: string;
  checkInDay: number;
  checkOutDay: number;
}

interface DeparturePointSetting {
  name: string;
  lat?: number;
  lng?: number;
  address: string;
  day: number;
  isReturnPoint: boolean;
}

interface PinnedPlaceSetting {
  placeId: string;
  day: number;
  time: string;
}

interface AiScheduleSettings {
  startTime: string;
  endTime: string;
  transportMode: "walk" | "public" | "car";
  includeMeals: boolean;
  priority: "efficiency" | "relaxed" | "balanced";
  pinnedPlaces: PinnedPlaceSetting[];
  hotels: HotelSetting[];
  departurePoints: DeparturePointSetting[];
}

export interface TimelineNode {
  time: string;
  title: string;
  desc: string;
  placeInfo?: {
    name: string;
    address?: string;
    category?: string;
    description?: string;
    memo?: string;
    imageUrl?: string;
    rating?: number;
  };
}

interface AiScheduleModalProps {
  onClose: () => void;
  onGenerate: (
    settings: AiScheduleSettings,
    generatedSchedule: Record<string, TimelineNode[]>,
    dayKeys: string[]
  ) => void;
  savedPlaces: Place[];
  startDate: string;
  endDate: string;
  /** 모달 안에서 바로 장소를 추가할 수 있도록 부모의 핸들러를 받음 */
  onAddPlace: (place: Place) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function calcNDays(start: string, end: string): number {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  } catch {
    return 1;
  }
}

const LOADING_STEPS = [
  { icon: "🗺️", text: "장소 데이터 분석 중...", duration: 1200 },
  { icon: "📐", text: "최적 경로 계산 중...", duration: 1500 },
  { icon: "⏰", text: "시간표 배분 중...", duration: 1200 },
  { icon: "✨", text: "일정 마무리 중...", duration: 800 },
];

const AiScheduleModal: React.FC<AiScheduleModalProps> = ({
  onClose,
  onGenerate,
  savedPlaces,
  startDate,
  endDate,
  onAddPlace,
}) => {
  const [settings, setSettings] = useState<AiScheduleSettings>({
    startTime: "09:00",
    endTime: "20:00",
    transportMode: "public",
    includeMeals: true,
    priority: "balanced",
    pinnedPlaces: [],
    hotels: [],
    departurePoints: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStartedAt, setLoadingStartedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // pin 시간 충돌 경고 (생성 후 표시)
  const [pinWarnings, setPinWarnings] = useState<string[]>([]);

  // ─── 실시간 유효성 검사 ──────────────────────────────────
  const nDays = calcNDays(startDate, endDate);

  const validPlaces = useMemo(
    () => savedPlaces.filter((p) => p.lat != null && p.lng != null),
    [savedPlaces]
  );

  const departureNames = useMemo(
    () =>
      new Set(
        settings.departurePoints.map((dp) => dp.name.trim()).filter(Boolean)
      ),
    [settings.departurePoints]
  );

  const visitPlaces = useMemo(
    () =>
      validPlaces.filter(
        (p) => p.category !== "숙소" && !departureNames.has(p.name)
      ),
    [validPlaces, departureNames]
  );

  // 버튼 활성화 조건
  const readinessIssues = useMemo(() => {
    const issues: string[] = [];
    if (validPlaces.length === 0)
      issues.push("좌표 정보가 있는 장소가 없습니다. 검색으로 장소를 추가해주세요.");
    if (visitPlaces.length === 0)
      issues.push("숙소·출발지를 제외한 방문 장소가 없습니다.");
    if (visitPlaces.length > 0 && visitPlaces.length < nDays)
      issues.push(
        `${nDays}일 여행에는 방문 장소가 최소 ${nDays}개 필요합니다. (현재 ${visitPlaces.length}개)`
      );
    if (settings.startTime >= settings.endTime)
      issues.push("종료 시간은 시작 시간보다 늦어야 합니다.");
    return issues;
  }, [validPlaces, visitPlaces, nDays, settings.startTime, settings.endTime]);

  const canGenerate = readinessIssues.length === 0;

  // ─── 로딩 애니메이션 ─────────────────────────────────────
  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      setLoadingProgress(0);
      return;
    }

    setLoadingStartedAt(Date.now());
    let step = 0;
    const totalDuration = LOADING_STEPS.reduce((s, x) => s + x.duration, 0);
    let elapsed = 0;

    const tick = () => {
      if (step >= LOADING_STEPS.length - 1) return;
      elapsed += LOADING_STEPS[step].duration;
      step++;
      setLoadingStep(step);
      setLoadingProgress(Math.min(90, Math.round((elapsed / totalDuration) * 100)));
      setTimeout(tick, LOADING_STEPS[step]?.duration ?? 1000);
    };

    // 진행 바: 타이머 기반 (실제 진행 아님 — UI 피드백 전용)
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => (prev < 88 ? prev + 1 : prev));
    }, 200);

    setTimeout(tick, LOADING_STEPS[0].duration);
    return () => clearInterval(progressInterval);
  }, [isLoading]);

  const updateSetting = <K extends keyof AiScheduleSettings>(
    key: K,
    value: AiScheduleSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setErrorMsg(null);
  };

  // ─── 제출 ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canGenerate) {
      setErrorMsg(readinessIssues[0]);
      return;
    }

    // 숙소 자동 주입 로직
    const manualHotels = settings.hotels.filter(
      (h) =>
        h.name.trim() &&
        h.lat != null &&
        h.lng != null &&
        h.checkOutDay > h.checkInDay
    );
    const autoHotels: typeof manualHotels =
      manualHotels.length > 0
        ? []
        : savedPlaces
            .filter((p) => p.category === "숙소" && p.lat != null && p.lng != null)
            .map((p) => ({
              name: p.name,
              lat: p.lat!,
              lng: p.lng!,
              address: p.address || "",
              checkInDay: 1,
              checkOutDay: nDays,
            }));

    const resolvedHotels = [...manualHotels, ...autoHotels];

    const body = {
      places: visitPlaces.map((p) => ({
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        // 카테고리 변환: 프론트 "관광" → 백엔드 "관광지" (schedule_constants 사용)
        category: CATEGORY_TO_BACKEND[p.category] ?? "관광지",
        address: p.address || "",
      })),
      n_days: nDays,
      transportation_mode: TRANSPORT_TO_BACKEND[settings.transportMode],
      start_date: startDate,
      end_date: endDate,
      daily_start_time: settings.startTime,
      daily_end_time: settings.endTime,
      user_preferences: {
        pace: PACE_TO_BACKEND[settings.priority],
        lunch_time: settings.includeMeals ? "12:00" : "23:59",
        dinner_time: settings.includeMeals ? "18:00" : "23:59",
      },
      pinned_places: settings.pinnedPlaces
        .map((pin) => {
          const originalPlace = savedPlaces.find((p) => p.id === pin.placeId);
          if (!originalPlace) return null;
          const validIdx = visitPlaces.findIndex((p) => p.id === originalPlace.id);
          if (validIdx === -1) return null;
          return {
            place_index: validIdx,
            day: pin.day,
            time: pin.time || undefined,
          };
        })
        .filter(Boolean),
      hotels: resolvedHotels.map((h) => ({
        name: h.name.trim(),
        lat: h.lat,
        lng: h.lng,
        address: h.address || "",
        check_in_day: h.checkInDay,
        check_out_day: h.checkOutDay,
      })),
      departure_points: settings.departurePoints
        .filter((dp) => dp.name.trim() && dp.lat != null && dp.lng != null)
        .map((dp) => ({
          name: dp.name.trim(),
          lat: dp.lat,
          lng: dp.lng,
          address: dp.address || "",
          day: dp.day,
          is_return_point: dp.isReturnPoint,
        })),
    };

    setIsLoading(true);
    setErrorMsg(null);
    setPinWarnings([]);

    try {
      const res = await fetch(`${API_BASE}/schedule/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `서버 오류 (${res.status})`);
      }

      const data = await res.json();
      if (!data.success || !data.itinerary)
        throw new Error("일정 생성에 실패했습니다.");

      // ── pin_warnings 수집 (백엔드에서 반환) ──
      const collectedPinWarnings: string[] = [];
      Object.values(data.itinerary).forEach((dayData: any) => {
        if (Array.isArray(dayData.pin_warnings)) {
          collectedPinWarnings.push(...dayData.pin_warnings);
        }
      });

      // ── API 응답 → TimelineNode 변환 ──
      const generatedSchedule: Record<string, TimelineNode[]> = {};
      const dayKeys: string[] = [];

      Object.entries(data.itinerary).forEach(([dayKey, dayData]: [string, any]) => {
        const dayNum = dayKey.replace("day_", "");
        const label = `DAY ${dayNum}`;
        dayKeys.push(label);

        generatedSchedule[label] = (dayData.places || []).map((p: any) => {
          const matched = savedPlaces.find((sp) => sp.name === p.place);
          // 이동시간 추정치임을 desc에 명시
          const travelNote =
            p.travel_minutes != null
              ? `이동 약 ${p.travel_minutes}분 (추정)`
              : null;

          return {
            time: p.time || "00:00",
            title: p.place || "",
            desc: [
              p.address,
              p.stay_minutes ? `${p.stay_minutes}분 체류` : null,
              travelNote,
              p.type === "hotel_checkin"
                ? "🏨 체크인"
                : p.type === "hotel"
                ? "🏨 숙소"
                : p.type === "departure"
                ? "✈️ 출발"
                : p.type === "arrival"
                ? "📍 집결"
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
            placeInfo: {
              name: p.place || "",
              address: p.address || "",
              category: p.category || "",
              description: matched?.description || "",
              memo: matched?.memo || "",
              imageUrl: matched?.imageUrl,
              rating: matched?.rating,
            },
          };
        });
      });

      // ── localStorage 저장 ──
      try {
        const existing = localStorage.getItem(STORAGE_KEYS.TIMELINE);
        const timelineData: Record<string, TimelineNode[]> = existing
          ? JSON.parse(existing)
          : {};
        dayKeys.forEach((label) => {
          timelineData[label] = generatedSchedule[label];
        });
        localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(timelineData));

        const existingLogs = localStorage.getItem(STORAGE_KEYS.DATE_LOGS);
        const dateLogs: string[] = existingLogs ? JSON.parse(existingLogs) : [];
        dayKeys.forEach((label) => {
          if (!dateLogs.includes(label)) dateLogs.push(label);
        });
        localStorage.setItem(STORAGE_KEYS.DATE_LOGS, JSON.stringify(dateLogs));
      } catch (storageErr) {
        console.error("[AiScheduleModal] localStorage 저장 실패:", storageErr);
        // 저장 실패해도 콜백은 호출 (인메모리 상태는 유지)
      }

      setLoadingProgress(100);

      // pin 경고가 있으면 잠깐 표시 후 닫기
      if (collectedPinWarnings.length > 0) {
        setPinWarnings(collectedPinWarnings);
        setIsLoading(false);
        // 경고 확인 후 사용자가 직접 닫도록 (또는 3초 후 자동 완료)
        setTimeout(() => {
          onGenerate(settings, generatedSchedule, dayKeys);
          onClose();
        }, 4000);
      } else {
        setTimeout(() => {
          onGenerate(settings, generatedSchedule, dayKeys);
          onClose();
        }, 400);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "일정 생성 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  // ─── 경과 시간 표시 ──────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isLoading || loadingStartedAt == null) { setElapsed(0); return; }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - loadingStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading, loadingStartedAt]);

  const hotelPlaces = savedPlaces.filter(
    (p) => p.category === "숙소" && p.lat != null && p.lng != null
  );

  // ─── 인라인 숙소 검색 상태 ────────────────────────────────
  const [hotelSearchQuery, setHotelSearchQuery] = useState("");
  const [hotelSearchResults, setHotelSearchResults] = useState<Place[]>([]);
  const [isHotelSearching, setIsHotelSearching] = useState(false);
  const [hotelSearchError, setHotelSearchError] = useState<string | null>(null);
  const [hotelAddedName, setHotelAddedName] = useState<string | null>(null);

  const handleHotelSearch = async () => {
    const q = hotelSearchQuery.trim();
    if (!q) return;
    setIsHotelSearching(true);
    setHotelSearchError(null);
    setHotelSearchResults([]);

    try {
      const res = await fetch(
        `${API_BASE}/schedule/search?query=${encodeURIComponent(q)}&display=8`
      );
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const data = await res.json();

      if (!data.success || !data.places?.length) {
        setHotelSearchError(`'${q}' 검색 결과가 없습니다.`);
        return;
      }

      const mapped: Place[] = data.places.map((p: any, idx: number) => ({
        id: `hotel_search_${Date.now()}_${idx}`,
        name: p.name,
        category: "숙소",          // 숙소 검색이므로 카테고리 고정
        address: p.address || "",
        description: p.description || "",
        lat: p.lat,
        lng: p.lng,
        memo: "",
      }));
      setHotelSearchResults(mapped);
    } catch (e: any) {
      setHotelSearchError(e.message || "검색 중 오류가 발생했습니다.");
    } finally {
      setIsHotelSearching(false);
    }
  };

  const handleHotelAdd = (place: Place) => {
    // 이미 저장된 장소면 스킵
    if (savedPlaces.some((p) => p.name === place.name && p.lat === place.lat)) {
      setHotelAddedName(place.name);
      setTimeout(() => setHotelAddedName(null), 2000);
      return;
    }
    onAddPlace(place);
    setHotelAddedName(place.name);
    setHotelSearchResults([]);
    setHotelSearchQuery("");
    setTimeout(() => setHotelAddedName(null), 2500);
  };

  // ─── 인라인 출발지 검색 상태 ─────────────────────────────
  const [deptSearchQuery, setDeptSearchQuery] = useState("");
  const [deptSearchResults, setDeptSearchResults] = useState<Place[]>([]);
  const [isDeptSearching, setIsDeptSearching] = useState(false);
  const [deptSearchError, setDeptSearchError] = useState<string | null>(null);
  const [deptAddedName, setDeptAddedName] = useState<string | null>(null);

  const handleDeptSearch = async () => {
    const q = deptSearchQuery.trim();
    if (!q) return;
    setIsDeptSearching(true);
    setDeptSearchError(null);
    setDeptSearchResults([]);

    try {
      const res = await fetch(
        `${API_BASE}/schedule/search?query=${encodeURIComponent(q)}&display=8`
      );
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const data = await res.json();

      if (!data.success || !data.places?.length) {
        setDeptSearchError(`'${q}' 검색 결과가 없습니다.`);
        return;
      }

      const mapped: Place[] = data.places.map((p: any, idx: number) => ({
        id: `dept_search_${Date.now()}_${idx}`,
        name: p.name,
        category: "교통",   // 출발지 검색 결과는 교통 카테고리로 저장
        address: p.address || "",
        description: p.description || "",
        lat: p.lat,
        lng: p.lng,
        memo: "",
      }));
      setDeptSearchResults(mapped);
    } catch (e: any) {
      setDeptSearchError(e.message || "검색 중 오류가 발생했습니다.");
    } finally {
      setIsDeptSearching(false);
    }
  };

  const handleDeptAdd = (place: Place) => {
    if (savedPlaces.some((p) => p.name === place.name && p.lat === place.lat)) {
      setDeptAddedName(place.name);
      setTimeout(() => setDeptAddedName(null), 2000);
      return;
    }
    onAddPlace(place);
    setDeptAddedName(place.name);
    setDeptSearchResults([]);
    setDeptSearchQuery("");
    setTimeout(() => setDeptAddedName(null), 2500);
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        className="modal-window"
        style={{ width: "90%", maxWidth: "700px", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; AI 일정 생성 설정</span>
          <button className="mh-close" onClick={onClose} disabled={isLoading}>
            CLOSE [X]
          </button>
        </div>

        {/* ── 로딩 오버레이 ── */}
        {isLoading && (
          <div
            style={{
              position: "absolute", inset: 0,
              background: "rgba(255,255,255,0.96)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              zIndex: 10, borderRadius: "inherit", gap: "28px",
            }}
          >
            <div style={{ position: "relative", width: "72px", height: "72px" }}>
              <div
                style={{
                  width: "72px", height: "72px",
                  border: "4px solid #eee",
                  borderTop: "4px solid #000",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <div
                style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px",
                }}
              >
                {LOADING_STEPS[loadingStep]?.icon}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 6px" }}>
                AI 일정 생성 중
              </p>
              <p style={{ fontSize: "14px", color: "#666", margin: "0 0 4px" }}>
                {LOADING_STEPS[loadingStep]?.text}
              </p>
              {/* 실제 경과 시간 표시 (가짜 퍼센트 아님) */}
              <p style={{ fontSize: "12px", color: "#bbb", margin: 0 }}>
                {elapsed}초 경과
              </p>
            </div>

            <div style={{ width: "260px" }}>
              <div
                style={{
                  width: "100%", height: "6px",
                  background: "#eee", borderRadius: "3px", overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${loadingProgress}%`,
                    height: "100%",
                    background: "#000",
                    borderRadius: "3px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: "11px", color: "#bbb", textAlign: "right", margin: "4px 0 0" }}>
                예상 진행률 (UI 표시용)
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {LOADING_STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: i <= loadingStep ? "#000" : "#ddd",
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>

            {/* pin 경고 표시 (로딩 완료 후) */}
            {pinWarnings.length > 0 && (
              <div
                style={{
                  maxWidth: "380px",
                  padding: "12px 16px",
                  background: "#fff8e1",
                  border: "2px solid #ffd54f",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#795548",
                }}
              >
                <p style={{ fontWeight: "bold", margin: "0 0 8px" }}>
                  📌 고정 장소 시간 경고
                </p>
                {pinWarnings.map((w, i) => (
                  <p key={i} style={{ margin: "0 0 4px", lineHeight: 1.5 }}>
                    ⚠️ {w}
                  </p>
                ))}
                <p style={{ fontSize: "11px", color: "#bbb", margin: "8px 0 0" }}>
                  4초 후 자동으로 일정 탭으로 이동합니다
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── 바디 ── */}
        <div
          className="modal-body"
          style={{
            padding: "30px",
            overflowY: "auto",
            maxHeight: "calc(90vh - 140px)",
          }}
        >
          {/* ── 장소 현황 요약 ── */}
          <div
            style={{
              background: "#f5f5f5", padding: "15px", borderRadius: "8px",
              marginBottom: "25px", border: "2px solid #ddd",
            }}
          >
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px", color: "#333" }}>
              📍 저장된 장소: {savedPlaces.length}개
            </p>
            <p style={{ margin: "5px 0 0", fontSize: "13px", color: "#666" }}>
              {startDate} ~ {endDate} ({nDays}일) ·{" "}
              방문 대상: {visitPlaces.length}개
              {savedPlaces.filter((p) => p.lat == null).length > 0 && (
                <span style={{ color: "#e53935", marginLeft: "8px", fontSize: "12px" }}>
                  (좌표 없는 장소 {savedPlaces.filter((p) => p.lat == null).length}개 제외)
                </span>
              )}
            </p>

            {/* 실시간 준비 상태 */}
            {readinessIssues.length > 0 ? (
              <div style={{ marginTop: "10px" }}>
                {readinessIssues.map((issue, i) => (
                  <p key={i} style={{ margin: "4px 0 0", fontSize: "12px", color: "#e53935" }}>
                    ⚠️ {issue}
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#2e7d32", fontWeight: "bold" }}>
                ✅ 일정 생성 준비 완료
              </p>
            )}
          </div>

          {/* 에러 메시지 */}
          {errorMsg && (
            <div
              style={{
                padding: "12px 15px", background: "#ffebee",
                border: "2px solid #e53935", borderRadius: "8px",
                marginBottom: "20px", fontSize: "13px", color: "#c62828",
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {/* ── 시간 설정 ── */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", fontSize: "14px", marginBottom: "10px", color: "#333" }}>
                ⏰ 여행 시간대
              </label>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>시작 시간</label>
                  <input
                    type="time"
                    value={settings.startTime}
                    onChange={(e) => updateSetting("startTime", e.target.value)}
                    style={{
                      width: "100%", padding: "10px",
                      border: `2px solid ${settings.startTime >= settings.endTime ? "#e53935" : "#ddd"}`,
                      borderRadius: "6px", fontSize: "14px",
                    }}
                  />
                </div>
                <span style={{ fontWeight: "bold", color: "#999" }}>~</span>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>종료 시간</label>
                  <input
                    type="time"
                    value={settings.endTime}
                    onChange={(e) => updateSetting("endTime", e.target.value)}
                    style={{
                      width: "100%", padding: "10px",
                      border: `2px solid ${settings.startTime >= settings.endTime ? "#e53935" : "#ddd"}`,
                      borderRadius: "6px", fontSize: "14px",
                    }}
                  />
                </div>
              </div>
              {settings.startTime >= settings.endTime && (
                <p style={{ fontSize: "12px", color: "#e53935", margin: "6px 0 0" }}>
                  ⚠️ 종료 시간은 시작 시간보다 늦어야 합니다
                </p>
              )}
            </div>

            {/* ── 이동 수단 ── */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", fontSize: "14px", marginBottom: "10px", color: "#333" }}>
                🚗 이동 수단
              </label>
              {/* 이동시간 추정 안내 */}
              <p style={{ fontSize: "12px", color: "#999", margin: "0 0 10px", lineHeight: 1.5 }}>
                💡 이동 시간은 직선 거리 기반 추정치입니다. 실제 소요 시간과 다를 수 있습니다.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  { value: "walk", label: "도보 🚶", desc: "가까운 거리 위주" },
                  { value: "public", label: "대중교통 🚇", desc: "지하철/버스" },
                  { value: "car", label: "자동차 🚗", desc: "렌터카/택시" },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => updateSetting("transportMode", mode.value as any)}
                    style={{
                      flex: 1, padding: "12px",
                      background: settings.transportMode === mode.value ? "#000" : "#fff",
                      color: settings.transportMode === mode.value ? "#fff" : "#000",
                      border: "2px solid #000", borderRadius: "6px",
                      fontWeight: "bold", fontSize: "13px", cursor: "pointer",
                      transition: "0.2s", textAlign: "center",
                    }}
                  >
                    <div>{mode.label}</div>
                    <div style={{ fontSize: "11px", marginTop: "3px", opacity: 0.8 }}>{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── 식사 시간 ── */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.includeMeals}
                  onChange={(e) => updateSetting("includeMeals", e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <span style={{ fontWeight: "bold", fontSize: "14px", color: "#333" }}>🍽️ 식사 시간 포함</span>
              </label>
            </div>

            {/* ── 일정 스타일 ── */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", fontSize: "14px", marginBottom: "10px", color: "#333" }}>
                🎯 일정 스타일
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  { value: "efficiency", label: "효율적", desc: "많은 곳을 방문" },
                  { value: "balanced", label: "균형잡힌", desc: "적당한 페이스" },
                  { value: "relaxed", label: "여유로운", desc: "느긋하게 즐기기" },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => updateSetting("priority", mode.value as any)}
                    style={{
                      flex: 1, padding: "12px",
                      background: settings.priority === mode.value ? "#000" : "#fff",
                      color: settings.priority === mode.value ? "#fff" : "#000",
                      border: "2px solid #000", borderRadius: "6px",
                      fontWeight: "bold", fontSize: "13px", cursor: "pointer",
                      transition: "0.2s", textAlign: "center",
                    }}
                  >
                    <div>{mode.label}</div>
                    <div style={{ fontSize: "11px", marginTop: "3px", opacity: 0.8 }}>{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── 숙소 설정 ── */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", fontSize: "14px", marginBottom: "6px", color: "#333" }}>
                🏨 숙소 설정 (선택)
              </label>
              <p style={{ fontSize: "12px", color: "#999", margin: "0 0 12px" }}>
                숙소 위치를 기준으로 날짜별 장소를 클러스터링합니다.
              </p>
              {/* 숙소가 없으면 인라인 검색창 표시 — 모달 왕복 없이 바로 추가 가능 */}
              {hotelPlaces.length === 0 && (
                <div style={{
                  padding: "16px",
                  background: "#f8f9ff",
                  border: "2px solid #e3e8ff",
                  borderRadius: "8px",
                  marginBottom: "12px",
                }}>
                  <p style={{ fontSize: "13px", fontWeight: "bold", color: "#333", margin: "0 0 10px" }}>
                    🏨 숙소를 검색해서 바로 추가하세요
                  </p>

                  {/* 검색 입력 */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      value={hotelSearchQuery}
                      onChange={(e) => setHotelSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleHotelSearch()}
                      placeholder="숙소명 검색... (예: 신라호텔, 도톤보리 호텔)"
                      style={{
                        flex: 1, height: "38px", padding: "0 12px",
                        border: "1.5px solid #ddd", borderRadius: "6px",
                        fontSize: "13px", outline: "none",
                      }}
                    />
                    <button
                      onClick={handleHotelSearch}
                      disabled={isHotelSearching || !hotelSearchQuery.trim()}
                      style={{
                        padding: "0 16px", height: "38px",
                        background: "#000", color: "#fff",
                        border: "none", borderRadius: "6px",
                        fontSize: "13px", fontWeight: "bold",
                        cursor: isHotelSearching || !hotelSearchQuery.trim() ? "not-allowed" : "pointer",
                        opacity: isHotelSearching || !hotelSearchQuery.trim() ? 0.5 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isHotelSearching ? "검색중..." : "검색"}
                    </button>
                  </div>

                  {/* 에러 */}
                  {hotelSearchError && (
                    <p style={{ fontSize: "12px", color: "#e53935", margin: "0 0 8px" }}>
                      ⚠️ {hotelSearchError}
                    </p>
                  )}

                  {/* 추가 완료 토스트 */}
                  {hotelAddedName && (
                    <p style={{ fontSize: "12px", color: "#2e7d32", fontWeight: "bold", margin: "0 0 8px" }}>
                      ✅ '{hotelAddedName}' 숙소로 추가됨
                    </p>
                  )}

                  {/* 검색 결과 */}
                  {hotelSearchResults.length > 0 && (
                    <div style={{
                      border: "1.5px solid #e0e0e0",
                      borderRadius: "6px",
                      overflow: "hidden",
                      maxHeight: "220px",
                      overflowY: "auto",
                    }}>
                      {hotelSearchResults.map((place) => {
                        const alreadyAdded = savedPlaces.some(
                          (p) => p.name === place.name && p.lat === place.lat
                        );
                        return (
                          <div
                            key={place.id}
                            style={{
                              padding: "10px 12px",
                              borderBottom: "1px solid #f0f0f0",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              background: "#fff",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                🏨 {place.name}
                              </p>
                              <p style={{ fontSize: "11px", color: "#999", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                📍 {place.address || "주소 없음"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleHotelAdd(place)}
                              disabled={alreadyAdded}
                              style={{
                                padding: "5px 12px", flexShrink: 0,
                                background: alreadyAdded ? "#4caf50" : "#000",
                                color: "#fff", border: "none",
                                borderRadius: "5px", fontSize: "12px",
                                fontWeight: "bold",
                                cursor: alreadyAdded ? "default" : "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {alreadyAdded ? "✓ 추가됨" : "+ 추가"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 검색 결과 없고 에러도 없는 초기 상태 */}
                  {hotelSearchResults.length === 0 && !hotelSearchError && !isHotelSearching && (
                    <p style={{ fontSize: "12px", color: "#bbb", margin: 0 }}>
                      검색 후 숙소를 선택하면 장소 목록에 자동으로 추가됩니다.
                    </p>
                  )}
                </div>
              )}

              {settings.hotels.map((hotel, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px", background: "#f5f5f5",
                    borderRadius: "6px", border: "1px solid #ddd", marginBottom: "8px",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <select
                      value={hotel.name}
                      onChange={(e) => {
                        const selected = savedPlaces.find((p) => p.name === e.target.value);
                        if (!selected) return;
                        const next = [...settings.hotels];
                        next[i] = {
                          ...next[i],
                          name: selected.name,
                          address: selected.address || "",
                          lat: selected.lat,
                          lng: selected.lng,
                        };
                        updateSetting("hotels", next);
                      }}
                      style={{
                        width: "100%", padding: "8px 10px",
                        border: "1px solid #ccc", borderRadius: "6px",
                        fontSize: "13px", background: "#fff",
                      }}
                    >
                      <option value="">숙소를 선택하세요...</option>
                      {hotelPlaces.map((p) => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  {hotel.name && (
                    <div
                      style={{
                        padding: "8px 10px", background: "#fff",
                        borderRadius: "4px", border: "1px solid #e0e0e0",
                        fontSize: "12px", color: "#555", marginBottom: "8px",
                      }}
                    >
                      📍 {hotel.address || "주소 없음"}
                      {hotel.lat != null && (
                        <span style={{ marginLeft: "8px", color: "#999" }}>
                          ({hotel.lat.toFixed(4)}, {hotel.lng?.toFixed(4)})
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>체크인</span>
                    <select
                      value={hotel.checkInDay}
                      onChange={(e) => {
                        const next = [...settings.hotels];
                        const newIn = Number(e.target.value);
                        next[i] = {
                          ...next[i],
                          checkInDay: newIn,
                          checkOutDay: next[i].checkOutDay <= newIn ? newIn + 1 : next[i].checkOutDay,
                        };
                        updateSetting("hotels", next);
                      }}
                      style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }}
                    >
                      {Array.from({ length: nDays }, (_, d) => (
                        <option key={d + 1} value={d + 1}>DAY {d + 1}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: "12px", color: "#666" }}>체크아웃</span>
                    <select
                      value={hotel.checkOutDay}
                      onChange={(e) => {
                        const next = [...settings.hotels];
                        next[i] = { ...next[i], checkOutDay: Number(e.target.value) };
                        updateSetting("hotels", next);
                      }}
                      style={{
                        padding: "4px 8px",
                        border: `1px solid ${hotel.checkOutDay <= hotel.checkInDay ? "#e53935" : "#ccc"}`,
                        borderRadius: "4px", fontSize: "13px",
                      }}
                    >
                      {Array.from({ length: nDays }, (_, d) => (
                        <option key={d + 1} value={d + 1}>DAY {d + 1}</option>
                      ))}
                    </select>
                    {hotel.checkOutDay <= hotel.checkInDay && (
                      <span style={{ fontSize: "11px", color: "#e53935", width: "100%" }}>
                        ⚠️ 체크아웃은 체크인보다 늦어야 합니다
                      </span>
                    )}
                    <button
                      onClick={() => updateSetting("hotels", settings.hotels.filter((_, idx) => idx !== i))}
                      style={{
                        marginLeft: "auto", padding: "4px 10px",
                        background: "#fff", color: "#e53935",
                        border: "1px solid #e53935", borderRadius: "4px",
                        fontSize: "12px", cursor: "pointer",
                      }}
                    >
                      제거
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  updateSetting("hotels", [
                    ...settings.hotels,
                    {
                      name: "", lat: undefined, lng: undefined,
                      address: "", checkInDay: 1, checkOutDay: nDays,
                    },
                  ])
                }
                disabled={hotelPlaces.length === 0}
                style={{
                  width: "100%", padding: "10px",
                  border: "2px dashed #ccc", borderRadius: "6px",
                  fontSize: "13px", color: hotelPlaces.length === 0 ? "#bbb" : "#555",
                  background: "#fafafa",
                  cursor: hotelPlaces.length === 0 ? "not-allowed" : "pointer",
                  opacity: hotelPlaces.length === 0 ? 0.4 : 1,
                }}
              >
                {hotelPlaces.length === 0
                  ? "↑ 위에서 숙소를 먼저 추가해주세요"
                  : "+ 일정에 숙소 배정 추가"}
              </button>
            </div>

            {/* ── 출발지 설정 ── */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", fontSize: "14px", marginBottom: "6px", color: "#333" }}>
                ✈️ 출발지 설정 (선택)
              </label>
              <p style={{ fontSize: "12px", color: "#999", margin: "0 0 12px" }}>
                공항, 기차역 등 출발/도착 기준점을 설정합니다.
              </p>

              {/* 저장된 장소가 없거나, 출발지로 쓸 만한 장소를 새로 찾고 싶을 때 인라인 검색 */}
              {validPlaces.length === 0 && (
                <div style={{
                  padding: "16px",
                  background: "#f8f9ff",
                  border: "2px solid #e3e8ff",
                  borderRadius: "8px",
                  marginBottom: "12px",
                }}>
                  <p style={{ fontSize: "13px", fontWeight: "bold", color: "#333", margin: "0 0 10px" }}>
                    ✈️ 출발지를 검색해서 바로 추가하세요
                  </p>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      value={deptSearchQuery}
                      onChange={(e) => setDeptSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleDeptSearch()}
                      placeholder="출발지 검색... (예: 인천공항, 오사카역)"
                      style={{
                        flex: 1, height: "38px", padding: "0 12px",
                        border: "1.5px solid #ddd", borderRadius: "6px",
                        fontSize: "13px", outline: "none",
                      }}
                    />
                    <button
                      onClick={handleDeptSearch}
                      disabled={isDeptSearching || !deptSearchQuery.trim()}
                      style={{
                        padding: "0 16px", height: "38px",
                        background: "#000", color: "#fff",
                        border: "none", borderRadius: "6px",
                        fontSize: "13px", fontWeight: "bold",
                        cursor: isDeptSearching || !deptSearchQuery.trim() ? "not-allowed" : "pointer",
                        opacity: isDeptSearching || !deptSearchQuery.trim() ? 0.5 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isDeptSearching ? "검색중..." : "검색"}
                    </button>
                  </div>

                  {deptSearchError && (
                    <p style={{ fontSize: "12px", color: "#e53935", margin: "0 0 8px" }}>
                      ⚠️ {deptSearchError}
                    </p>
                  )}
                  {deptAddedName && (
                    <p style={{ fontSize: "12px", color: "#2e7d32", fontWeight: "bold", margin: "0 0 8px" }}>
                      ✅ '{deptAddedName}' 장소로 추가됨
                    </p>
                  )}

                  {deptSearchResults.length > 0 && (
                    <div style={{
                      border: "1.5px solid #e0e0e0",
                      borderRadius: "6px",
                      overflow: "hidden",
                      maxHeight: "220px",
                      overflowY: "auto",
                    }}>
                      {deptSearchResults.map((place) => {
                        const alreadyAdded = savedPlaces.some(
                          (p) => p.name === place.name && p.lat === place.lat
                        );
                        return (
                          <div
                            key={place.id}
                            style={{
                              padding: "10px 12px",
                              borderBottom: "1px solid #f0f0f0",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              background: "#fff",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                ✈️ {place.name}
                              </p>
                              <p style={{ fontSize: "11px", color: "#999", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                📍 {place.address || "주소 없음"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeptAdd(place)}
                              disabled={alreadyAdded}
                              style={{
                                padding: "5px 12px", flexShrink: 0,
                                background: alreadyAdded ? "#4caf50" : "#000",
                                color: "#fff", border: "none",
                                borderRadius: "5px", fontSize: "12px",
                                fontWeight: "bold",
                                cursor: alreadyAdded ? "default" : "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {alreadyAdded ? "✓ 추가됨" : "+ 추가"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {deptSearchResults.length === 0 && !deptSearchError && !isDeptSearching && (
                    <p style={{ fontSize: "12px", color: "#bbb", margin: 0 }}>
                      검색 후 선택하면 장소 목록에 자동으로 추가됩니다.
                    </p>
                  )}
                </div>
              )}

              {settings.departurePoints.map((dp, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px", background: "#f5f5f5",
                    borderRadius: "6px", border: "1px solid #ddd", marginBottom: "8px",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <select
                      value={dp.name}
                      onChange={(e) => {
                        const selected = savedPlaces.find((p) => p.name === e.target.value);
                        if (!selected) return;
                        const next = [...settings.departurePoints];
                        next[i] = {
                          ...next[i],
                          name: selected.name,
                          address: selected.address || "",
                          lat: selected.lat,
                          lng: selected.lng,
                        };
                        updateSetting("departurePoints", next);
                      }}
                      style={{
                        width: "100%", padding: "8px 10px",
                        border: "1px solid #ccc", borderRadius: "6px",
                        fontSize: "13px", background: "#fff",
                      }}
                    >
                      <option value="">출발지를 선택하세요...</option>
                      {/* 교통 카테고리 장소를 상단에 우선 표시 */}
                      {validPlaces.filter((p) => p.category === "교통").length > 0 && (
                        <optgroup label="✈️ 교통 (공항/기차역 등)">
                          {validPlaces
                            .filter((p) => p.category === "교통")
                            .map((p) => (
                              <option key={p.id} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {validPlaces.filter((p) => p.category !== "교통").length > 0 && (
                        <optgroup label="기타 장소">
                          {validPlaces
                            .filter((p) => p.category !== "교통")
                            .map((p) => (
                              <option key={p.id} value={p.name}>
                                {p.name} ({p.category})
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  {dp.name && (
                    <div
                      style={{
                        padding: "8px 10px", background: "#fff",
                        borderRadius: "4px", border: "1px solid #e0e0e0",
                        fontSize: "12px", color: "#555", marginBottom: "8px",
                      }}
                    >
                      📍 {dp.address || "주소 없음"}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>적용 일차</span>
                    <select
                      value={dp.day}
                      onChange={(e) => {
                        const next = [...settings.departurePoints];
                        next[i] = { ...next[i], day: Number(e.target.value) };
                        updateSetting("departurePoints", next);
                      }}
                      style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }}
                    >
                      {Array.from({ length: nDays }, (_, d) => (
                        <option key={d + 1} value={d + 1}>DAY {d + 1}</option>
                      ))}
                    </select>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={dp.isReturnPoint}
                        onChange={(e) => {
                          const next = [...settings.departurePoints];
                          next[i] = { ...next[i], isReturnPoint: e.target.checked };
                          updateSetting("departurePoints", next);
                        }}
                      />
                      마지막 날 복귀 기준
                    </label>
                    <button
                      onClick={() =>
                        updateSetting(
                          "departurePoints",
                          settings.departurePoints.filter((_, idx) => idx !== i)
                        )
                      }
                      style={{
                        marginLeft: "auto", padding: "4px 10px",
                        background: "#fff", color: "#e53935",
                        border: "1px solid #e53935", borderRadius: "4px",
                        fontSize: "12px", cursor: "pointer",
                      }}
                    >
                      제거
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  updateSetting("departurePoints", [
                    ...settings.departurePoints,
                    { name: "", lat: undefined, lng: undefined, address: "", day: 1, isReturnPoint: true },
                  ])
                }
                disabled={validPlaces.length === 0}
                style={{
                  width: "100%", padding: "10px",
                  border: "2px dashed #ccc", borderRadius: "6px",
                  fontSize: "13px",
                  color: validPlaces.length === 0 ? "#bbb" : "#555",
                  background: "#fafafa",
                  cursor: validPlaces.length === 0 ? "not-allowed" : "pointer",
                  opacity: validPlaces.length === 0 ? 0.4 : 1,
                }}
              >
                {validPlaces.length === 0
                  ? "↑ 위에서 출발지를 먼저 추가해주세요"
                  : "+ 출발지 배정 추가"}
              </button>
            </div>

            {/* ── 장소 고정 ── */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", fontSize: "14px", marginBottom: "6px", color: "#333" }}>
                📌 특정 날짜에 장소 고정 (선택)
              </label>
              <p style={{ fontSize: "12px", color: "#999", margin: "0 0 12px" }}>
                반드시 특정 날에 방문해야 하는 장소를 지정합니다.
                시간을 비워두면 AI가 최적 위치에 배치합니다.
              </p>
              {settings.pinnedPlaces.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                  {settings.pinnedPlaces.map((pin, i) => {
                    const place = savedPlaces.find((p) => p.id === pin.placeId);
                    if (!place) return null;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "10px 12px", background: "#f5f5f5",
                          borderRadius: "6px", border: "1px solid #ddd", flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontWeight: "bold", fontSize: "13px", flex: 1, minWidth: "80px" }}>
                          📍 {place.name}
                        </span>
                        <select
                          value={pin.day}
                          onChange={(e) => {
                            const next = [...settings.pinnedPlaces];
                            next[i] = { ...next[i], day: Number(e.target.value) };
                            updateSetting("pinnedPlaces", next);
                          }}
                          style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }}
                        >
                          {Array.from({ length: nDays }, (_, d) => (
                            <option key={d + 1} value={d + 1}>DAY {d + 1}</option>
                          ))}
                        </select>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <input
                            type="time"
                            value={pin.time}
                            onChange={(e) => {
                              const next = [...settings.pinnedPlaces];
                              next[i] = { ...next[i], time: e.target.value };
                              updateSetting("pinnedPlaces", next);
                            }}
                            style={{
                              padding: "4px 8px", border: "1px solid #ccc",
                              borderRadius: "4px", fontSize: "13px", width: "110px",
                            }}
                          />
                          <span style={{ fontSize: "11px", color: "#bbb" }}>선택</span>
                        </div>
                        <button
                          onClick={() =>
                            updateSetting(
                              "pinnedPlaces",
                              settings.pinnedPlaces.filter((_, idx) => idx !== i)
                            )
                          }
                          style={{
                            padding: "4px 10px", background: "#fff",
                            color: "#e53935", border: "1px solid #e53935",
                            borderRadius: "4px", fontSize: "12px", cursor: "pointer",
                          }}
                        >
                          제거
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <select
                value=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  if (settings.pinnedPlaces.some((p) => p.placeId === id)) {
                    setErrorMsg("이미 고정된 장소입니다.");
                    return;
                  }
                  updateSetting("pinnedPlaces", [
                    ...settings.pinnedPlaces,
                    { placeId: id, day: 1, time: "" },
                  ]);
                }}
                style={{
                  width: "100%", padding: "10px",
                  border: "2px dashed #ccc", borderRadius: "6px",
                  fontSize: "13px", color: "#999", background: "#fafafa", cursor: "pointer",
                }}
              >
                <option value="">+ 고정할 장소 선택...</option>
                {visitPlaces.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name} ({place.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── 푸터 ── */}
        <div
          style={{
            padding: "20px 30px", borderTop: "2px solid #eee",
            display: "flex", gap: "10px", justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: "12px 25px", background: "#fff", color: "#000",
              border: "2px solid #000", borderRadius: "6px",
              fontWeight: "bold", fontSize: "14px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !canGenerate}
            title={!canGenerate ? readinessIssues[0] : undefined}
            style={{
              padding: "12px 25px",
              background: isLoading || !canGenerate ? "#999" : "#000",
              color: "#fff", border: "2px solid #000", borderRadius: "6px",
              fontWeight: "bold", fontSize: "14px",
              cursor: isLoading || !canGenerate ? "not-allowed" : "pointer",
              transition: "0.2s",
            }}
          >
            {isLoading ? "⏳ 생성 중..." : "✨ AI 일정 생성하기"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AiScheduleModal;