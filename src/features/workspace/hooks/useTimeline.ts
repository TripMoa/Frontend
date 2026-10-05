// src/features/workspace/hooks/useTimeline.ts
import { useEffect, useState, useCallback, useRef } from "react";
import {
  getSchedules,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  reorderScheduleItems,
  moveScheduleItem,
  ensureScheduleDay,
  getScheduleDay,
  setScheduleAutoCompute,
  updateScheduleSettings,
  updateScheduleItemPlan,
  replaceScheduleItemPlace,
  updateScheduleItemMemo,
} from "../../../api/schedule.api";
import { CATEGORY_FROM_BACKEND, CATEGORY_TO_BACKEND } from "./schedule.constants";
import { apiMessage } from "./apiError";

interface PlaceInfo {
  name: string;
  address?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  lat?: number;
  lng?: number;
}

// 자동 시각 계산(엔진)에서 나온 경고 — code: late_for_pin | meal_outside_window | after_midnight | travel_unrealistic | over_end
export interface ScheduleWarning {
  itemId?: number | null;      // 없으면 그 날 전체에 대한 경고
  code: string;
  message: string;
  overMinutes?: number | null;
  suggestMoveItemId?: number | null; // over_end: "다른 날로 옮길까요?"의 대상 노드
}

// 한 일차의 자동 계산 상태와 설정
export interface DayInfo {
  scheduleId: number;
  autoCompute: boolean;
  startTime?: string | null;
  endTime?: string | null;
  transportMode?: string | null;
  overMinutes: number;
  warnings: ScheduleWarning[];
}

export interface TimelineNode {
  id?: number;
  scheduleId?: number;
  time: string;
  stayMinutes?: number;     // 머무는 시간(분) — 자동 계산의 기준
  endTime?: string;         // time + stayMinutes
  pinnedTime?: string;      // 고정 시각(HH:MM)
  memo?: string;            // 멤버 공용 메모
  warnings?: ScheduleWarning[];
  title: string;
  desc: string;
  travelMinutes?: number;   // 다음 장소까지 이동시간 (분)
  travelPayment?: number;   // 다음 장소까지 대중교통 요금 (원)
  travelTransfer?: number;  // 다음 장소까지 환승 횟수
  placeInfo?: PlaceInfo;
}

interface ScheduleItemResponse {
  id: number;
  time: string;
  title: string;
  category?: string;
  description: string;
  orderIndex: number;
  lat?: number;
  lng?: number;
  travelMinutes?: number;
  travelPayment?: number;
  travelTransfer?: number;
  stayMinutes?: number | null;
  endTime?: string | null;
  pinnedTime?: string | null;
  memo?: string | null;
  warnings?: ScheduleWarning[];
}

interface ScheduleResponse {
  scheduleId: number;
  day: number;
  items: ScheduleItemResponse[];
  autoCompute?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  transportMode?: string | null;
  overMinutes?: number | null;
  warnings?: ScheduleWarning[];
}

function toTimelineNodes(
  scheduleId: number,
  items: ScheduleItemResponse[],
  previous: TimelineNode[] = [],
): TimelineNode[] {
  const prevById = new Map(previous.filter((n) => n.id != null).map((n) => [n.id, n]));
  return items.map((item) => {
    // 서버 응답에 없는 화면용 정보(평점·설명·이미지)는 이전 노드에서 이어받는다
    // (장소가 바뀐 노드는 이름이 달라졌으니 이전 장소의 평점·설명은 버린다)
    const before = prevById.get(item.id)?.placeInfo;
    const prevInfo = before && before.name === item.title ? before : undefined;
    return {
      id: item.id,
      scheduleId,
      time: item.time,
      stayMinutes: item.stayMinutes ?? undefined,
      endTime: item.endTime ?? undefined,
      pinnedTime: item.pinnedTime ?? undefined,
      memo: item.memo ?? undefined,
      warnings: item.warnings ?? [],
      title: item.title,
      desc: item.description,
      travelMinutes: item.travelMinutes,
      travelPayment: item.travelPayment,
      travelTransfer: item.travelTransfer,
      placeInfo: {
        ...prevInfo,
        name: item.title,
        address: item.description,
        category: item.category ? (CATEGORY_FROM_BACKEND[item.category] ?? item.category) : item.category,
        lat: item.lat ?? prevInfo?.lat,
        lng: item.lng ?? prevInfo?.lng,
      },
    };
  });
}

function toDayInfo(schedule: ScheduleResponse): DayInfo {
  return {
    scheduleId: schedule.scheduleId,
    autoCompute: !!schedule.autoCompute,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    transportMode: schedule.transportMode,
    overMinutes: schedule.overMinutes ?? 0,
    warnings: schedule.warnings ?? [],
  };
}

function toDayKey(day: number): string {
  return `DAY ${day}`;
}

export const useTimeline = (currentDay: string, tripId: number | null) => {
  const [nodes, setNodes] = useState<TimelineNode[]>([]);
  const [allDays, setAllDays] = useState<Record<string, TimelineNode[]>>({});
  const [scheduleIdMap, setScheduleIdMap] = useState<Record<string, number>>({});
  const [dayInfo, setDayInfo] = useState<Record<string, DayInfo>>({});
  const dayInfoRef = useRef<Record<string, DayInfo>>({});
  dayInfoRef.current = dayInfo;
  const allDaysRef = useRef<Record<string, TimelineNode[]>>({});
  allDaysRef.current = allDays;
  const [loading, setLoading] = useState(false);
  // error: 불러오기 실패, actionError: 추가/수정/삭제 같은 조작 실패 (화면에서 토스트로 보여준다)
  // 조작 실패 뒤에 서버 기준으로 다시 불러오는데(fetchAll), 그때 error를 지우면 안내가 바로 사라지므로 따로 둔다
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ message: string; key: number } | null>(null);
  const reportError = useCallback((message: string) => {
    setActionError({ message, key: Date.now() });
  }, []);
  const ensureRef = useRef<Record<string, Promise<number>>>({});

  const fetchAll = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getSchedules(tripId);
      const mapped: Record<string, TimelineNode[]> = {};
      const idMap: Record<string, number> = {};
      const infoMap: Record<string, DayInfo> = {};
      data.forEach((schedule: ScheduleResponse) => {
        const key = toDayKey(schedule.day);
        mapped[key] = toTimelineNodes(schedule.scheduleId, schedule.items, allDaysRef.current[key]);
        idMap[key] = schedule.scheduleId;
        infoMap[key] = toDayInfo(schedule);
      });
      setAllDays(mapped);
      setScheduleIdMap(idMap);
      setDayInfo(infoMap);
    } catch {
      setError("일정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!currentDay || currentDay === "DAY ALL") { setNodes([]); return; }
    setNodes(allDays[currentDay] ?? []);
  }, [currentDay, allDays]);

  // AI 일정 생성 결과 반영 — 생성은 트립의 모든 일차를 새로 만들기 때문에(백엔드가 기존 일정을 전부 삭제 후 재생성)
  // 기존 상태와 합치지 않고 통째로 교체해야 예전 일차/옛 scheduleId가 남지 않는다.
  const loadFromExternal = useCallback(
    (allDaysData: Record<string, TimelineNode[]>) => {
      setAllDays(allDaysData);
      if (currentDay && currentDay !== "DAY ALL") {
        setNodes(allDaysData[currentDay] ?? []);
      }
      // scheduleIdMap도 교체 — 노드의 scheduleId로 역추적 (빈 날은 이어서 refetch가 채움)
      const nextIdMap: Record<string, number> = {};
      Object.entries(allDaysData).forEach(([dayKey, nodes]) => {
        const scheduleId = nodes.find((n) => n.scheduleId != null)?.scheduleId;
        if (scheduleId != null) nextIdMap[dayKey] = scheduleId;
      });
      setScheduleIdMap(nextIdMap);
    },
    [currentDay]
  );

  // 서버가 돌려준 한 일차(자동 계산 결과 포함)를 화면 상태에 반영
  const applyDay = useCallback((schedule: ScheduleResponse) => {
    const key = toDayKey(schedule.day);
    setAllDays((prev) => ({ ...prev, [key]: toTimelineNodes(schedule.scheduleId, schedule.items, prev[key]) }));
    setScheduleIdMap((prev) => ({ ...prev, [key]: schedule.scheduleId }));
    setDayInfo((prev) => ({ ...prev, [key]: toDayInfo(schedule) }));
  }, []);

  // 노드 구성이 바뀐 뒤(추가·삭제·순서·이동) 자동 계산이 켜진 날이면 서버가 다시 계산한 시각을 받아온다.
  // (서버는 변경을 커밋한 직후 계산을 끝내고 응답하므로 여기서 받는 값이 이미 최신이다)
  const refreshIfAuto = useCallback(async (dayKey: string, scheduleId?: number | null) => {
    const id = scheduleId ?? dayInfoRef.current[dayKey]?.scheduleId;
    if (!id || !dayInfoRef.current[dayKey]?.autoCompute) return;
    try {
      const { data } = await getScheduleDay(id);
      applyDay(data as ScheduleResponse);
    } catch {
      /* 다음 조회 때 맞춰진다 — 조작 자체는 성공했으므로 안내하지 않는다 */
    }
  }, [applyDay]);

  // 해당 일차의 scheduleId — AI 생성 전이라 아직 없으면 서버에 일차 행을 만들어 받아온다(동시 호출은 하나로 합침)
  const ensureScheduleId = useCallback(async (dayKey: string): Promise<number | null> => {
    const known = scheduleIdMap[dayKey];
    if (known) return known;
    const day = Number(/^DAY (\d+)$/.exec(dayKey)?.[1] ?? 0);
    if (!tripId || day < 1) return null;
    if (!ensureRef.current[dayKey]) {
      ensureRef.current[dayKey] = ensureScheduleDay(tripId, day)
        .then(({ data }) => {
          const id = data.scheduleId as number;
          setScheduleIdMap((prev) => ({ ...prev, [dayKey]: id }));
          return id;
        })
        .finally(() => {
          delete ensureRef.current[dayKey];
        });
    }
    return ensureRef.current[dayKey];
  }, [scheduleIdMap, tripId]);

  const addNode = useCallback(async () => {
    try {
      const scheduleId = await ensureScheduleId(currentDay);
      if (!scheduleId) {
        reportError("이 일차에는 일정을 추가할 수 없어요.");
        return;
      }
      const { data } = await createScheduleItem({
        scheduleId, time: "00:00", title: "NEW", description: "",
      });
      const newNode: TimelineNode = {
        id: data.id, scheduleId,
        time: data.time, title: data.title, desc: data.description,
      };
      setNodes((prev) => {
        const next = [...prev, newNode];
        setAllDays((d) => ({ ...d, [currentDay]: next }));
        return next;
      });
    } catch (e) {
      reportError(apiMessage(e, "노드 추가에 실패했습니다."));
    }
  }, [currentDay, ensureScheduleId, reportError]);

  // 장소 검색으로 노드 추가 — 장소 정보를 그대로 노드로 생성
  const addNodeFromPlace = useCallback(async (place: {
    name: string;
    category?: string;
    address?: string;
    lat?: number;
    lng?: number;
    description?: string;
    rating?: number;
  }) => {
    try {
      const scheduleId = await ensureScheduleId(currentDay);
      if (!scheduleId) {
        reportError("이 일차에는 일정을 추가할 수 없어요.");
        throw new Error("no scheduleId");
      }
      const { data } = await createScheduleItem({
        scheduleId,
        time: "00:00",
        title: place.name,
        description: place.address ?? "",
        // 카테고리·좌표도 저장해야 새로고침 뒤에도 지도 표시·카테고리 색/잠금이 유지된다
        category: place.category ? (CATEGORY_TO_BACKEND[place.category] ?? place.category) : undefined,
        lat: place.lat,
        lng: place.lng,
      });
      const newNode: TimelineNode = {
        id: data.id,
        scheduleId,
        time: data.time,
        title: data.title,
        desc: data.description,
        placeInfo: {
          name: place.name,
          category: place.category ?? "",
          address: place.address ?? "",
          lat: place.lat,
          lng: place.lng,
          description: place.description,
          rating: place.rating,
        },
      };
      setNodes((prev) => {
        const next = [...prev, newNode];
        setAllDays((d) => ({ ...d, [currentDay]: next }));
        return next;
      });
      await refreshIfAuto(currentDay, scheduleId);
    } catch (e) {
      reportError(apiMessage(e, "노드 추가에 실패했습니다."));
      throw e; // 호출자(AddPlaceModal 등)가 성공/실패를 구분해서 피드백을 줄 수 있게 재전파
    }
  }, [currentDay, ensureScheduleId, refreshIfAuto, reportError]);

  const updateNode = useCallback(async (idx: number, field: string, value: string) => {
    const node = nodes[idx];
    if (!node?.id) return;

    setNodes((prev) => {
      const next = prev.map((n, i) => (i === idx ? { ...n, [field]: value } : n));
      setAllDays((d) => ({ ...d, [currentDay]: next }));
      return next;
    });

    const patch: { time?: string; title?: string; description?: string } = {};
    if (field === "time") patch.time = value;
    else if (field === "title") patch.title = value;
    else if (field === "desc") patch.description = value;

    try {
      await updateScheduleItem(node.id, patch);
    } catch {
      reportError("노드 수정에 실패했습니다.");
      fetchAll();
    }
  }, [nodes, currentDay, fetchAll, reportError]);

  const deleteNode = useCallback(async (idx: number) => {
    const node = nodes[idx];
    if (!node?.id) return;

    setNodes((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setAllDays((d) => ({ ...d, [currentDay]: next }));
      return next;
    });

    try {
      await deleteScheduleItem(node.id);
      await refreshIfAuto(currentDay, node.scheduleId);
    } catch (e) {
      reportError(apiMessage(e, "노드 삭제에 실패했습니다."));
      fetchAll();
    }
  }, [nodes, currentDay, fetchAll, refreshIfAuto, reportError]);

  const reorderNodes = useCallback(async (fromIdx: number, toIdx: number) => {
    const next = [...nodes];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);

    setNodes(next);
    setAllDays((d) => ({ ...d, [currentDay]: next }));

    const itemIds = next.map((n) => n.id).filter((id): id is number => id != null);
    try {
      await reorderScheduleItems(itemIds);
      await refreshIfAuto(currentDay);
    } catch (e) {
      reportError(apiMessage(e, "순서 변경에 실패했습니다."));
      fetchAll();
    }
  }, [nodes, currentDay, fetchAll, refreshIfAuto, reportError]);

  const moveNodeToDay = useCallback(async (idx: number, targetDay: string) => {
    const node = nodes[idx];
    if (!node?.id) return;

    let targetScheduleId: number | null = null;
    try {
      targetScheduleId = await ensureScheduleId(targetDay);
    } catch {
      /* 아래에서 안내 */
    }
    if (!targetScheduleId) {
      reportError("일정 이동에 실패했습니다.");
      return;
    }

    const nextNodes = nodes.filter((_, i) => i !== idx);
    setNodes(nextNodes);
    setAllDays((prev) => ({
      ...prev,
      [currentDay]: nextNodes,
      [targetDay]: [...(prev[targetDay] ?? []), { ...node, scheduleId: targetScheduleId }],
    }));

    try {
      await moveScheduleItem(node.id, targetScheduleId);
      // 떠나는 날과 도착하는 날 모두 시각이 달라진다
      await Promise.all([
        refreshIfAuto(currentDay),
        refreshIfAuto(targetDay, targetScheduleId),
      ]);
    } catch (e) {
      reportError(apiMessage(e, "일정 이동에 실패했습니다."));
      fetchAll();
    }
  }, [nodes, currentDay, ensureScheduleId, fetchAll, refreshIfAuto, reportError]);

  // ── 계산되는 일정: 머무는 시간·고정 시각·자동 계산·설정 ──────────────────────────────
  // 서버가 그 일차를 다시 계산해 돌려주므로 응답을 그대로 반영한다(화면이 임의로 시각을 계산하지 않는다)

  const runDayAction = useCallback(async (
    action: () => Promise<{ data: unknown }>,
    failMessage: string,
  ): Promise<boolean> => {
    try {
      const { data } = await action();
      applyDay(data as ScheduleResponse);
      return true;
    } catch (e) {
      reportError(apiMessage(e, failMessage));
      return false;
    }
  }, [applyDay, reportError]);

  // 머무는 시간(분) 변경
  const setNodeStay = useCallback(async (idx: number, minutes: number) => {
    const node = nodes[idx];
    if (!node?.id) return false;
    return runDayAction(() => updateScheduleItemPlan(node.id!, { stayMinutes: minutes }), "머무는 시간을 바꾸지 못했어요.");
  }, [nodes, runDayAction]);

  // 고정 시각 변경 (null이면 해제)
  const setNodePin = useCallback(async (idx: number, time: string | null) => {
    const node = nodes[idx];
    if (!node?.id) return false;
    return runDayAction(() => updateScheduleItemPlan(node.id!, { pinnedTime: time ?? "" }), "고정 시각을 바꾸지 못했어요.");
  }, [nodes, runDayAction]);

  // 메모 저장 — 시각 계산과 무관해서 그 노드만 바꾼다. 성공 여부를 돌려준다
  const setNodeMemo = useCallback(async (idx: number, memo: string): Promise<boolean> => {
    const node = nodes[idx];
    if (!node?.id) return false;
    try {
      const { data } = await updateScheduleItemMemo(node.id, memo);
      const saved: string | undefined = data?.memo ?? undefined;
      setAllDays((prev) => ({
        ...prev,
        [currentDay]: (prev[currentDay] ?? []).map((n) => (n.id === node.id ? { ...n, memo: saved } : n)),
      }));
      return true;
    } catch (e) {
      reportError(apiMessage(e, "메모를 저장하지 못했어요."));
      return false;
    }
  }, [nodes, currentDay, reportError]);

  // 노드의 장소 바꾸기 — 순서·머무는 시간·고정 시각은 그대로. 실패하면 안내하고 호출자(모달)가 알 수 있게 다시 던진다
  const replaceNodePlace = useCallback(async (idx: number, place: {
    name: string;
    category?: string;
    address?: string;
    lat?: number;
    lng?: number;
    description?: string;
    rating?: number;
  }) => {
    const node = nodes[idx];
    if (!node?.id) return;
    try {
      const { data } = await replaceScheduleItemPlace(node.id, {
        title: place.name,
        description: place.address ?? "",
        category: place.category ? (CATEGORY_TO_BACKEND[place.category] ?? place.category) : "",
        lat: place.lat as number,
        lng: place.lng as number,
      });
      applyDay(data as ScheduleResponse);
      // 서버 응답에 없는 화면용 정보(평점·설명)는 새 장소 것으로 채운다
      setAllDays((prev) => ({
        ...prev,
        [currentDay]: (prev[currentDay] ?? []).map((n) =>
          n.id === node.id
            ? { ...n, placeInfo: { ...n.placeInfo, name: n.placeInfo?.name ?? place.name, rating: place.rating, description: place.description } }
            : n),
      }));
    } catch (e) {
      reportError(apiMessage(e, "장소를 바꾸지 못했어요."));
      throw e;
    }
  }, [nodes, currentDay, applyDay, reportError]);

  // 이 날의 자동 시각 계산 켜기/끄기
  const setDayAutoCompute = useCallback(async (enabled: boolean) => {
    const id = dayInfoRef.current[currentDay]?.scheduleId ?? (await ensureScheduleId(currentDay));
    if (!id) return false;
    return runDayAction(() => setScheduleAutoCompute(id, enabled), "자동 계산 설정을 바꾸지 못했어요.");
  }, [currentDay, ensureScheduleId, runDayAction]);

  // 이 날의 시작·종료 시각, 이동수단 변경
  const updateDaySettings = useCallback(async (
    patch: { startTime?: string; endTime?: string; transportMode?: string },
  ) => {
    const id = dayInfoRef.current[currentDay]?.scheduleId ?? (await ensureScheduleId(currentDay));
    if (!id) return false;
    return runDayAction(() => updateScheduleSettings(id, patch), "설정을 바꾸지 못했어요.");
  }, [currentDay, ensureScheduleId, runDayAction]);

  return {
    nodes, allDays, dayInfo, loading, error, actionError,
    addNode, addNodeFromPlace, updateNode, deleteNode, reorderNodes, moveNodeToDay,
    setNodeStay, setNodePin, setDayAutoCompute, updateDaySettings, replaceNodePlace, setNodeMemo,
    loadFromExternal, refetch: fetchAll,
  };
};