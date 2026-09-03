// src/features/workspace/hooks/useTimeline.ts
import { useEffect, useState, useCallback } from "react";
import {
  getSchedules,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  reorderScheduleItems,
  moveScheduleItem,
} from "../../../api/schedule.api";
import { CATEGORY_FROM_BACKEND } from "./schedule.constants";

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

export interface TimelineNode {
  id?: number;
  scheduleId?: number;
  time: string;
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
}

interface ScheduleResponse {
  scheduleId: number;
  day: number;
  items: ScheduleItemResponse[];
}

function toTimelineNodes(scheduleId: number, items: ScheduleItemResponse[]): TimelineNode[] {
  return items.map((item) => ({
    id: item.id,
    scheduleId,
    time: item.time,
    title: item.title,
    desc: item.description,
    travelMinutes: item.travelMinutes,
    travelPayment: item.travelPayment,
    travelTransfer: item.travelTransfer,
    placeInfo: {
      name: item.title,
      address: item.description,
      category: item.category ? (CATEGORY_FROM_BACKEND[item.category] ?? item.category) : item.category,
      lat: item.lat,
      lng: item.lng,
    },
  }));
}

function toDayKey(day: number): string {
  return `DAY ${day}`;
}

export const useTimeline = (currentDay: string, tripId: number | null) => {
  const [nodes, setNodes] = useState<TimelineNode[]>([]);
  const [allDays, setAllDays] = useState<Record<string, TimelineNode[]>>({});
  const [scheduleIdMap, setScheduleIdMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getSchedules(tripId);
      const mapped: Record<string, TimelineNode[]> = {};
      const idMap: Record<string, number> = {};
      data.forEach((schedule: ScheduleResponse) => {
        const key = toDayKey(schedule.day);
        mapped[key] = toTimelineNodes(schedule.scheduleId, schedule.items);
        idMap[key] = schedule.scheduleId;
      });
      setAllDays(mapped);
      setScheduleIdMap(idMap);
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

  const loadFromExternal = useCallback(
    (allDaysData: Record<string, TimelineNode[]>) => {
      setAllDays((prev) => ({ ...prev, ...allDaysData }));
      if (currentDay && currentDay !== "DAY ALL" && allDaysData[currentDay]) {
        setNodes(allDaysData[currentDay]);
      }
      // scheduleIdMap도 업데이트 — 노드의 scheduleId로 역추적
      setScheduleIdMap((prev) => {
        const next = { ...prev };
        Object.entries(allDaysData).forEach(([dayKey, nodes]) => {
          const scheduleId = nodes.find((n) => n.scheduleId != null)?.scheduleId;
          if (scheduleId != null) {
            next[dayKey] = scheduleId;
          }
        });
        return next;
      });
    },
    [currentDay]
  );

  const addNode = useCallback(async () => {
    const scheduleId = scheduleIdMap[currentDay];
    if (!scheduleId) return;
    try {
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
    } catch {
      setError("노드 추가에 실패했습니다.");
    }
  }, [currentDay, scheduleIdMap]);

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
    const scheduleId = scheduleIdMap[currentDay];
    if (!scheduleId) return;
    try {
      const { data } = await createScheduleItem({
        scheduleId,
        time: "00:00",
        title: place.name,
        description: place.address ?? "",
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
    } catch (e) {
      setError("노드 추가에 실패했습니다.");
      throw e; // 호출자(AddPlaceModal 등)가 성공/실패를 구분해서 피드백을 줄 수 있게 재전파
    }
  }, [currentDay, scheduleIdMap]);

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
      setError("노드 수정에 실패했습니다.");
      fetchAll();
    }
  }, [nodes, currentDay, fetchAll]);

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
    } catch {
      setError("노드 삭제에 실패했습니다.");
      fetchAll();
    }
  }, [nodes, currentDay, fetchAll]);

  const reorderNodes = useCallback(async (fromIdx: number, toIdx: number) => {
    const next = [...nodes];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);

    setNodes(next);
    setAllDays((d) => ({ ...d, [currentDay]: next }));

    const itemIds = next.map((n) => n.id).filter((id): id is number => id != null);
    try {
      await reorderScheduleItems(itemIds);
    } catch {
      setError("순서 변경에 실패했습니다.");
      fetchAll();
    }
  }, [nodes, currentDay, fetchAll]);

  const moveNodeToDay = useCallback(async (idx: number, targetDay: string) => {
    const node = nodes[idx];
    if (!node?.id) return;

    const targetScheduleId = scheduleIdMap[targetDay];
    if (!targetScheduleId) return;

    const nextNodes = nodes.filter((_, i) => i !== idx);
    setNodes(nextNodes);
    setAllDays((prev) => ({
      ...prev,
      [currentDay]: nextNodes,
      [targetDay]: [...(prev[targetDay] ?? []), { ...node, scheduleId: targetScheduleId }],
    }));

    try {
      await moveScheduleItem(node.id, targetScheduleId);
    } catch {
      setError("일정 이동에 실패했습니다.");
      fetchAll();
    }
  }, [nodes, currentDay, scheduleIdMap, fetchAll]);

  return {
    nodes, allDays, loading, error,
    addNode, addNodeFromPlace, updateNode, deleteNode, reorderNodes, moveNodeToDay,
    loadFromExternal, refetch: fetchAll,
  };
};