import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

/* =========================
   Types
========================= */
export type WorkspaceViewType = "timeline" | "expenses" | "voucher" | "notice";

export type NoticeColor = "white" | "yellow" | "blue" | "green";

export interface NoticeItem {
  color: NoticeColor;
  tag: string;
  title: string;
  content: string;
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

  /* internal setters */
  setHideRight: (v: boolean) => void;
  setActiveView: (v: WorkspaceViewType) => void;
}

/* =========================
   localStorage Keys (절대 변경 ❌)
========================= */
const LS_DATE_LOGS = "tripmoa_date_logs";
const LS_NOTICE_GROUPS = "tripmoa_notice_groups";
const LS_TIMELINE_DATA = "tripmoa_timeline_data";

/* =========================
   Core Hook (Provider 내부 전용)
========================= */
const useWorkspaceCoreInternal = (): WorkspaceCoreState => {
  const [dateLogs, setDateLogs] = useState<string[]>([]);
  const [noticeGroups, setNoticeGroups] = useState<NoticeGroup[]>([]);

  const [activeView, setActiveView] = useState<WorkspaceViewType>("timeline");
  const [currentDay, setCurrentDay] = useState<string>("DAY ALL");
  const [currentNoticeGroup, setCurrentNoticeGroup] =
    useState<string>("TRIP NOTICE");

  const [hideRight, setHideRight] = useState<boolean>(false);

  useEffect(() => {
    const storedDates = localStorage.getItem(LS_DATE_LOGS);
    if (storedDates) {
      setDateLogs(JSON.parse(storedDates) as string[]);
    }

    const storedNoticeGroups = localStorage.getItem(LS_NOTICE_GROUPS);
    if (storedNoticeGroups) {
      setNoticeGroups(JSON.parse(storedNoticeGroups) as NoticeGroup[]);
    } else {
      // 기본 그룹(TRIP NOTICE)은 원본처럼 "항상 존재"하는 전제로 두는 경우가 많아서,
      // storage가 없으면 빈 배열로 시작 (원본 로직에 맞춰 STEP 3-5에서 보완 가능)
      setNoticeGroups([]);
    }

    if (!localStorage.getItem(LS_TIMELINE_DATA)) {
      localStorage.setItem(LS_TIMELINE_DATA, JSON.stringify({}));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_DATE_LOGS, JSON.stringify(dateLogs));
  }, [dateLogs]);

  useEffect(() => {
    localStorage.setItem(LS_NOTICE_GROUPS, JSON.stringify(noticeGroups));
  }, [noticeGroups]);

  const selectTab = (title: string, view: WorkspaceViewType) => {
    setActiveView(view);

    if (view === "timeline") {
      setCurrentDay(title);
      setHideRight(false);
      return;
    }

    if (view === "notice") {
      setCurrentNoticeGroup(title);
      setHideRight(false);
      return;
    }

    if (view === "expenses" || view === "voucher") {
      setHideRight(false);
    }
  };

  const addDateLog = () => {
    const name = prompt(
      "추가할 일정 이름을 입력하세요:",
      `DAY ${dateLogs.length + 1}`
    );
    if (!name) return;
    setDateLogs((prev) => [...prev, name]);
  };

  const addNoticeGroup = () => {
    const name = prompt("추가할 공지 그룹 이름을 입력하세요:", "새 공지사항");
    if (!name) return;
    setNoticeGroups((prev) => [...prev, { name, notices: [] }]);
  };

  const renameItem = (type: "date" | "notice", index: number) => {
    if (type === "date") {
      const current = dateLogs[index];
      const name = prompt("이름을 변경하세요:", current);
      if (!name) return;
      setDateLogs((prev) => prev.map((d, i) => (i === index ? name : d)));
      return;
    }

    const current = noticeGroups[index]?.name;
    if (!current) return;
    const name = prompt("이름을 변경하세요:", current);
    if (!name) return;
    setNoticeGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, name } : g))
    );
  };

  const deleteItem = (type: "date" | "notice", index: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    if (type === "date") {
      setDateLogs((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    setNoticeGroups((prev) => prev.filter((_, i) => i !== index));
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

  // (엄밀히는 useMemo 없어도 되지만, 동작 동일성 위해 유지)
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
