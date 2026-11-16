// src/features/workspace/components/schedule/modal/AiScheduleModal.tsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { estimateSchedule, generateSchedule } from "../../../../../api/schedule.api";
import type { ScheduleEstimate, GeneratedScheduleItem } from "../../../../../api/schedule.api";
import { searchPlaces } from "../../../../../api/place.api";
import type { PlaceSearchItem } from "../../../../../api/place.api";
import { apiMessage } from "../../../hooks/apiError";
import type { GenerationLock } from "../../../hooks/tripChange";
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
  /** 다른 멤버가 이 순간 AI 일정을 만드는 중이면 그 정보 — 모달을 열어 둔 사이에 시작될 수 있다. 끝날 때까지 생성 버튼을 막는다 */
  generationLock?: GenerationLock | null;
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
  { text: "장소 데이터 분석 중...", duration: 1200 },
  { text: "최적 경로 계산 중...", duration: 1500 },
  { text: "시간표 배분 중...", duration: 1200 },
  { text: "일정 마무리 중...", duration: 800 },
];

/** 숙소·출발지 검색 상자 — 검색어 입력, 결과 목록, 바로 추가 */
const InlineSearch: React.FC<{
  title: string;
  placeholder: string;
  emptyHint: string;
  addedSuffix: string;
  query: string;
  onQuery: (v: string) => void;
  onSearch: () => void;
  searching: boolean;
  error: string | null;
  addedName: string | null;
  results: Place[];
  savedPlaces: Place[];
  onAdd: (p: Place) => void;
}> = ({ title, placeholder, emptyHint, addedSuffix, query, onQuery, onSearch, searching, error, addedName, results, savedPlaces, onAdd }) => (
  <div className="ws-ai__search">
    <p className="ws-ai__searchtitle">{title}</p>
    <div className="ws-ai__searchbar">
      <input
        type="text"
        className="tm-input"
        aria-label={title}
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
        placeholder={placeholder}
      />
      <button type="button" className="tm-btn tm-btn--sm" onClick={onSearch} disabled={searching || !query.trim()}>
        {searching ? "검색 중…" : "검색"}
      </button>
    </div>
    {error && <p className="ws-ai__err" role="alert">{error}</p>}
    {addedName && <p className="ws-ai__ok" role="status">‘{addedName}’ {addedSuffix}</p>}
    {results.length > 0 && (
      <div className="ws-ai__results">
        {results.map((place) => {
          const alreadyAdded = savedPlaces.some((p) => p.name === place.name && p.lat === place.lat);
          return (
            <div key={place.id} className="ws-ai__result">
              <div className="ws-ai__resultmain">
                <b>{place.name}</b>
                <span className="ws-all__sub">{place.address || "주소 없음"}</span>
              </div>
              <button type="button" className="tm-btn tm-btn--sm" onClick={() => onAdd(place)} disabled={alreadyAdded}>
                {alreadyAdded ? "추가됨" : "+ 추가"}
              </button>
            </div>
          );
        })}
      </div>
    )}
    {results.length === 0 && !error && !searching && <p className="tm-hint">{emptyHint}</p>}
  </div>
);

/** 라벨 옆 ⓘ 설명 — 누르면 아래로 펼친다 */
const InfoToggle: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="ws-info" aria-label={label} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        i
      </button>
      {open && <p className="tm-hint ws-ai__tip" role="note">{children}</p>}
    </>
  );
};

const AiScheduleModal: React.FC<AiScheduleModalProps> = ({
  onClose,
  onGenerate,
  savedPlaces,
  startDate,
  endDate,
  tripId,
  hasExistingSchedule = false,
  onAddPlace,
  generationLock = null,
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
  const [advOpen, setAdvOpen] = useState(false); // 자세한 설정(숙소·출발지·장소 고정) 펼침
  const [aiInfo, setAiInfo] = useState(false); // "지금 일정이 바뀌어요" 자세히 펼침

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [, setLoadingProgress] = useState(0);
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
    if (generationLock) {
      setErrorMsg(`${generationLock.actorNickname ?? "다른 멤버"}님이 AI 일정을 만드는 중이에요. 끝나면 다시 시도해주세요.`);
      return;
    }
    if (!canGenerate) {
      setErrorMsg(readinessIssues[0]);
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

  const badTime = settings.startTime >= settings.endTime;
  const missingCoords = savedPlaces.filter((p) => p.lat == null).length;

  return (
    <div
      className="tm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        className="tm-modal ws-ai"
        role="dialog"
        aria-modal="true"
        aria-label="AI 일정 생성"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="tm-modal__head">
          <h2 className="tm-modal__title">AI 일정 생성</h2>
          <button type="button" className="tm-btn tm-btn--sm" onClick={onClose} disabled={isLoading}>
            닫기
          </button>
        </div>

        {/* ── 생성 중 · 생성 결과 ── (시안: 단계 목록 → 완료 안내) */}
        {isLoading && (
          <div className="ws-ai__loading" role="status" aria-live="polite">
            <h3 className="ws-ai__loadtitle">
              {pinWarnings.length > 0 || excludedPlaces.length > 0 ? "AI 일정 생성 완료" : "AI 일정 생성 중..."}
            </h3>

            <ul className="tm-progress-steps">
              {LOADING_STEPS.map((step, i) => (
                <li key={step.text} className={loadingStep > i ? "ok" : loadingStep === i ? "on" : ""}>
                  {loadingStep > i ? "✓ " : ""}
                  {step.text}
                </li>
              ))}
            </ul>
            {/* 실제 경과 시간 (가짜 퍼센트 아님) */}
            <p className="tm-hint">{elapsed}초 경과</p>

            {/* pin 경고 표시 (로딩 완료 후) */}
            {pinWarnings.length > 0 && (
              <div className="tm-notice tm-notice--warn">
                <b>고정 장소 시간 경고</b>
                {pinWarnings.map((w, i) => (
                  <div key={i}>· {w}</div>
                ))}
              </div>
            )}

            {/* 제외된 장소 표시 (로딩 완료 후) */}
            {excludedPlaces.length > 0 && (
              <div className="tm-notice tm-notice--warn">
                <b>이번 일정에 넣지 못했어요</b>
                {excludedPlaces.map((e, i) => (
                  <div key={i}>
                    · DAY {e.day} — {e.name} —{" "}
                    {e.reason === "meal_slot_limit"
                      ? "식사 시간대에 넣을 수 있는 맛집 수를 넘었어요"
                      : e.reason === "cafe_limit"
                      ? "하루 카페 개수 제한을 넘었어요"
                      : e.reason === "capacity"
                      ? "하루 시간 안에 다 들어가지 않아요"
                      : e.reason === "over_time"
                      ? "설정한 종료 시간을 넘겨서 뺐어요"
                      : "이번 일정에 넣지 못했어요"}
                  </div>
                ))}
                <div className="tm-hint tm-mt-1">
                  일정 미포함으로 남아 있어요. 직접 추가하거나, 일정 스타일·일수를 바꿔 다시 생성해보세요.
                </div>
              </div>
            )}

            {/* 경고/안내가 있을 때만 — 4초 기다리지 않고 바로 넘어가는 버튼 */}
            {(pinWarnings.length > 0 || excludedPlaces.length > 0) && (
              <div className="ws-ai__loadfoot">
                <button type="button" className="tm-btn tm-btn--primary" onClick={finishGeneration}>
                  확인하고 계속하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 바디 ── */}
        <div className="tm-modal__body ws-ai__body">
          <p className="tm-hint ws-ai__count">
            저장된 장소 {savedPlaces.length}곳 · 방문 대상 {visitPlaces.length}곳 · {startDate} ~ {endDate} ({nDays}일)
            {missingCoords > 0 && ` · 좌표 없는 장소 ${missingCoords}곳 제외`}
          </p>

          {/* 이미 만든 일정이 있으면 바뀐다는 안내 (시안의 경고 줄) */}
          {hasExistingSchedule && (
            <>
              <div className="ws-warnline">
                <span className="tm-grow">지금 일정이 새 일정으로 바뀌어요.</span>
                <button
                  type="button"
                  className="tm-btn tm-btn--link tm-btn--sm"
                  aria-expanded={aiInfo}
                  onClick={() => setAiInfo((v) => !v)}
                >
                  {aiInfo ? "접기" : "자세히"}
                </button>
              </div>
              {aiInfo && (
                <ul className="ws-ailist">
                  <li>새 일정에도 있는 장소는 메모와 지출·바우처 연결이 남아요</li>
                  <li>새 일정에서 빠지는 장소와 직접 넣은 장소는 메모와 연결이 사라져요</li>
                  <li>시각·순서·머무는 시간은 새로 계산돼요</li>
                </ul>
              )}
            </>
          )}

          {/* 에러 메시지 */}
          {errorMsg && <div className="tm-notice tm-notice--danger tm-mb-3" role="alert">{errorMsg}</div>}

          {/* ── 시간 ── */}
          <div className="ws-when ws-when--2">
            <div className="ws-when__cell">
              <label className="ws-when__l" htmlFor="ws-ai-start">시작 시간</label>
              <input
                id="ws-ai-start"
                type="time"
                className={`tm-input ws-when__in${badTime ? " tm-input--error" : ""}`}
                value={settings.startTime}
                onChange={(e) => updateSetting("startTime", e.target.value)}
              />
            </div>
            <div className="ws-when__cell">
              <label className="ws-when__l" htmlFor="ws-ai-end">종료 시간</label>
              <input
                id="ws-ai-end"
                type="time"
                className={`tm-input ws-when__in${badTime ? " tm-input--error" : ""}`}
                value={settings.endTime}
                onChange={(e) => updateSetting("endTime", e.target.value)}
              />
            </div>
          </div>
          {badTime && <p className="ws-ai__err">종료 시간은 시작 시간보다 늦어야 해요</p>}

          {/* ── 이동수단 ── */}
          <label className="tm-label">이동수단</label>
          <div className="tm-seg ws-aiseg" role="group" aria-label="이동수단">
            {[
              { value: "walk", label: "도보", desc: "가까운 거리 위주로 이동해요" },
              { value: "public", label: "대중교통", desc: "지하철·버스로 이동해요" },
              { value: "car", label: "자동차", desc: "렌터카·택시로 이동해요" },
            ].map((mode) => (
              <button
                key={mode.value}
                type="button"
                className={settings.transportMode === mode.value ? "is-on" : ""}
                aria-pressed={settings.transportMode === mode.value}
                onClick={() => updateSetting("transportMode", mode.value as AiScheduleSettings["transportMode"])}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <p className="ws-aidesc">
            {settings.transportMode === "walk"
              ? "가까운 거리 위주로 이동해요"
              : settings.transportMode === "public"
              ? "지하철·버스로 이동해요"
              : "렌터카·택시로 이동해요"}
            {" · 이동 시간은 직선 거리 기반 추정이에요"}
          </p>

          {/* ── 일정 스타일 ── */}
          <label className="tm-label">일정 스타일</label>
          <div className="tm-seg ws-aiseg" role="group" aria-label="일정 스타일">
            {[
              { value: "efficiency", label: "효율적" },
              { value: "balanced", label: "균형 잡힌" },
              { value: "relaxed", label: "여유로운" },
            ].map((mode) => (
              <button
                key={mode.value}
                type="button"
                className={settings.priority === mode.value ? "is-on" : ""}
                aria-pressed={settings.priority === mode.value}
                onClick={() => updateSetting("priority", mode.value as AiScheduleSettings["priority"])}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <p className="ws-aidesc">
            {settings.priority === "efficiency"
              ? "많은 곳을 방문해요"
              : settings.priority === "balanced"
              ? "적당한 페이스로 돌아요"
              : "느긋하게 즐겨요"}
          </p>

          {/* ── 자세한 설정 (식사 · 숙소 · 출발지 · 장소 고정) ── */}
          <button
            type="button"
            className="ws-morebar"
            aria-expanded={advOpen}
            aria-controls="ws-ai-adv"
            onClick={() => setAdvOpen((v) => !v)}
          >
            <b>자세한 설정</b>
            <span className="tm-hint tm-ellipsis">
              {advOpen
                ? "접기 ▴"
                : `${settings.includeMeals ? "식사 포함" : "식사 없음"} · 숙소 ${settings.hotels.length}곳 · 출발지 ${settings.departurePoints.length}곳 ▾`}
            </span>
          </button>

          {advOpen && (
            <div id="ws-ai-adv" className="ws-aimore">
            {/* ── 식사 시간 ── */}
            <section className="ws-ai__sec">
              <label className="tm-check">
                <input
                  type="checkbox"
                  checked={settings.includeMeals}
                  onChange={(e) => updateSetting("includeMeals", e.target.checked)}
                />
                <span>식사 시간 포함</span>
              </label>
              {settings.includeMeals && (
                <div className="ws-ai__meals">
                  {[
                    { key: "lunchTime" as const, label: "점심", options: MEAL_TIME_OPTIONS.lunch },
                    { key: "dinnerTime" as const, label: "저녁", options: MEAL_TIME_OPTIONS.dinner },
                  ].map(({ key, label, options }) => (
                    <label key={key} className="ws-ai__meal">
                      {label}
                      <select
                        className="tm-select"
                        value={settings[key]}
                        onChange={(e) => updateSetting(key, e.target.value)}
                      >
                        {options.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <span className="tm-hint">이 시각 전후로 맛집이 배치돼요 (30분 전 ~ 1시간 30분 후)</span>
                </div>
              )}
              {mealCapacityWarning && <div className="tm-notice tm-notice--warn tm-mt-2">{mealCapacityWarning}</div>}
            </section>

              {/* ── 숙소 설정 ── */}
              <section className="ws-ai__sec">
                <h3 className="ws-ai__h">
                  숙소 <span className="tm-hint">(선택)</span>
                  <InfoToggle label="숙소 설정 설명">
                    체크인 DAY 1 → 체크아웃 DAY 3은 1·2일차 밤(2박)을 그 숙소에서 잔다는 뜻이에요. 체크아웃하는 날 아침엔 그 숙소에서 출발하고, 밤마다 그 숙소로 돌아가요. 체크한 숙소만 일정에 들어가요.
                  </InfoToggle>
                </h3>
                <p className="tm-hint ws-ai__note">이번 여행에서 묵는 숙소를 체크하세요. 체크한 숙소만 일정에 들어가요.</p>
                {nDays <= 1 && <div className="tm-notice tm-notice--warn">당일치기 여행에는 숙소 배정이 필요 없어요.</div>}
                {nDays > 1 && (
                  <>
                    {(hotelPlaces.length === 0 || showHotelSearch) && (
                      <InlineSearch
                        title="숙소를 검색해서 바로 추가하세요"
                        placeholder="숙소명 검색 (예: 신라호텔, 도톤보리 호텔)"
                        emptyHint="검색 후 숙소를 선택하면 장소 목록에 자동으로 추가돼요."
                        addedSuffix="숙소로 추가했어요"
                        query={hotelSearchQuery}
                        onQuery={setHotelSearchQuery}
                        onSearch={handleHotelSearch}
                        searching={isHotelSearching}
                        error={hotelSearchError}
                        addedName={hotelAddedName}
                        results={hotelSearchResults}
                        savedPlaces={savedPlaces}
                        onAdd={handleHotelAdd}
                      />
                    )}

                    {hotelPlaces.map((place) => {
                      const idx = settings.hotels.findIndex((h) => h.name === place.name);
                      const row = idx >= 0 ? settings.hotels[idx] : null;
                      const overlap = !!row && overlappingHotelIndices.has(idx);
                      return (
                        <div key={place.id} className={`ws-ai__item${overlap ? " is-bad" : ""}`}>
                          <label className="tm-check ws-ai__itemhead">
                            <input
                              type="checkbox"
                              checked={!!row}
                              onChange={(e) => (e.target.checked ? assignHotel(place) : unassignHotel(place.name))}
                            />
                            <span className="tm-ellipsis">{place.name}</span>
                            {!row && <span className="tm-hint ws-ai__off">일정에 포함 안 됨</span>}
                          </label>
                          {row && (
                            <div className="ws-ai__itemopts">
                              <label>
                                체크인
                                <select
                                  className="tm-select"
                                  value={row.checkInDay}
                                  onChange={(e) => {
                                    const newIn = Number(e.target.value);
                                    patchHotel(place.name, {
                                      checkInDay: newIn,
                                      checkOutDay: row.checkOutDay <= newIn ? newIn + 1 : row.checkOutDay,
                                    });
                                  }}
                                >
                                  {Array.from({ length: nDays - 1 }, (_, d) => (
                                    <option key={d + 1} value={d + 1}>DAY {d + 1}</option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                체크아웃
                                <select
                                  className="tm-select"
                                  value={row.checkOutDay}
                                  onChange={(e) => patchHotel(place.name, { checkOutDay: Number(e.target.value) })}
                                >
                                  {Array.from({ length: nDays }, (_, d) => d + 1)
                                    .filter((day) => day > row.checkInDay)
                                    .map((day) => (
                                      <option key={day} value={day}>DAY {day}</option>
                                    ))}
                                </select>
                              </label>
                              <b>{row.checkOutDay - row.checkInDay}박</b>
                              {overlap && <span className="ws-ai__err ws-ai__full">다른 숙소와 숙박 기간이 겹쳐요</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {hotelPlaces.length > 0 && (
                      <button type="button" className="ws-link ws-ai__linkbtn" onClick={() => setShowHotelSearch((v) => !v)}>
                        {showHotelSearch ? "숙소 검색 닫기" : "+ 다른 숙소 검색해서 저장"}
                      </button>
                    )}
                  </>
                )}
              </section>

              {/* ── 출발지 설정 ── */}
              <section className="ws-ai__sec">
                <h3 className="ws-ai__h">
                  출발지 <span className="tm-hint">(선택)</span>
                  <InfoToggle label="출발지 설정 설명">
                    1일차 출발지는 도착 지점으로, 2일차 이후 출발지는 그날의 시작 지점으로 일정에 들어가요. ‘마지막 날 복귀 기준’은 하나만 고를 수 있고, 아무것도 고르지 않으면 1일차 출발지로 돌아가요. 체크한 교통 장소만 일정에 들어가요.
                  </InfoToggle>
                </h3>
                <p className="tm-hint ws-ai__note">공항, 기차역 등 출발·도착 기준점을 체크하세요. 체크한 곳만 일정에 들어가요.</p>

                {(transitPlaces.length === 0 || showDeptSearch) && (
                  <InlineSearch
                    title="출발지를 검색해서 바로 추가하세요"
                    placeholder="출발지 검색 (예: 인천공항, 오사카역)"
                    emptyHint="검색 후 선택하면 장소 목록에 자동으로 추가돼요."
                    addedSuffix="장소로 추가했어요"
                    query={deptSearchQuery}
                    onQuery={setDeptSearchQuery}
                    onSearch={handleDeptSearch}
                    searching={isDeptSearching}
                    error={deptSearchError}
                    addedName={deptAddedName}
                    results={deptSearchResults}
                    savedPlaces={savedPlaces}
                    onAdd={handleDeptAdd}
                  />
                )}

                {transitPlaces.map((place) => {
                  const idx = settings.departurePoints.findIndex((d) => d.name === place.name);
                  const row = idx >= 0 ? settings.departurePoints[idx] : null;
                  const sameDay =
                    row != null && settings.departurePoints.some((o, oi) => oi !== idx && o.day === row.day);
                  return (
                    <div key={place.id} className={`ws-ai__item${sameDay ? " is-bad" : ""}`}>
                      <label className="tm-check ws-ai__itemhead">
                        <input
                          type="checkbox"
                          checked={!!row}
                          onChange={(e) => (e.target.checked ? assignDeparture(place) : unassignDeparture(place.name))}
                        />
                        <span className="tm-ellipsis">{place.name}</span>
                        {!row && <span className="tm-hint ws-ai__off">일정에 포함 안 됨</span>}
                      </label>
                      {row && (
                        <div className="ws-ai__itemopts">
                          <label>
                            적용 일차
                            <select
                              className="tm-select"
                              value={row.day}
                              onChange={(e) => patchDeparture(place.name, { day: Number(e.target.value) })}
                            >
                              {Array.from({ length: nDays }, (_, d) => (
                                <option key={d + 1} value={d + 1}>DAY {d + 1}</option>
                              ))}
                            </select>
                          </label>
                          <label className="tm-check">
                            <input
                              type="checkbox"
                              checked={row.isReturnPoint}
                              onChange={(e) => setReturnPoint(idx, e.target.checked)}
                            />
                            <span>마지막 날 복귀 기준</span>
                          </label>
                          {sameDay && <span className="ws-ai__err ws-ai__full">같은 일차에 다른 출발지가 이미 있어요</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
                {transitPlaces.length > 0 && (
                  <button type="button" className="ws-link ws-ai__linkbtn" onClick={() => setShowDeptSearch((v) => !v)}>
                    {showDeptSearch ? "출발지 검색 닫기" : "+ 공항·기차역 검색해서 저장"}
                  </button>
                )}
              </section>

              {/* ── 장소 고정 ── */}
              <section className="ws-ai__sec">
                <h3 className="ws-ai__h">
                  특정 날짜에 장소 고정 <span className="tm-hint">(선택)</span>
                </h3>
                <p className="tm-hint ws-ai__note">
                  반드시 특정 날에 방문해야 하는 장소를 지정해요. 시간을 비워두면 AI가 가장 알맞은 위치에 배치해요.
                </p>
                {settings.pinnedPlaces.map((pin, i) => {
                  const place = savedPlaces.find((p) => p.id === pin.placeId);
                  if (!place) return null;
                  const outside = !!pin.time && (pin.time < settings.startTime || pin.time > settings.endTime);
                  return (
                    <div key={i} className={`ws-ai__item${outside ? " is-bad" : ""}`}>
                      <div className="ws-ai__itemopts ws-ai__pin">
                        <b className="tm-grow tm-ellipsis">{place.name}</b>
                        <select
                          className="tm-select"
                          aria-label={`${place.name} 방문 일차`}
                          value={pin.day}
                          onChange={(e) => {
                            const next = [...settings.pinnedPlaces];
                            next[i] = { ...next[i], day: Number(e.target.value) };
                            updateSetting("pinnedPlaces", next);
                          }}
                        >
                          {Array.from({ length: nDays }, (_, d) => (
                            <option key={d + 1} value={d + 1}>DAY {d + 1}</option>
                          ))}
                        </select>
                        <input
                          type="time"
                          className={`tm-input ws-ai__time${outside ? " tm-input--error" : ""}`}
                          aria-label={`${place.name} 방문 시각 (선택)`}
                          value={pin.time}
                          onChange={(e) => {
                            const next = [...settings.pinnedPlaces];
                            next[i] = { ...next[i], time: e.target.value };
                            updateSetting("pinnedPlaces", next);
                          }}
                        />
                        <button
                          type="button"
                          className="tm-btn tm-btn--sm tm-btn--danger"
                          onClick={() =>
                            updateSetting("pinnedPlaces", settings.pinnedPlaces.filter((_, idx) => idx !== i))
                          }
                        >
                          제거
                        </button>
                        {outside && (
                          <span className="ws-ai__err ws-ai__full">
                            여행 시간대({settings.startTime}~{settings.endTime}) 밖이에요
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <select
                  className="tm-select ws-ai__addpin"
                  aria-label="고정할 장소 고르기"
                  value=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    if (settings.pinnedPlaces.some((p) => p.placeId === id)) {
                      setErrorMsg("이미 고정된 장소입니다.");
                      return;
                    }
                    updateSetting("pinnedPlaces", [...settings.pinnedPlaces, { placeId: id, day: 1, time: "" }]);
                  }}
                >
                  <option value="">+ 고정할 장소 고르기</option>
                  {visitPlaces.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.name} ({place.category})
                    </option>
                  ))}
                </select>
              </section>
            </div>
          )}
        </div>

        {/* 생성 전 예상 — 일부가 빠질 것 같으면 미리 알려서 생성 뒤에 놀라지 않게 */}
        {estimate && estimate.excluded > 0 && (
          <div className="tm-notice tm-notice--warn ws-ai__banner" role="status">
            <b>{estimate.totalPlaces}곳 중 약 {estimate.included}곳이 일정에 들어가요</b>
            <p>
              설정한 시간 기준으로 하루 최대 {estimate.maxPerDay}곳 × {estimate.nDays}일이라 나머지 {estimate.excluded}곳은 빠질 수 있어요.{" "}
              {settings.priority !== "efficiency"
                ? "여행 기간이나 이용 시간을 늘리거나, 일정 스타일을 ‘효율적’으로 바꾸면 더 많이 들어가요."
                : "여행 기간이나 이용 시간을 늘리면 더 많이 들어가요."}{" "}
              (예상이라 실제와 조금 다를 수 있어요)
            </p>
          </div>
        )}

        {/* 생성 버튼이 잠긴 이유 — 중간 섹션은 스크롤하면 안 보여서 푸터 바로 위에 배너로 고정 노출 */}
        {!isLoading && !canGenerate && (
          <div className="tm-notice tm-notice--danger ws-ai__banner" role="alert">
            <b>아직 일정을 생성할 수 없어요</b>
            {readinessIssues.map((issue, i) => (
              <p key={i}>• {issue}</p>
            ))}
          </div>
        )}

        {/* ── 푸터 ── */}
        <div className="tm-modal__foot">
          <button type="button" className="tm-btn" onClick={onClose} disabled={isLoading}>
            취소
          </button>
          <button
            type="button"
            className="tm-btn tm-btn--primary"
            onClick={handleSubmit}
            disabled={isLoading || !canGenerate || generationLock !== null}
            title={generationLock ? "다른 멤버가 AI 일정을 만드는 중이에요" : !canGenerate ? readinessIssues[0] : undefined}
          >
            {isLoading ? "AI 생성 중…" : generationLock ? "다른 멤버가 생성 중" : hasExistingSchedule ? "새 일정으로 바꾸기" : "일정 생성"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiScheduleModal;