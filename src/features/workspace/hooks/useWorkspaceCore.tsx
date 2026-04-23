// src/features/workspace/hooks/useWorkspaceCore.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";

import {
  createNoticeGroup as createNoticeGroupApi,
  deleteNoticeGroup as deleteNoticeGroupApi,
  getNoticeGroups,
  renameNoticeGroup as renameNoticeGroupApi,
} from "../../../api/notice.api";

import { getTripDetail, updateTrip as updateTripApi } from "../../../api/trip.api";
import type { TripMemberResponse } from "../../../types/trip.types";
import type { NoticeGroupResponse } from "../../../types/notice.types";

export type WorkspaceViewType = "timeline" | "expenses" | "voucher" | "notice";
export type NoticeColor = "white" | "yellow" | "blue" | "green";

export interface TripInfo {
  title: string;
  startDate: string;
  endDate: string;
}

interface WorkspaceCoreState {
  dateLogs: string[];
  noticeGroups: NoticeGroupResponse[];
  activeView: WorkspaceViewType;
  currentDay: string;
  currentNoticeGroupId: number | null;
  currentNoticeGroup: string;
  hideRight: boolean;
  isNoticeGroupsLoading: boolean;

  trip: TripInfo;
  tripMembers: TripMemberResponse[];
  isTripLoading: boolean;
  updateTripData: (data: TripInfo) => Promise<void>;

  selectTab: (title: string, view: WorkspaceViewType) => void;
  selectNoticeGroup: (groupId: number) => void;
  reloadNoticeGroups: () => Promise<void>;

  addDateLog: () => void;
  renameDateLog: (index: number) => void;
  deleteDateLog: (index: number) => void;

  // AI 일정 생성 후 dayKeys를 dateLogs에 동기화
  syncDateLogs: (dayKeys: string[]) => void;

  addNoticeGroup: () => Promise<void>;
  renameNoticeGroup: (groupId: number) => Promise<void>;
  deleteNoticeGroup: (groupId: number) => Promise<void>;

  renameItem: (type: "date" | "notice", index: number) => void;
  deleteItem: (type: "date" | "notice", index: number) => void;

  setHideRight: (v: boolean) => void;
  setActiveView: (v: WorkspaceViewType) => void;
}

const LS_TRIP_DATA = "tripData";
const LS_CURRENT_NOTICE_GROUP_ID = "tripmoa_current_notice_group_id";
const DEFAULT_DAY_LABEL = "DAY ALL";

const normalizeName = (name: string) => name.trim().toLowerCase();

const sortNoticeGroups = (groups: NoticeGroupResponse[]) =>
  [...groups].sort((a, b) =>
    a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.groupId - b.groupId
  );

const pickFallbackNoticeGroupId = (groups: NoticeGroupResponse[]): number | null => {
  if (groups.length === 0) return null;
  return groups.find((g) => g.isDefault)?.groupId ?? groups[0].groupId;
};

const useWorkspaceCoreInternal = (): WorkspaceCoreState => {
  const params = useParams<{ tripId: string }>();
  const tripId = Number(params.tripId);

  // dateLogs: localStorage 제거 — allDays 기반으로 syncDateLogs로만 업데이트
  const [dateLogs, setDateLogs] = useState<string[]>([]);
  const [noticeGroups, setNoticeGroups] = useState<NoticeGroupResponse[]>([]);
  const [isNoticeGroupsLoading, setIsNoticeGroupsLoading] = useState(false);

  const [activeView, setActiveView] = useState<WorkspaceViewType>("timeline");
  const [currentDay, setCurrentDay] = useState<string>(DEFAULT_DAY_LABEL);
  const [currentNoticeGroupId, setCurrentNoticeGroupId] = useState<number | null>(null);
  const [hideRight, setHideRight] = useState<boolean>(false);

  const [trip, setTrip] = useState<TripInfo>(() => {
    try {
      const saved = localStorage.getItem(LS_TRIP_DATA);
      if (saved) return JSON.parse(saved) as TripInfo;
    } catch { /* 파싱 실패 무시 */ }
    return { title: "", startDate: "", endDate: "" };
  });
  const [tripMembers, setTripMembers] = useState<TripMemberResponse[]>([]);
  const [isTripLoading, setIsTripLoading] = useState(false);

  const currentNoticeStorageKey = useMemo(
    () => `${LS_CURRENT_NOTICE_GROUP_ID}_${Number.isFinite(tripId) ? tripId : "unknown"}`,
    [tripId]
  );

  const currentNoticeGroup = useMemo(() => {
    if (currentNoticeGroupId == null) return "";
    return noticeGroups.find((g) => g.groupId === currentNoticeGroupId)?.name ?? "";
  }, [noticeGroups, currentNoticeGroupId]);

  // 공지 선택값 로드/저장 (localStorage 유지 — 공지는 서버 기반이라 선택값 정도는 OK)
  useEffect(() => {
    const stored = localStorage.getItem(currentNoticeStorageKey);
    if (!stored) { setCurrentNoticeGroupId(null); return; }
    const parsed = Number(stored);
    setCurrentNoticeGroupId(Number.isFinite(parsed) ? parsed : null);
  }, [currentNoticeStorageKey]);

  useEffect(() => {
    if (currentNoticeGroupId == null) {
      localStorage.removeItem(currentNoticeStorageKey);
      return;
    }
    localStorage.setItem(currentNoticeStorageKey, String(currentNoticeGroupId));
  }, [currentNoticeGroupId, currentNoticeStorageKey]);

  // 여행 정보 API 조회
  useEffect(() => {
    if (!Number.isFinite(tripId) || tripId <= 0) return;
    setIsTripLoading(true);
    getTripDetail(tripId)
      .then((res) => {
        const d = res.data;
        const t: TripInfo = { title: d.title, startDate: d.tripStartDate, endDate: d.tripEndDate };
        setTrip(t);
        setTripMembers(d.members ?? []);
        localStorage.setItem(LS_TRIP_DATA, JSON.stringify(t));
      })
      .catch(() => { /* localStorage fallback 유지 */ })
      .finally(() => setIsTripLoading(false));
  }, [tripId]);

  const updateTripData = async (data: TripInfo): Promise<void> => {
    setTrip(data);
    localStorage.setItem(LS_TRIP_DATA, JSON.stringify(data));
    if (Number.isFinite(tripId) && tripId > 0) {
      try {
        await updateTripApi(tripId, {
          title: data.title,
          tripStartDate: data.startDate,
          tripEndDate: data.endDate,
        });
      } catch (e) {
        console.error("여행 정보 업데이트 실패:", e);
      }
    }
  };

  // 공지 그룹 조회
  const reloadNoticeGroups = async () => {
    if (!Number.isFinite(tripId) || tripId <= 0) { setNoticeGroups([]); return; }
    setIsNoticeGroupsLoading(true);
    try {
      const response = await getNoticeGroups(tripId);
      setNoticeGroups(sortNoticeGroups(response.data ?? []));
    } catch {
      setNoticeGroups([]);
    } finally {
      setIsNoticeGroupsLoading(false);
    }
  };

  useEffect(() => { void reloadNoticeGroups(); }, [tripId]);

  useEffect(() => {
    if (noticeGroups.length === 0) { setCurrentNoticeGroupId(null); return; }
    const exists = noticeGroups.some((g) => g.groupId === currentNoticeGroupId);
    if (exists) return;
    setCurrentNoticeGroupId(pickFallbackNoticeGroupId(noticeGroups));
  }, [noticeGroups, currentNoticeGroupId]);

  const selectTab = (title: string, view: WorkspaceViewType) => {
    setActiveView(view);
    setHideRight(false);
    if (view === "timeline") { setCurrentDay(title); return; }
    if (view === "notice") {
      const matched = noticeGroups.find((g) => normalizeName(g.name) === normalizeName(title));
      if (matched) setCurrentNoticeGroupId(matched.groupId);
      else if (currentNoticeGroupId == null) setCurrentNoticeGroupId(pickFallbackNoticeGroupId(noticeGroups));
      return;
    }
  };

  const selectNoticeGroup = (groupId: number) => {
    setActiveView("notice");
    setHideRight(false);
    setCurrentNoticeGroupId(groupId);
  };

  // ── dateLogs 관련 ─────────────────────────────────────────
  const addDateLog = () => {
    const name = prompt("추가할 일정 이름을 입력하세요.", `DAY ${dateLogs.length + 1}`);
    if (!name?.trim()) return;
    setDateLogs((prev) => [...prev, name.trim()]);
  };

  const renameDateLog = (index: number) => {
    const current = dateLogs[index];
    if (current == null) return;
    const newName = prompt("이름을 변경하세요:", current);
    if (!newName?.trim()) return;
    setDateLogs((prev) => prev.map((d, i) => (i === index ? newName.trim() : d)));
  };

  const deleteDateLog = (index: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDateLogs((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * AI 일정 생성 완료 또는 서버에서 일정 로드 후
   * allDays의 키를 dateLogs에 반영 — 사이드바 탭 동기화
   */
  const syncDateLogs = (dayKeys: string[]) => {
    setDateLogs((prev) => {
      const newKeys = dayKeys.filter((k) => !prev.includes(k));
      return newKeys.length > 0 ? [...prev, ...newKeys] : prev;
    });
  };

  // 공지 그룹 CRUD
  const addNoticeGroup = async () => {
    if (!Number.isFinite(tripId) || tripId <= 0) return;
    let name: string | null = "새 공지사항";
    while (true) {
      name = prompt("추가할 공지 그룹 이름을 입력하세요.", name || "");
      if (name === null) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      if (noticeGroups.some((g) => normalizeName(g.name) === normalizeName(trimmed))) {
        alert("이미 존재하는 이름입니다."); continue;
      }
      try {
        const response = await createNoticeGroupApi(tripId, { name: trimmed });
        await reloadNoticeGroups();
        setCurrentNoticeGroupId(response.data.groupId);
        setActiveView("notice");
      } catch { alert("공지 그룹 생성에 실패했습니다."); }
      return;
    }
  };

  const renameNoticeGroup = async (groupId: number) => {
    if (!Number.isFinite(tripId) || tripId <= 0) return;
    const target = noticeGroups.find((g) => g.groupId === groupId);
    if (!target || target.isDefault) return;
    let newName: string | null = target.name;
    while (true) {
      newName = prompt("이름을 변경하세요:", newName || "");
      if (newName === null) return;
      const trimmed = newName.trim();
      if (!trimmed || trimmed === target.name) return;
      if (noticeGroups.some((g) => g.groupId !== groupId && normalizeName(g.name) === normalizeName(trimmed))) {
        alert("이미 존재하는 이름입니다."); continue;
      }
      try { await renameNoticeGroupApi(tripId, groupId, { name: trimmed }); await reloadNoticeGroups(); }
      catch { alert("공지 그룹 이름 수정에 실패했습니다."); }
      return;
    }
  };

  const deleteNoticeGroup = async (groupId: number) => {
    if (!Number.isFinite(tripId) || tripId <= 0) return;
    const target = noticeGroups.find((g) => g.groupId === groupId);
    if (!target || target.isDefault) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try { await deleteNoticeGroupApi(tripId, groupId); await reloadNoticeGroups(); }
    catch { alert("공지 그룹 삭제에 실패했습니다."); }
  };

  const renameItem = (type: "date" | "notice", index: number) => {
    if (type === "date") { renameDateLog(index); return; }
    const target = noticeGroups[index];
    if (target) void renameNoticeGroup(target.groupId);
  };

  const deleteItem = (type: "date" | "notice", index: number) => {
    if (type === "date") { deleteDateLog(index); return; }
    const target = noticeGroups[index];
    if (target) void deleteNoticeGroup(target.groupId);
  };

  return {
    dateLogs, noticeGroups, activeView, currentDay,
    currentNoticeGroupId, currentNoticeGroup, hideRight, isNoticeGroupsLoading,
    trip, tripMembers, isTripLoading, updateTripData,
    selectTab, selectNoticeGroup, reloadNoticeGroups,
    addDateLog, renameDateLog, deleteDateLog, syncDateLogs,
    addNoticeGroup, renameNoticeGroup, deleteNoticeGroup,
    renameItem, deleteItem, setHideRight, setActiveView,
  };
};

const WorkspaceCoreContext = createContext<WorkspaceCoreState | null>(null);

export const WorkspaceCoreProvider = ({ children }: { children: ReactNode }) => {
  const core = useWorkspaceCoreInternal();
  const value = useMemo(() => core, [core]);
  return <WorkspaceCoreContext.Provider value={value}>{children}</WorkspaceCoreContext.Provider>;
};

export const useWorkspaceCore = (): WorkspaceCoreState => {
  const ctx = useContext(WorkspaceCoreContext);
  if (!ctx) throw new Error("useWorkspaceCore must be used within WorkspaceCoreProvider");
  return ctx;
};