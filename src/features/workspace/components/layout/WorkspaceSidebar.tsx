// src/features/workspace/components/layout/WorkspaceSidebar.tsx
// 왼쪽 아이콘 레일 (일정 · 경비 · 바우처 · 공지). 디자인 기준 v3 workspace "레이아웃 C".
// DAY 탭·공지 그룹은 본문 위(WorkspaceCenter)로, 기간·멤버·초대는 페이지 머리/모달로 옮겼다.
import React from "react";
import "../../styles/shell.css";
import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";

const ICONS = {
  schedule: (
    <>
      <rect x="4" y="5" width="16" height="15" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" />
      <path d="M3 10h18M16 15h2" />
    </>
  ),
  voucher: (
    <>
      <path d="M3 8h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z" />
      <path d="M14 8v10" strokeDasharray="2 2" />
    </>
  ),
  notice: <path d="M5 3h14v13l-5 5H5zM14 21v-5h5" />,
};

const Icon: React.FC<{ name: keyof typeof ICONS }> = ({ name }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

const WorkspaceSidebar: React.FC = () => {
  const { activeView, noticeGroups, currentNoticeGroupId, selectTab, selectNoticeGroup } =
    useWorkspaceCore();

  const goNotice = () => {
    if (activeView === "notice") return;
    const target =
      noticeGroups.find((g) => g.groupId === currentNoticeGroupId)?.groupId ??
      noticeGroups[0]?.groupId;
    if (target != null) selectNoticeGroup(target);
  };

  const items: { key: string; label: string; icon: keyof typeof ICONS; on: boolean; go: () => void }[] = [
    {
      key: "timeline",
      label: "일정",
      icon: "schedule",
      on: activeView === "timeline",
      go: () => activeView !== "timeline" && selectTab("DAY ALL", "timeline"),
    },
    { key: "expenses", label: "경비", icon: "wallet", on: activeView === "expenses", go: () => selectTab("EXPENSES", "expenses") },
    { key: "voucher", label: "바우처", icon: "voucher", on: activeView === "voucher", go: () => selectTab("VOUCHER", "voucher") },
    { key: "notice", label: "공지", icon: "notice", on: activeView === "notice", go: goNotice },
  ];

  return (
    <nav className="ws-rail" aria-label="작업 화면 메뉴">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          className={`ws-rail__btn ${it.on ? "is-on" : ""}`}
          aria-current={it.on ? "page" : undefined}
          onClick={it.go}
        >
          <Icon name={it.icon} />
          {it.label}
        </button>
      ))}
    </nav>
  );
};

export default WorkspaceSidebar;
