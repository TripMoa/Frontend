// src/features/workspace/components/schedule/modal/AiScheduleModal.tsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { estimateSchedule, generateSchedule } from "../../../../../api/schedule.api";
import type { ScheduleEstimate, GeneratedScheduleItem } from "../../../../../api/schedule.api";
import { searchPlaces } from "../../../../../api/place.api";
import type { PlaceSearchItem } from "../../../../../api/place.api";
import { apiMessage } from "../../../hooks/apiError";
import "../../../styles/modals.css";
import {
  CATEGORY_TO_BACKEND,
  CATEGORY_FROM_BACKEND,
  TRANSPORT_TO_BACKEND,
  PACE_TO_BACKEND,
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

// 식사 희망 시각 선택지 — 엔진이 받아들이는 범위(점심 11:30~14:00, 저녁 17:30~20:00)와 같다
const MEAL_TIME_OPTIONS = {
  lunch: ["11:30", "12:00", "12:30", "13:00", "13:30", "14:00"],
  dinner: ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00"],
};

export interface AiScheduleSettings {
  startTime: string;
  endTime: string;
  transportMode: "walk" | "public" | "car";
  includeMeals: boolean;
  lunchTime: string;   // 희망 점심 시각 — 이 시각의 30분 전~90분 후 안에 맛집이 배치된다
  dinnerTime: string;  // 희망 저녁 시각
  priority: "efficiency" | "relaxed" | "balanced";
  pinnedPlaces: PinnedPlaceSetting[];
  hotels: HotelSetting[];
  departurePoints: DeparturePointSetting[];
}

export interface TimelineNode {
  time: string;
  title: string;
  desc: string;
  travelMinutes?: number;   // 다음 장소까지 이동시간 (분), 대중교통 실측값 또는 추정치
  placeInfo?: {
    name: string;
    address?: string;
    category?: string;
    description?: string;
    imageUrl?: string;
    rating?: number;
    lat?: number;
    lng?: number;
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
  tripId: number;
  /** 이미 만들어 둔 일정이 있으면 true — 생성 전에 "바뀐다"는 확인을 한 번 받는다 */
  hasExistingSchedule?: boolean;
  /** 모달 안에서 바로 장소를 추가할 수 있도록 부모의 핸들러를 받음 */
  onAddPlace: (place: Place) => void | Promise<void>;
}



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
  tripId,
  hasExistingSchedule = false,
  onAddPlace,
}) => {
  const [settings, setSettings] = useState<AiScheduleSettings>({
    startTime: "09:00",
    endTime: "20:00",
    transportMode: "public",
    includeMeals: true,
    lunchTime: "12:00",
    dinnerTime: "18:30",
    priority: "balanced",
    pinnedPlaces: [],
    hotels: [],
    departurePoints: [],
  });

  // 숙소 배정 행은 사용자가 직접 만든 것만 쓴다(저장한 숙소를 대신 배정하지 않는다).
  const [showHotelSearch, setShowHotelSearch] = useState(false);
  const [showDeptSearch, setShowDeptSearch] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStartedAt, setLoadingStartedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // pin 시간 충돌 경고 (생성 후 표시)
  const [pinWarnings, setPinWarnings] = useState<string[]>([]);
  // 용량 초과/시간대 제약으로 제외된 장소 (생성 후 표시)
  const [excludedPlaces, setExcludedPlaces] = useState<
    { name: string; category: string; reason: string; day: number }[]
  >([]);
  // 생성 완료 후 자동 전환 대기 중 사용자가 바로 넘어갈 수 있게 하기 위한 참조
  const pendingResultRef = useRef<{
    generatedSchedule: Record<string, TimelineNode[]>;
    dayKeys: string[];
  } | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        (p) => p.category !== "숙소" && p.category !== "교통" && !departureNames.has(p.name)
      ),
    [validPlaces, departureNames]
  );

  // 저장한 교통 장소(공항·역) — 출발지로 체크한 것만 일정에 들어간다(방문지가 아니다)
  const transitPlaces = useMemo(
    () => validPlaces.filter((p) => p.category === "교통"),
    [validPlaces]
  );

  // 버튼 활성화 조건
  // 수동 설정한 숙소끼리 체크인/체크아웃 기간이 겹치는지 검사
  // (겹치면 백엔드가 리스트 순서상 먼저 오는 숙소를 임의로 채택해버림)
  const overlappingHotelIndices = useMemo(() => {
    const bad = new Set<number>();
    const validRows = settings.hotels
      .map((h, idx) => ({ h, idx }))
      .filter(({ h }) => h.name.trim() && h.checkOutDay > h.checkInDay);

    for (let a = 0; a < validRows.length; a++) {
      for (let b = a + 1; b < validRows.length; b++) {
        const { h: ha, idx: ia } = validRows[a];
        const { h: hb, idx: ib } = validRows[b];
        if (ha.checkInDay < hb.checkOutDay && hb.checkInDay < ha.checkOutDay) {
          bad.add(ia);
          bad.add(ib);
        }
      }
    }
    return bad;
  }, [settings.hotels]);

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
    if (!settings.startTime || !settings.endTime)
      issues.push("시작 시간과 종료 시간을 모두 입력해주세요.");
    else if (settings.startTime >= settings.endTime)
      issues.push("종료 시간은 시작 시간보다 늦어야 합니다.");
    if (nDays > 1) {
      if (settings.hotels.some((h) => !h.name.trim()))
        issues.push("숙소를 선택하지 않은 배정이 있습니다. 숙소를 고르거나 제거해주세요.");
      if (
        settings.hotels.some(
          (h) => h.name.trim() && (h.checkOutDay <= h.checkInDay || h.checkOutDay > nDays)
        )
      )
        issues.push("숙소 체크인·체크아웃 일차가 올바르지 않은 배정이 있습니다.");
    }
    if (overlappingHotelIndices.size > 0)
      issues.push("숙박 기간이 겹치는 숙소가 있습니다. 날짜를 조정해주세요.");
    if (settings.departurePoints.some((dp) => !dp.name.trim()))
      issues.push("출발지를 선택하지 않은 배정이 있습니다. 출발지를 고르거나 제거해주세요.");
    const deptDays = settings.departurePoints.filter((dp) => dp.name.trim()).map((dp) => dp.day);
    if (new Set(deptDays).size !== deptDays.length)
      issues.push("같은 일차에 출발지가 둘 이상 배정돼 있습니다.");
    return issues;
  }, [
    validPlaces,
    visitPlaces,
    nDays,
    settings.startTime,
    settings.endTime,
    settings.hotels,
    settings.departurePoints,
    overlappingHotelIndices,
  ]);

  const canGenerate = readinessIssues.length === 0;

  // 저장한 맛집 개수가 이 일정에서 실제로 배치될 수 있는 식사 슬롯(점심/저녁 × 일수)보다
  // 많으면 비침해성으로 안내만 함 — 생성은 그대로 가능하고, 초과분은 백엔드가 알아서 제외함.
  const mealCapacityWarning = useMemo(() => {
    const mealSlotsPerDay = !settings.includeMeals
      ? 0
      : (settings.startTime <= settings.lunchTime && settings.lunchTime <= settings.endTime ? 1 : 0) +
        (settings.startTime <= settings.dinnerTime && settings.dinnerTime <= settings.endTime ? 1 : 0);
    if (mealSlotsPerDay === 0) return null;

    const totalSlots = mealSlotsPerDay * nDays;
    const savedMealCount = visitPlaces.filter((p) => p.category === "맛집").length;
    if (savedMealCount <= totalSlots) return null;

    return `저장한 맛집이 ${savedMealCount}개인데, 이 일정에서는 최대 ${totalSlots}번만 식사로 들어갈 수 있어요(하루 ${mealSlotsPerDay}번 × ${nDays}일). 나머지는 자동으로 제외될 수 있어요.`;
  }, [settings.includeMeals, settings.lunchTime, settings.dinnerTime, settings.startTime, settings.endTime, nDays, visitPlaces]);

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

  const updateHotels = (next: HotelSetting[]) => updateSetting("hotels", next);

  // 복귀 기준은 하나만 — 하나를 켜면 나머지는 끈다
  const setReturnPoint = (index: number, checked: boolean) => {
    updateSetting(
      "departurePoints",
      settings.departurePoints.map((d, idx) =>
        idx === index ? { ...d, isReturnPoint: checked } : checked ? { ...d, isReturnPoint: false } : d
      )
    );
  };

  // ─── 요청 본문 ───────────────────────────────────────────
  // 실제 생성과 "생성 전 예상"이 똑같은 입력을 쓰도록 한 곳에서 만든다.
  const buildRequestBody = () => {
    // 숙소는 화면의 배정 행 그대로 보낸다(저장 숙소를 몰래 전 기간에 넣지 않는다).
    // 잘못된 행은 readinessIssues가 생성 전에 막는다.
    const resolvedHotels = settings.hotels.filter(
      (h) =>
        nDays > 1 &&
        h.name.trim() &&
        h.lat != null &&
        h.lng != null &&
        h.checkOutDay > h.checkInDay
    );

    return {
      tripId,
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
        lunch_time: settings.includeMeals ? settings.lunchTime : "23:59",
        dinner_time: settings.includeMeals ? settings.dinnerTime : "23:59",
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
  };

  // ─── 생성 전 예상 ────────────────────────────────────────
  // 입력이 바뀌면(0.5초 디바운스) AI 서버에 "지금 설정으로 몇 곳이 들어갈지"를 물어본다.
  // 계산은 엔진이 하므로(프론트에 규칙을 복제하지 않음) 엔진 규칙이 바뀌어도 안내가 어긋나지 않는다.
  // 결과에 요청 키를 같이 저장해서, 입력이 바뀐 직후의 옛 결과는 화면에 쓰지 않는다.
  const requestKey = JSON.stringify(buildRequestBody());
  const [estimateResult, setEstimateResult] = useState<{ key: string; data: ScheduleEstimate } | null>(null);

  useEffect(() => {
    if (!canGenerate || isLoading) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { data } = await estimateSchedule(JSON.parse(requestKey));
        if (!cancelled) setEstimateResult({ key: requestKey, data });
      } catch {
        // 예상은 부가 정보라 실패해도 조용히 넘어간다 (생성 자체는 막지 않음)
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [requestKey, canGenerate, isLoading]);

  const estimate =
    !isLoading && canGenerate && estimateResult?.key === requestKey ? estimateResult.data : null;

  // ─── 제출 ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canGenerate) {
      setErrorMsg(readinessIssues[0]);
      return;
    }

    if (
      hasExistingSchedule &&
      !window.confirm(
        "이미 만들어 둔 일정이 있어요. 새로 만들면 지금 일정이 새 일정으로 바뀌어요.\n\n" +
          "· 새 일정에도 있는 장소: 메모와 지출·바우처 연결이 그대로 남아요\n" +
          "· 새 일정에서 빠지는 장소, 직접 넣은 장소: 메모와 연결이 사라져요\n" +
          "· 시각·순서·머무는 시간은 새로 계산돼요\n\n계속할까요?",
      )
    ) {
      return;
    }

    const body = buildRequestBody();

    setIsLoading(true);
    setErrorMsg(null);
    setPinWarnings([]);
    setExcludedPlaces([]);

    try {
      const { data } = await generateSchedule(body);
      // Spring이 ScheduleResponse[] 형태로 반환
      // [{ scheduleId, day, items: [{ id, time, title, description, orderIndex }] }]
      if (!data || !Array.isArray(data) || data.length === 0)
        throw new Error("일정 생성에 실패했습니다.");

      // ── API 응답(Spring ScheduleResponse[]) → TimelineNode 변환 ──
      const generatedSchedule: Record<string, TimelineNode[]> = {};
      const dayKeys: string[] = [];

      data.forEach((schedule) => {
        const label = `DAY ${schedule.day}`;
        dayKeys.push(label);

        generatedSchedule[label] = (schedule.items || []).map((item: GeneratedScheduleItem) => {
          // 완전 일치 먼저, 없으면 부분 일치로 폴백
          const matched = savedPlaces.find((sp) => sp.name === item.title)
            ?? savedPlaces.find((sp) =>
              item.title && (
                sp.name.includes(item.title) || item.title.includes(sp.name)
              )
            );
          return {
            id: item.id,
            scheduleId: schedule.scheduleId,
            time: item.time || "00:00",
            title: item.title || "",
            desc: item.description || "",
            travelMinutes: item.travelMinutes ?? undefined,
            placeInfo: {
              name: item.title || "",
              address: item.description || "",
              category: matched?.category || (item.category ? (CATEGORY_FROM_BACKEND[item.category] ?? item.category) : ""),
              description: matched?.description || "",
              imageUrl: matched?.imageUrl,
              rating: matched?.rating,
              lat: matched?.lat,
              lng: matched?.lng,
            },
          };
        });
      });

      // pin 시간 경고 / 제외된 장소 — 화면에 보여주기 위해 day별로 모아둠
      const allPinWarnings = data.flatMap((s) => s.pinWarnings || []);
      const allExcluded = data.flatMap((s) =>
        (s.excludedPlaces || []).map((e) => ({ ...e, day: s.day }))
      );
      setPinWarnings(allPinWarnings);
      setExcludedPlaces(allExcluded);

      setLoadingProgress(100);

      pendingResultRef.current = { generatedSchedule, dayKeys };
      const hasNotices = allPinWarnings.length > 0 || allExcluded.length > 0;
      closeTimeoutRef.current = setTimeout(finishGeneration, hasNotices ? 4000 : 400);
    } catch (e) {
      setErrorMsg(apiMessage(e, "일정 생성 중 오류가 발생했습니다."));
      setIsLoading(false);
    }
  };

  // 생성 완료 후 자동 전환을 기다리지 않고 바로 넘어감 (경고/제외 안내 확인 버튼용)
  const finishGeneration = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const pending = pendingResultRef.current;
    if (pending) {
      onGenerate(settings, pending.generatedSchedule, pending.dayKeys);
      onClose();
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

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

  // 체크리스트: 체크하면 그 숙소의 배정 행이 생기고(체크인 DAY 1 → 체크아웃 DAY N은 눈에 보이는 초기값, 사용자가 고친다),
  // 체크를 풀면 행이 사라진다. 체크하지 않은 숙소는 일정에 들어가지 않는다.
  const assignHotel = (place: Place) => {
    updateHotels([
      ...settings.hotels,
      {
        name: place.name, lat: place.lat, lng: place.lng, address: place.address || "",
        checkInDay: 1, checkOutDay: nDays,
      },
    ]);
  };
  const unassignHotel = (name: string) => updateHotels(settings.hotels.filter((h) => h.name !== name));
  const patchHotel = (name: string, patch: Partial<HotelSetting>) =>
    updateHotels(settings.hotels.map((h) => (h.name === name ? { ...h, ...patch } : h)));

  const assignDeparture = (place: Place) => {
    updateSetting("departurePoints", [
      ...settings.departurePoints,
      {
        name: place.name, lat: place.lat, lng: place.lng, address: place.address || "",
        day: 1, isReturnPoint: settings.departurePoints.length === 0,
      },
    ]);
  };
  const unassignDeparture = (name: string) =>
    updateSetting("departurePoints", settings.departurePoints.filter((d) => d.name !== name));
  const patchDeparture = (name: string, patch: Partial<DeparturePointSetting>) =>
    updateSetting(
      "departurePoints",
      settings.departurePoints.map((d) => (d.name === name ? { ...d, ...patch } : d))
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
      const { data: searchData } = await searchPlaces(q, 8);

      if (!searchData.success || !searchData.places?.length) {
        setHotelSearchError(`'${q}' 검색 결과가 없습니다.`);
        return;
      }

      const mapped: Place[] = searchData.places.map((p: PlaceSearchItem, idx: number) => ({
        id: `hotel_search_${Date.now()}_${idx}`,
        name: p.name,
        category: "숙소",          // 숙소 검색이므로 카테고리 고정
        address: p.address || "",
        description: p.description || "",
        lat: p.lat,
        lng: p.lng,
      }));
      setHotelSearchResults(mapped);
    } catch (e) {
      setHotelSearchError(apiMessage(e, "검색 중 오류가 발생했습니다."));
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
    Promise.resolve(onAddPlace(place)).catch(() => {});
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
      const { data: deptData } = await searchPlaces(q, 8);

      if (!deptData.success || !deptData.places?.length) {
        setDeptSearchError(`'${q}' 검색 결과가 없습니다.`);
        return;
      }

      const mapped: Place[] = deptData.places.map((p: PlaceSearchItem, idx: number) => ({
        id: `dept_search_${Date.now()}_${idx}`,
        name: p.name,
        category: "교통",   // 출발지 검색 결과는 교통 카테고리로 저장
        address: p.address || "",
        description: p.description || "",
        lat: p.lat,
        lng: p.lng,
      }));
      setDeptSearchResults(mapped);
    } catch (e) {
      setDeptSearchError(apiMessage(e, "검색 중 오류가 발생했습니다."));
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
    Promise.resolve(onAddPlace(place)).catch(() => {});
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
              </div>
            )}

            {/* 제외된 장소 표시 (로딩 완료 후) */}
            {excludedPlaces.length > 0 && (
              <div
                style={{
                  maxWidth: "380px",
                  padding: "12px 16px",
                  background: "#f5f5f5",
                  border: "2px solid #ccc",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#555",
                }}
              >
                <p style={{ fontWeight: "bold", margin: "0 0 8px" }}>
                  📍 이번 일정에 넣지 못한 장소
                </p>
                {excludedPlaces.map((e, i) => (
                  <p key={i} style={{ margin: "0 0 4px", lineHeight: 1.5 }}>
                    · DAY {e.day} — {e.name} (
                    {e.reason === "meal_slot_limit"
                      ? "식사 시간대에 넣을 수 있는 맛집 수를 넘었어요"
                      : e.reason === "cafe_limit"
                      ? "하루 카페 개수 제한을 넘었어요"
                      : e.reason === "capacity"
                      ? "하루 시간 안에 다 들어가지 않아요"
                      : e.reason === "over_time"
                      ? "설정한 종료 시간을 넘겨서 뺐어요"
                      : "이번 일정에 넣지 못했어요"})
                  </p>
                ))}
                <p style={{ fontSize: "11px", color: "#999", margin: "8px 0 0", lineHeight: 1.5 }}>
                  장소 목록에 '일정 미포함'으로 남아 있어요. 직접 추가하거나,
                  <br />일정 스타일·일수를 바꿔 다시 생성해보세요.
                </p>
              </div>
            )}

            {/* 경고/안내가 있을 때만 — 4초 기다리지 않고 바로 넘어가는 버튼 */}
            {(pinWarnings.length > 0 || excludedPlaces.length > 0) && (
              <button
                onClick={finishGeneration}
                style={{
                  padding: "10px 24px", background: "#000", color: "#fff",
                  border: "2px solid #000", borderRadius: "6px",
                  fontWeight: "bold", fontSize: "13px", cursor: "pointer",
                }}
              >
                확인하고 계속하기
              </button>
            )}
          </div>
        )}

        {/* ── 바디 ── */}
        <div
          className="modal-body"
          style={{
            background: "#fff",
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
                    onClick={() => updateSetting("transportMode", mode.value as AiScheduleSettings["transportMode"])}
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
              {settings.includeMeals && (
                <div style={{ display: "flex", gap: "10px", margin: "10px 0 0 28px", alignItems: "center", flexWrap: "wrap" }}>
                  {[
                    { key: "lunchTime" as const, label: "점심", options: MEAL_TIME_OPTIONS.lunch },
                    { key: "dinnerTime" as const, label: "저녁", options: MEAL_TIME_OPTIONS.dinner },
                  ].map(({ key, label, options }) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#555" }}>
                      {label}
                      <select
                        value={settings[key]}
                        onChange={(e) => updateSetting(key, e.target.value)}
                        style={{ padding: "6px 8px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }}
                      >
                        {options.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <span style={{ fontSize: "11px", color: "#999" }}>
                    이 시각 전후로 맛집이 배치돼요 (30분 전 ~ 1시간 30분 후)
                  </span>
                </div>
              )}
              {mealCapacityWarning && (
                <p style={{
                  fontSize: "12px", color: "#795548", background: "#fff8e1",
                  border: "1px solid #ffd54f", borderRadius: "6px",
                  padding: "8px 10px", margin: "8px 0 0", lineHeight: 1.5,
                }}>
                  ⚠️ {mealCapacityWarning}
                </p>
              )}
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
                    onClick={() => updateSetting("priority", mode.value as AiScheduleSettings["priority"])}
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
                🏨 숙소 설정 (선택){" "}
                <span
                  title="체크인 DAY 1 → 체크아웃 DAY 3은 1·2일차 밤(2박)을 그 숙소에서 잔다는 뜻이에요. 체크아웃하는 날 아침엔 그 숙소에서 출발하고, 밤마다 그 숙소로 돌아가요. 체크한 숙소만 일정에 들어가요."
                  style={{ cursor: "help", color: "#1976d2", fontWeight: "normal", fontSize: "12px" }}
                >
                  ?
                </span>
              </label>
              <p style={{ fontSize: "12px", color: "#999", margin: "0 0 12px" }}>
                이번 여행에서 묵는 숙소를 체크하세요. 체크한 숙소만 일정에 들어가요.
              </p>
              {nDays <= 1 && (
                <p style={{ fontSize: "12px", color: "#795548", background: "#fff8e1", border: "1px solid #ffd54f", borderRadius: "6px", padding: "8px 10px", margin: 0, lineHeight: 1.5 }}>
                  당일치기 여행에는 숙소 배정이 필요 없어요.
                </p>
              )}
              {nDays > 1 && (
              <>
              {(hotelPlaces.length === 0 || showHotelSearch) && (
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

              {hotelPlaces.map((place) => {
                const idx = settings.hotels.findIndex((h) => h.name === place.name);
                const row = idx >= 0 ? settings.hotels[idx] : null;
                return (
                  <div
                    key={place.id}
                    style={{
                      padding: "10px 12px", background: row ? "#f5f5f5" : "#fff",
                      borderRadius: "6px",
                      border: `1px solid ${row && overlappingHotelIndices.has(idx) ? "#e53935" : "#ddd"}`,
                      marginBottom: "8px",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!row}
                        onChange={(e) => (e.target.checked ? assignHotel(place) : unassignHotel(place.name))}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <span style={{ flex: 1, minWidth: 0, fontSize: "13px", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        🏨 {place.name}
                      </span>
                      {!row && <span style={{ fontSize: "11px", color: "#aaa", flexShrink: 0 }}>일정에 포함 안 됨</span>}
                    </label>
                    {row && (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "8px", paddingLeft: "26px" }}>
                        <span style={{ fontSize: "12px", color: "#666" }}>체크인</span>
                        <select
                          value={row.checkInDay}
                          onChange={(e) => {
                            const newIn = Number(e.target.value);
                            patchHotel(place.name, {
                              checkInDay: newIn,
                              checkOutDay: row.checkOutDay <= newIn ? newIn + 1 : row.checkOutDay,
                            });
                          }}
                          style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }}
                        >
                          {Array.from({ length: nDays - 1 }, (_, d) => (
                            <option key={d + 1} value={d + 1}>DAY {d + 1}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: "12px", color: "#666" }}>체크아웃</span>
                        <select
                          value={row.checkOutDay}
                          onChange={(e) => patchHotel(place.name, { checkOutDay: Number(e.target.value) })}
                          style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }}
                        >
                          {Array.from({ length: nDays }, (_, d) => d + 1)
                            .filter((day) => day > row.checkInDay)
                            .map((day) => (
                              <option key={day} value={day}>DAY {day}</option>
                            ))}
                        </select>
                        <span style={{ fontSize: "12px", color: "#555", fontWeight: "bold" }}>
                          {row.checkOutDay - row.checkInDay}박
                        </span>
                        {overlappingHotelIndices.has(idx) && (
                          <span style={{ fontSize: "11px", color: "#e53935", width: "100%" }}>
                            ⚠️ 다른 숙소와 숙박 기간이 겹쳐요
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {hotelPlaces.length > 0 && (
                <button
                  onClick={() => setShowHotelSearch((v) => !v)}
                  style={{ background: "none", border: "none", color: "#1976d2", fontSize: "12px", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                >
                  {showHotelSearch ? "숙소 검색 닫기" : "＋ 다른 숙소 검색해서 저장"}
                </button>
              )}
              </>
              )}
            </div>

            {/* ── 출발지 설정 ── */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", fontSize: "14px", marginBottom: "6px", color: "#333" }}>
                ✈️ 출발지 설정 (선택){" "}
                <span
                  title="1일차 출발지는 도착 지점으로, 2일차 이후 출발지는 그날의 시작 지점으로 일정에 들어가요. '마지막 날 복귀 기준'은 하나만 고를 수 있고, 아무것도 고르지 않으면 1일차 출발지로 돌아가요. 체크한 교통 장소만 일정에 들어가요."
                  style={{ cursor: "help", color: "#1976d2", fontWeight: "normal", fontSize: "12px" }}
                >
                  ?
                </span>
              </label>
              <p style={{ fontSize: "12px", color: "#999", margin: "0 0 12px" }}>
                공항, 기차역 등 출발·도착 기준점을 체크하세요. 체크한 곳만 일정에 들어가요.
              </p>

              {(transitPlaces.length === 0 || showDeptSearch) && (
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

              {transitPlaces.map((place) => {
                const idx = settings.departurePoints.findIndex((d) => d.name === place.name);
                const row = idx >= 0 ? settings.departurePoints[idx] : null;
                const sameDay =
                  row != null &&
                  settings.departurePoints.some((o, oi) => oi !== idx && o.day === row.day);
                return (
                  <div
                    key={place.id}
                    style={{
                      padding: "10px 12px", background: row ? "#f5f5f5" : "#fff",
                      borderRadius: "6px", border: `1px solid ${sameDay ? "#e53935" : "#ddd"}`,
                      marginBottom: "8px",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!row}
                        onChange={(e) => (e.target.checked ? assignDeparture(place) : unassignDeparture(place.name))}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <span style={{ flex: 1, minWidth: 0, fontSize: "13px", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        ✈️ {place.name}
                      </span>
                      {!row && <span style={{ fontSize: "11px", color: "#aaa", flexShrink: 0 }}>일정에 포함 안 됨</span>}
                    </label>
                    {row && (
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "8px", paddingLeft: "26px" }}>
                        <span style={{ fontSize: "12px", color: "#666" }}>적용 일차</span>
                        <select
                          value={row.day}
                          onChange={(e) => patchDeparture(place.name, { day: Number(e.target.value) })}
                          style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }}
                        >
                          {Array.from({ length: nDays }, (_, d) => (
                            <option key={d + 1} value={d + 1}>DAY {d + 1}</option>
                          ))}
                        </select>
                        <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={row.isReturnPoint}
                            onChange={(e) => setReturnPoint(idx, e.target.checked)}
                          />
                          마지막 날 복귀 기준
                        </label>
                        {sameDay && (
                          <span style={{ fontSize: "11px", color: "#e53935", width: "100%" }}>
                            ⚠️ 같은 일차에 다른 출발지가 이미 있어요
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {transitPlaces.length > 0 && (
                <button
                  onClick={() => setShowDeptSearch((v) => !v)}
                  style={{ background: "none", border: "none", color: "#1976d2", fontSize: "12px", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                >
                  {showDeptSearch ? "출발지 검색 닫기" : "＋ 공항·기차역 검색해서 저장"}
                </button>
              )}
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
                              padding: "4px 8px",
                              border: `1px solid ${
                                pin.time && (pin.time < settings.startTime || pin.time > settings.endTime)
                                  ? "#e53935"
                                  : "#ccc"
                              }`,
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
                        {pin.time && (pin.time < settings.startTime || pin.time > settings.endTime) && (
                          <span style={{ fontSize: "11px", color: "#e53935", width: "100%" }}>
                            ⚠️ 여행 시간대({settings.startTime}~{settings.endTime}) 밖이에요
                          </span>
                        )}
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

        {/* 생성 전 예상 — 일부가 빠질 것 같으면 미리 알려서 생성 뒤에 놀라지 않게 */}
        {estimate && estimate.excluded > 0 && (
          <div
            role="status"
            style={{
              padding: "12px 30px",
              background: "#fff8e1",
              borderTop: "3px solid #ffd54f",
              color: "#795548",
            }}
          >
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 800 }}>
              📊 {estimate.totalPlaces}곳 중 약 {estimate.included}곳이 일정에 들어가요
            </p>
            <p style={{ margin: "3px 0 0", fontSize: "12px", lineHeight: 1.5 }}>
              설정한 시간 기준으로 하루 최대 {estimate.maxPerDay}곳 × {estimate.nDays}일이라 나머지 {estimate.excluded}곳은 빠질 수 있어요.{" "}
              {settings.priority !== "efficiency"
                ? "여행 기간이나 이용 시간을 늘리거나, 일정 스타일을 '효율적'으로 바꾸면 더 많이 들어가요."
                : "여행 기간이나 이용 시간을 늘리면 더 많이 들어가요."}{" "}
              (예상이라 실제와 조금 다를 수 있어요)
            </p>
          </div>
        )}

        {/* 생성 버튼이 잠긴 이유 — 중간 섹션은 스크롤하면 안 보여서 푸터 바로 위에 배너로 고정 노출 */}
        {!isLoading && !canGenerate && (
          <div
            role="alert"
            style={{
              padding: "14px 30px",
              background: "#ffebee",
              borderTop: "3px solid #e53935",
              color: "#c62828",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 800 }}>
              ⚠️ 아직 일정을 생성할 수 없어요
            </p>
            {readinessIssues.map((issue, i) => (
              <p key={i} style={{ margin: "3px 0 0", fontSize: "13px", lineHeight: 1.5 }}>
                • {issue}
              </p>
            ))}
          </div>
        )}

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