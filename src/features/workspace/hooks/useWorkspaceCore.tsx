// src\features\workspace\hooks\useWorkspaceCore.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";

import {
  createNoticeGroup as createNoticeGroupApi,
  deleteNoticeGroup as deleteNoticeGroupApi,
  getNoticeGroups,
  renameNoticeGroup as renameNoticeGroupApi,
} from "../../../api/notice.api";

import type { NoticeGroupResponse } from "../../../types/notice.types";

export type WorkspaceViewType = "timeline" | "expenses" | "voucher" | "notice";
export type NoticeColor = "white" | "yellow" | "blue" | "green";

/**
 * [참고]
 * - 일정은 기존 로컬 로직 유지
 * - 공지사항은 그룹만 관리하고, 아이템은 useNotices에서 분리 관리
 *
 * 기존에는 공지 그룹 내부에 아이템까지 포함한 뒤 name/index 기반으로 수정, 삭제를 처리했지만,
 * 현재는 공지 그룹을 groupId 기반으로 분리하여 서버 중심 구조로 변경했다.
 *
 * 일정은 아직 기존 구조를 유지해야 하므로 관련 함수는 그대로 두고,
 * 공지사항만 add/rename/delete 전용 함수를 추가했다.
 *
 * 추후 일정도 id 기반으로 변경되면,
 * 수정/삭제 로직을 공통 패턴으로 합칠 수 있다.
 */

interface WorkspaceCoreState {
  /* state */
  dateLogs: string[];
  noticeGroups: NoticeGroupResponse[];
  activeView: WorkspaceViewType;
  currentDay: string;
  currentNoticeGroupId: number | null;
  currentNoticeGroup: string;
  hideRight: boolean;
  isNoticeGroupsLoading: boolean;

  /* actions */
  selectTab: (title: string, view: WorkspaceViewType) => void;
  selectNoticeGroup: (groupId: number) => void;
  reloadNoticeGroups: () => Promise<void>;

  addDateLog: () => void;
  renameDateLog: (index: number) => void;
  deleteDateLog: (index: number) => void;

  addNoticeGroup: () => Promise<void>;
  renameNoticeGroup: (groupId: number) => Promise<void>;
  deleteNoticeGroup: (groupId: number) => Promise<void>;

  // 기존 Sidebar 호환용
  renameItem: (type: "date" | "notice", index: number) => void;
  deleteItem: (type: "date" | "notice", index: number) => void;

  /* internal setters */
  setHideRight: (v: boolean) => void;
  setActiveView: (v: WorkspaceViewType) => void;
}

/* =========================
   상수
========================= */
const LS_DATE_LOGS = "tripmoa_date_logs";
const LS_CURRENT_NOTICE_GROUP_ID = "tripmoa_current_notice_group_id";
const DEFAULT_DAY_LABEL = "DAY ALL";

const normalizeName = (name: string) => name.trim().toLowerCase();

const sortNoticeGroups = (groups: NoticeGroupResponse[]) => {
  return [...groups].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.groupId - b.groupId;
  });
};

const pickFallbackNoticeGroupId = (
  groups: NoticeGroupResponse[],
): number | null => {
  if (groups.length === 0) return null;

  const defaultGroup = groups.find((group) => group.isDefault);
  if (defaultGroup) return defaultGroup.groupId;

  return groups[0].groupId;
};

/* =========================
   Core Hook (Provider 내부 전용)
========================= */
const useWorkspaceCoreInternal = (): WorkspaceCoreState => {
  const params = useParams<{ tripId: string }>();
  const tripId = Number(params.tripId);

  const [dateLogs, setDateLogs] = useState<string[]>([]);
  const [noticeGroups, setNoticeGroups] = useState<NoticeGroupResponse[]>([]);
  const [isDateLoaded, setIsDateLoaded] = useState(false);
  const [isNoticeGroupsLoading, setIsNoticeGroupsLoading] = useState(false);

  const [activeView, setActiveView] = useState<WorkspaceViewType>("timeline");
  const [currentDay, setCurrentDay] = useState<string>(DEFAULT_DAY_LABEL);
  const [currentNoticeGroupId, setCurrentNoticeGroupId] = useState<
    number | null
  >(null);
  const [hideRight, setHideRight] = useState<boolean>(false);

  const currentNoticeStorageKey = useMemo(
    () =>
      `${LS_CURRENT_NOTICE_GROUP_ID}_${Number.isFinite(tripId) ? tripId : "unknown"}`,
    [tripId],
  );

  const currentNoticeGroup = useMemo(() => {
    if (currentNoticeGroupId == null) return "";
    return (
      noticeGroups.find((group) => group.groupId === currentNoticeGroupId)
        ?.name ?? ""
    );
  }, [noticeGroups, currentNoticeGroupId]);

  /* =========================
     1. localStorage 로드
  ========================= */
  useEffect(() => {
    const storedDates = localStorage.getItem(LS_DATE_LOGS);
    if (storedDates) {
      try {
        const parsed = JSON.parse(storedDates);
        if (Array.isArray(parsed)) {
          setDateLogs(parsed);
        }
      } catch {
        // 파싱 실패 시 무시
      }
    }

    setIsDateLoaded(true);
  }, []);

  /* =========================
     2. date localStorage 저장
  ========================= */
  useEffect(() => {
    if (!isDateLoaded) return;
    localStorage.setItem(LS_DATE_LOGS, JSON.stringify(dateLogs));
  }, [dateLogs, isDateLoaded]);

  /* =========================
     3. 공지 선택값 로드 (trip 별)
  ========================= */
  useEffect(() => {
    const stored = localStorage.getItem(currentNoticeStorageKey);
    if (!stored) {
      setCurrentNoticeGroupId(null);
      return;
    }

    const parsed = Number(stored);
    setCurrentNoticeGroupId(Number.isFinite(parsed) ? parsed : null);
  }, [currentNoticeStorageKey]);

  /* =========================
     4. 공지 선택값 저장 (trip 별)
  ========================= */
  useEffect(() => {
    if (currentNoticeGroupId == null) {
      localStorage.removeItem(currentNoticeStorageKey);
      return;
    }

    localStorage.setItem(currentNoticeStorageKey, String(currentNoticeGroupId));
  }, [currentNoticeGroupId, currentNoticeStorageKey]);

  /* =========================
     5. 공지 그룹 전체 조회
  ========================= */
  const reloadNoticeGroups = async () => {
    if (!Number.isFinite(tripId) || tripId <= 0) {
      setNoticeGroups([]);
      return;
    }

    setIsNoticeGroupsLoading(true);
    try {
      const response = await getNoticeGroups(tripId);
      const groups = sortNoticeGroups(response.data ?? []);
      setNoticeGroups(groups);
    } catch (error) {
      console.error("공지 그룹 조회 실패:", error);
      setNoticeGroups([]);
    } finally {
      setIsNoticeGroupsLoading(false);
    }
  };

  useEffect(() => {
    void reloadNoticeGroups();
  }, [tripId]);

  /* =========================
     6. 공지 그룹 선택 보정
     - 저장된 groupId가 있으면 유지
     - 없으면 기본 그룹(isDefault) 우선
     - 그것도 없으면 첫 번째 그룹
  ========================= */
  useEffect(() => {
    if (noticeGroups.length === 0) {
      setCurrentNoticeGroupId(null);
      return;
    }

    const exists = noticeGroups.some(
      (group) => group.groupId === currentNoticeGroupId,
    );
    if (exists) return;

    setCurrentNoticeGroupId(pickFallbackNoticeGroupId(noticeGroups));
  }, [noticeGroups, currentNoticeGroupId]);

  /* =========================
     7. 탭 선택
     - timeline/expenses/voucher는 기존 유지
     - notice는 기존 문자열 선택도 잠시 지원
  ========================= */
  const selectTab = (title: string, view: WorkspaceViewType) => {
    setActiveView(view);
    setHideRight(false);

    if (view === "timeline") {
      setCurrentDay(title);
      return;
    }

    if (view === "notice") {
      const matched = noticeGroups.find(
        (group) => normalizeName(group.name) === normalizeName(title),
      );

      if (matched) {
        setCurrentNoticeGroupId(matched.groupId);
      } else if (currentNoticeGroupId == null) {
        setCurrentNoticeGroupId(pickFallbackNoticeGroupId(noticeGroups));
      }

      return;
    }
  };

  const selectNoticeGroup = (groupId: number) => {
    setActiveView("notice");
    setHideRight(false);
    setCurrentNoticeGroupId(groupId);
  };

  /* =========================
     8. 일정(date) 로컬 액션
  ========================= */
  const addDateLog = () => {
    const name = prompt(
      "추가할 일정 이름을 입력하세요.",
      `DAY ${dateLogs.length + 1}`,
    );
    if (!name) return;

    const trimmed = name.trim();
    if (!trimmed) return;

    setDateLogs((prev) => [...prev, trimmed]);
  };

  const renameDateLog = (index: number) => {
    const current = dateLogs[index];
    if (current == null) return;

    const newName = prompt("이름을 변경하세요:", current);
    if (!newName || !newName.trim()) return;

    setDateLogs((prev) =>
      prev.map((day, i) => (i === index ? newName.trim() : day)),
    );
  };

  const deleteDateLog = (index: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDateLogs((prev) => prev.filter((_, i) => i !== index));
  };

  /* =========================
     9. 공지 그룹 CRUD (서버 기반)
  ========================= */
  const addNoticeGroup = async () => {
    if (!Number.isFinite(tripId) || tripId <= 0) return;

    let name: string | null = "새 공지사항";

    while (true) {
      name = prompt("추가할 공지 그룹 이름을 입력하세요.", name || "");
      if (name === null) return;

      const trimmed = name.trim();
      if (!trimmed) return;

      const duplicated = noticeGroups.some(
        (group) => normalizeName(group.name) === normalizeName(trimmed),
      );
      if (duplicated) {
        alert("이미 존재하는 이름입니다.");
        continue;
      }

      try {
        const response = await createNoticeGroupApi(tripId, { name: trimmed });
        const createdGroup = response.data;

        await reloadNoticeGroups();
        setCurrentNoticeGroupId(createdGroup.groupId);
        setActiveView("notice");
      } catch (error) {
        console.error("공지 그룹 생성 실패:", error);
        alert("공지 그룹 생성에 실패했습니다.");
      }
      return;
    }
  };

  const renameNoticeGroup = async (groupId: number) => {
    if (!Number.isFinite(tripId) || tripId <= 0) return;

    const targetGroup = noticeGroups.find((group) => group.groupId === groupId);
    if (!targetGroup) return;

    if (targetGroup.isDefault) return;

    let newName: string | null = targetGroup.name;

    while (true) {
      newName = prompt("이름을 변경하세요:", newName || "");
      if (newName === null) return;

      const trimmed = newName.trim();
      if (!trimmed || trimmed === targetGroup.name) return;

      const duplicated = noticeGroups.some(
        (group) =>
          group.groupId !== groupId &&
          normalizeName(group.name) === normalizeName(trimmed),
      );
      if (duplicated) {
        alert("이미 존재하는 이름입니다.");
        continue;
      }

      try {
        await renameNoticeGroupApi(tripId, groupId, { name: trimmed });
        await reloadNoticeGroups();
      } catch (error) {
        console.error("공지 그룹 이름 수정 실패:", error);
        alert("공지 그룹 이름 수정에 실패했습니다.");
      }
      return;
    }
  };

  const deleteNoticeGroup = async (groupId: number) => {
    if (!Number.isFinite(tripId) || tripId <= 0) return;

    const targetGroup = noticeGroups.find((group) => group.groupId === groupId);
    if (!targetGroup) return;

    if (targetGroup.isDefault) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteNoticeGroupApi(tripId, groupId);
      await reloadNoticeGroups();
    } catch (error) {
      console.error("공지 그룹 삭제 실패:", error);
      alert("공지 그룹 삭제에 실패했습니다.");
    }
  };

  /* =========================
     10. 기존 Sidebar 호환용 래퍼
     - notice 분기는 이제 groupId 기반 함수로 위임
     - date는 기존처럼 index 사용
  ========================= */
  const renameItem = (type: "date" | "notice", index: number) => {
    if (type === "date") {
      renameDateLog(index);
      return;
    }

    const targetGroup = noticeGroups[index];
    if (!targetGroup) return;
    void renameNoticeGroup(targetGroup.groupId);
  };

  const deleteItem = (type: "date" | "notice", index: number) => {
    if (type === "date") {
      deleteDateLog(index);
      return;
    }

    const targetGroup = noticeGroups[index];
    if (!targetGroup) return;
    void deleteNoticeGroup(targetGroup.groupId);
  };

  return {
    dateLogs,
    noticeGroups,
    activeView,
    currentDay,
    currentNoticeGroupId,
    currentNoticeGroup,
    hideRight,
    isNoticeGroupsLoading,

    selectTab,
    selectNoticeGroup,
    reloadNoticeGroups,

    addDateLog,
    renameDateLog,
    deleteDateLog,

    addNoticeGroup,
    renameNoticeGroup,
    deleteNoticeGroup,

    renameItem,
    deleteItem,

    setHideRight,
    setActiveView,
  };
};

/* =========================
   Context + Provider
========================= */
const WorkspaceCoreContext = createContext<WorkspaceCoreState | null>(null);

export const WorkspaceCoreProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const core = useWorkspaceCoreInternal();
  const value = useMemo(() => core, [core]);

  return (
    <WorkspaceCoreContext.Provider value={value}>
      {children}
    </WorkspaceCoreContext.Provider>
  );
};

export const useWorkspaceCore = (): WorkspaceCoreState => {
  const ctx = useContext(WorkspaceCoreContext);
  if (!ctx) {
    throw new Error(
      "useWorkspaceCore must be used within WorkspaceCoreProvider",
    );
  }
  return ctx;
};
