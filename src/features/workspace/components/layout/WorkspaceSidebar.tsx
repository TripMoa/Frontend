// src/features/workspace/components/layout/WorkspaceSidebar.tsx
import React, { useState } from "react";
import "../../styles/sidebar.css";
import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import { useTripContext } from "../../hooks/useTripContext";
import { ActionPromptModal } from "../../../../shared/components/ActionPromptModal";

const WorkspaceSidebar: React.FC = () => {
  const { isOwner } = useTripContext();

  const [inviteModal, setInviteModal] = useState<{
    open: boolean;
    headline: string;
    description: string;
  }>({
    open: false,
    headline: "",
    description: "",
  });

  const {
    dateLogs,
    noticeGroups,
    activeView,
    currentDay,
    currentNoticeGroupId,
    selectTab,
    selectNoticeGroup,
    addDateLog,
    addNoticeGroup,
    renameDateLog,
    deleteDateLog,
    renameNoticeGroup,
    deleteNoticeGroup,
    isNoticeGroupsLoading,
    trip,
    tripMembers,
  } = useWorkspaceCore();

  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return "-";
    const s = new Date(start);
    const e = new Date(end);
    const sm = String(s.getMonth() + 1).padStart(2, "0");
    const sd = String(s.getDate()).padStart(2, "0");
    const em = String(e.getMonth() + 1).padStart(2, "0");
    const ed = String(e.getDate()).padStart(2, "0");
    return `${s.getFullYear()}.${sm}.${sd} - ${em}.${ed}`;
  };

  const calcNightsDays = (start: string, end: string) => {
    if (!start || !end) return "-";
    const diff = Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 86400000,
    );
    if (diff <= 0) return "당일치기";
    return `${diff}박 ${diff + 1}일`;
  };

  const handleCopyInviteLink = async () => {
    if (!trip?.inviteCode) {
      setInviteModal({
        open: true,
        headline: "초대코드를 찾을 수 없습니다",
        description: "여행 정보를 다시 불러온 뒤 시도해주세요.",
      });
      return;
    }

    const inviteLink = `${window.location.origin}/invite/${trip.inviteCode}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteModal({
        open: true,
        headline: "초대 링크가 복사되었습니다",
        description: "친구에게 공유해 여행에 초대해보세요.",
      });
    } catch {
      setInviteModal({
        open: true,
        headline: "초대 링크 복사 실패",
        description: "브라우저 권한 또는 보안 설정을 확인해주세요.",
      });
    }
  };

  return (
    <div className="ws-panel">
      <div
        className="ws-brand"
        onClick={() => {
          window.location.href = "/mytrips";
        }}
      >
        <i className="fa-solid fa-arrow-left"></i> BACK
      </div>

      <div className="ws-nav">
        <div
          className="ws-group-title"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>&gt;&gt; SCHEDULE</span>
          <button className="btn-add-mini" onClick={addDateLog}>
            [+]
          </button>
        </div>

        <div id="date-log-list">
          <div
            className={`ws-item-wrapper ${
              activeView === "timeline" && currentDay === "DAY ALL"
                ? "active"
                : ""
            }`}
          >
            <a
              className="ws-item"
              onClick={() => selectTab("DAY ALL", "timeline")}
            >
              DAY ALL
            </a>
          </div>

          {dateLogs.map((day, idx) => (
            <div
              key={`${day}-${idx}`}
              className={`ws-item-wrapper ${
                activeView === "timeline" && currentDay === day ? "active" : ""
              }`}
            >
              <a className="ws-item" onClick={() => selectTab(day, "timeline")}>
                {day}
              </a>

              <div className="ws-item-controls">
                <span onClick={() => renameDateLog(idx)}>✎</span>
                <span onClick={() => deleteDateLog(idx)}>🗑</span>
              </div>
            </div>
          ))}
        </div>

        <div className="ws-group-title">&gt;&gt; WALLET</div>

        <div
          className={`ws-item-wrapper ${
            activeView === "expenses" ? "active" : ""
          }`}
        >
          <a
            className="ws-item"
            onClick={() => selectTab("EXPENSES", "expenses")}
          >
            EXPENSES
          </a>
        </div>

        <div
          className={`ws-item-wrapper ${
            activeView === "voucher" ? "active" : ""
          }`}
        >
          <a
            className="ws-item"
            onClick={() => selectTab("VOUCHER", "voucher")}
          >
            VOUCHER
          </a>
        </div>

        <div
          className="ws-group-title"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>&gt;&gt; NOTICES</span>
          {isOwner && (
            <button
              className="btn-add-mini"
              onClick={() => void addNoticeGroup()}
            >
              [+]
            </button>
          )}
        </div>

        <div id="notice-log-list">
          {isNoticeGroupsLoading ? (
            <div className="ws-item-wrapper">
              <span className="ws-item">불러오는 중...</span>
            </div>
          ) : noticeGroups.length === 0 ? (
            <div className="ws-item-wrapper">
              <span className="ws-item">공지 그룹이 없습니다.</span>
            </div>
          ) : (
            noticeGroups.map((group) => (
              <div
                key={group.groupId}
                className={`ws-item-wrapper ${
                  activeView === "notice" &&
                  currentNoticeGroupId === group.groupId
                    ? "active"
                    : ""
                }`}
              >
                <a
                  className="ws-item"
                  onClick={() => selectNoticeGroup(group.groupId)}
                >
                  {group.name}
                </a>

                {isOwner && !group.isDefault && (
                  <div className="ws-item-controls">
                    <span onClick={() => void renameNoticeGroup(group.groupId)}>
                      ✎
                    </span>
                    <span onClick={() => void deleteNoticeGroup(group.groupId)}>
                      🗑
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="ws-info-area">
        <div className="info-group">
          <div className="info-label">TRIP DURATION</div>
          <div className="info-val">
            {formatDateRange(trip.startDate, trip.endDate)}
          </div>
          <div className="info-sub">
            {calcNightsDays(trip.startDate, trip.endDate)}
          </div>
        </div>

        <div className="info-group">
          <div className="info-label">MEMBERS ({tripMembers.length})</div>
          <div className="member-row">
            {tripMembers.map((m) => (
              <div
                key={m.memberId}
                className="mem-icon"
                style={
                  m.profileType === "CUSTOM"
                    ? { background: "transparent" }
                    : m.avatarColor
                      ? { background: m.avatarColor }
                      : undefined
                }
                title={m.nickname}
              >
                {m.profileType === "CUSTOM" && m.profileImage ? (
                  <img src={m.profileImage} alt={m.nickname} />
                ) : (
                  m.avatarEmoji || m.nickname.charAt(0).toUpperCase()
                )}
              </div>
            ))}
          </div>
        </div>

        <button className="btn-invite" onClick={handleCopyInviteLink}>
          <i className="fa-solid fa-share-nodes"></i> INVITE FRIENDS
        </button>
      </div>
      <ActionPromptModal
        open={inviteModal.open}
        title="INVITE FRIENDS"
        headline={inviteModal.headline}
        description={inviteModal.description}
        hideCancel
        confirmText="확인"
        onClose={() => setInviteModal((prev) => ({ ...prev, open: false }))}
        onConfirm={() => setInviteModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default WorkspaceSidebar;
