import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type WorkspaceViewType = "timeline" | "expenses" | "voucher" | "notice";
export type NoticeColor = "white" | "yellow" | "blue" | "green";

export interface NoticeItem {
  id: number;
  color: NoticeColor;
  tag: string;
  title: string;
  content: string;
  isPinned?: boolean;
}

export interface NoticeGroup {
  name: string;
  notices: NoticeItem[];
}

interface WorkspaceCoreState {
  /* state */
  dateLogs: string[];
  noticeGroups: NoticeGroup[];
  activeView: WorkspaceViewType;
  currentDay: string;
  currentNoticeGroup: string;
  hideRight: boolean;

  /* actions */
  selectTab: (title: string, view: WorkspaceViewType) => void;
  addDateLog: () => void;
  addNoticeGroup: () => void;
  renameItem: (type: "date" | "notice", index: number) => void;
  deleteItem: (type: "date" | "notice", index: number) => void;
  updateNotices: (groupName: string, nextNotices: NoticeItem[]) => void;

  /* internal setters */
  setHideRight: (v: boolean) => void;
  setActiveView: (v: WorkspaceViewType) => void;
}

/* =========================
   상수
========================= */
const LS_DATE_LOGS = "tripmoa_date_logs";
const LS_NOTICE_GROUPS = "tripmoa_notice_groups";
const LS_CURRENT_NOTICE = "tripmoa_current_notice_group";

const DEFAULT_DAY_LABEL = "DAY ALL";
const DEFAULT_NOTICE_GROUP_NAME = "TRIP NOTICE";

const normalizeName = (name: string) => name.trim().toLowerCase();

/* =========================
   Core Hook (Provider 내부 전용)
========================= */
const useWorkspaceCoreInternal = (): WorkspaceCoreState => {
  const [dateLogs, setDateLogs] = useState<string[]>([]);
  const [noticeGroups, setNoticeGroups] = useState<NoticeGroup[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [activeView, setActiveView] = useState<WorkspaceViewType>("timeline");
  const [currentDay, setCurrentDay] = useState<string>(DEFAULT_DAY_LABEL);
  const [currentNoticeGroup, setCurrentNoticeGroup] = useState<string>(
    DEFAULT_NOTICE_GROUP_NAME
  );
  const [hideRight, setHideRight] = useState<boolean>(false);

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

    const storedNoticeGroups = localStorage.getItem(LS_NOTICE_GROUPS);
    if (storedNoticeGroups) {
      try {
        const parsed = JSON.parse(storedNoticeGroups);
        if (Array.isArray(parsed)) {
          setNoticeGroups(parsed);
        }
      } catch {
        // 파싱 실패 시 무시
      }
    }

    const storedActiveGroup = localStorage.getItem(LS_CURRENT_NOTICE);
    if (storedActiveGroup) {
      setCurrentNoticeGroup(storedActiveGroup);
    }

    setIsLoaded(true);
  }, []);

  /* =========================
     2. 공지 그룹 정리 + 기본 TRIP NOTICE 보장
        - 항상 TRIP NOTICE는 정확히 1개만 존재
        - 이름 공백/대소문자 정리
  ========================= */
  useEffect(() => {
    if (!isLoaded) return;

    setNoticeGroups((prev) => {
      // 1) name, notices 기본 정리
      const normalized = prev
        .filter((g) => g && typeof g.name === "string")
        .map<NoticeGroup>((g) => ({
          name: g.name.trim(),
          notices: Array.isArray(g.notices) ? g.notices : [],
        }));

      // 2) 이름 기준 중복 제거 (일반 그룹)
      const dedupedByName = normalized.filter((g, index, self) => {
        const key = normalizeName(g.name);
        return index === self.findIndex((x) => normalizeName(x.name) === key);
      });

      const defaultKey = normalizeName(DEFAULT_NOTICE_GROUP_NAME);

      const tripNoticeGroups = dedupedByName.filter(
        (g) => normalizeName(g.name) === defaultKey
      );
      const otherGroups = dedupedByName.filter(
        (g) => normalizeName(g.name) !== defaultKey
      );

      // 3) TRIP NOTICE가 하나도 없으면 새로 추가
      if (tripNoticeGroups.length === 0) {
        const defaultGroup: NoticeGroup = {
          name: DEFAULT_NOTICE_GROUP_NAME,
          notices: [],
        };
        return [defaultGroup, ...otherGroups];
      }

      // 4) 여러 개 있다면 첫 번째만 남기고 나머지는 버림
      const [primaryTripNotice] = tripNoticeGroups;
      return [primaryTripNotice, ...otherGroups];
    });

    // currentNoticeGroup이 이상한 값이면 TRIP NOTICE로 리셋
    setCurrentNoticeGroup((prev) => {
      if (!prev) return DEFAULT_NOTICE_GROUP_NAME;
      return prev;
    });
  }, [isLoaded]);

  /* =========================
     3. localStorage 저장
  ========================= */
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(LS_DATE_LOGS, JSON.stringify(dateLogs));
    localStorage.setItem(LS_NOTICE_GROUPS, JSON.stringify(noticeGroups));
    localStorage.setItem(LS_CURRENT_NOTICE, currentNoticeGroup);
  }, [dateLogs, noticeGroups, currentNoticeGroup, isLoaded]);

  /* =========================
     4. 공지 업데이트 (중복 방지 포함)
  ========================= */
  const updateNotices = (groupName: string, nextNotices: NoticeItem[]) => {
    const targetName = groupName.trim();
    const targetKey = normalizeName(targetName);

    setNoticeGroups((prev) => {
      // 이미 존재하는지 체크 (이름 공백/대소문자 무시)
      const index = prev.findIndex((g) => normalizeName(g.name) === targetKey);

      if (index !== -1) {
        // 기존 그룹의 notices만 교체
        return prev.map((g, i) =>
          i === index ? { ...g, name: g.name.trim(), notices: nextNotices } : g
        );
      }

      // 새 그룹 추가
      return [
        ...prev,
        { name: targetName || DEFAULT_NOTICE_GROUP_NAME, notices: nextNotices },
      ];
    });
  };

  /* =========================
     5. 탭 선택
  ========================= */
  const selectTab = (title: string, view: WorkspaceViewType) => {
    setActiveView(view);

    if (view === "timeline") {
      setCurrentDay(title);
      setHideRight(false);
      return;
    }

    if (view === "notice") {
      setCurrentNoticeGroup(title || DEFAULT_NOTICE_GROUP_NAME);
      setHideRight(false);
      return;
    }

    if (view === "expenses" || view === "voucher") {
      setHideRight(false);
    }
  };

  /* =========================
     6. 일정/공지 그룹 추가
  ========================= */
  const addDateLog = () => {
    const name = prompt(
      "추가할 일정 이름을 입력하세요.",
      `DAY ${dateLogs.length + 1}`
    );
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    setDateLogs((prev) => [...prev, trimmed]);
  };

  const addNoticeGroup = () => {
    let name: string | null = "새 공지사항";

    while (true) {
      name = prompt("추가할 공지 그룹 이름을 입력하세요.", name || "");
      if (name === null) break;

      const trimmed = name.trim();
      if (!trimmed) break;

      const key = normalizeName(trimmed);

      // 중복 체크 (TRIP NOTICE 포함 전체)
      if (noticeGroups.some((g) => normalizeName(g.name) === key)) {
        alert("이미 존재하는 이름입니다.");
        continue;
      }

      setNoticeGroups((prev) => [...prev, { name: trimmed, notices: [] }]);
      break;
    }
  };

  /* =========================
     7. 이름 변경
  ========================= */
  const renameItem = (type: "date" | "notice", index: number) => {
    if (type === "date") {
      const current = dateLogs[index];
      if (current == null) return;

      const newName = prompt("이름을 변경하세요:", current);
      if (newName && newName.trim()) {
        setDateLogs((prev) =>
          prev.map((d, i) => (i === index ? newName.trim() : d))
        );
      }
      return;
    }

    const oldName = noticeGroups[index]?.name;
    if (!oldName) return;

    const oldKey = normalizeName(oldName);

    let newName: string | null = oldName;
    while (true) {
      newName = prompt("이름을 변경하세요:", newName || "");
      if (newName === null) break;

      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) break;

      const newKey = normalizeName(trimmed);

      // 다른 그룹과 중복되는지 검사
      if (
        noticeGroups.some(
          (g, i) => i !== index && normalizeName(g.name) === newKey
        )
      ) {
        alert("이미 존재하는 이름입니다.");
        continue;
      }

      // 현재 선택된 그룹 이름도 같이 갱신
      if (normalizeName(currentNoticeGroup) === oldKey) {
        setCurrentNoticeGroup(trimmed);
      }

      setNoticeGroups((prev) =>
        prev.map((g, i) => (i === index ? { ...g, name: trimmed } : g))
      );
      break;
    }
  };

  /* =========================
     8. 삭제 (TRIP NOTICE 보호)
  ========================= */
  const deleteItem = (type: "date" | "notice", index: number) => {
    if (type === "notice") {
      const targetName = noticeGroups[index]?.name;
      if (!targetName) return;

      const targetKey = normalizeName(targetName);
      const defaultKey = normalizeName(DEFAULT_NOTICE_GROUP_NAME);

      // 기본 TRIP NOTICE는 삭제 불가
      if (targetKey === defaultKey) return;
    }

    if (!confirm("정말 삭제하시겠습니까?")) return;

    if (type === "notice") {
      const targetName = noticeGroups[index]?.name;
      if (!targetName) return;

      const targetKey = normalizeName(targetName);
      const defaultKey = normalizeName(DEFAULT_NOTICE_GROUP_NAME);

      // 현재 보고 있는 그룹을 지우면 TRIP NOTICE로 이동
      if (normalizeName(currentNoticeGroup) === targetKey) {
        setCurrentNoticeGroup(DEFAULT_NOTICE_GROUP_NAME);
      }

      setNoticeGroups((prev) => prev.filter((_, i) => i !== index));
    } else {
      setDateLogs((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return {
    dateLogs,
    noticeGroups,
    activeView,
    currentDay,
    currentNoticeGroup,
    hideRight,

    selectTab,
    addDateLog,
    addNoticeGroup,
    renameItem,
    deleteItem,
    updateNotices,

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
      "useWorkspaceCore must be used within WorkspaceCoreProvider"
    );
  }
  return ctx;
};
