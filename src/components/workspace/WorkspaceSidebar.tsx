import React from "react";
import "../../styles/workspace/sidebar.css";
import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";

const WorkspaceSidebar: React.FC = () => {
  const {
    dateLogs,
    noticeGroups,
    activeView,
    currentDay,
    currentNoticeGroup,
    selectTab,
    addDateLog,
    addNoticeGroup,
    renameItem,
    deleteItem,
  } = useWorkspaceCore();

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
                <span onClick={() => renameItem("date", idx)}>✎</span>
                <span onClick={() => deleteItem("date", idx)}>🗑</span>
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
            [ ] EXPENSES
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
            [ ] VOUCHER
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
          <button className="btn-add-mini" onClick={addNoticeGroup}>
            [+]
          </button>
        </div>

        <div id="notice-log-list">
          <div
            className={`ws-item-wrapper ${
              activeView === "notice" && currentNoticeGroup === "TRIP NOTICE"
                ? "active"
                : ""
            }`}
          >
            <a
              className="ws-item"
              onClick={() => selectTab("TRIP NOTICE", "notice")}
            >
              [ ] TRIP NOTICE
            </a>
          </div>

          {noticeGroups.map((group, idx) => (
            <div
              key={`${group.name}-${idx}`}
              className={`ws-item-wrapper ${
                activeView === "notice" && currentNoticeGroup === group.name
                  ? "active"
                  : ""
              }`}
            >
              <a
                className="ws-item"
                onClick={() => selectTab(group.name, "notice")}
              >
                [ ] {group.name}
              </a>

              <div className="ws-item-controls">
                <span onClick={() => renameItem("notice", idx)}>✎</span>
                <span onClick={() => deleteItem("notice", idx)}>🗑</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ws-info-area">
        <div className="info-group">
          <div className="info-label">TRIP DURATION</div>
          <div className="info-val">2025.12.24 - 12.25</div>
          <div className="info-sub">1박 2일</div>
        </div>

        <div className="info-group">
          <div className="info-label">MEMBERS (4)</div>
          <div className="member-row">
            <div className="mem-icon owner">ME</div>
            <div className="mem-icon">J</div>
            <div className="mem-icon">K</div>
            <div className="mem-icon">M</div>
          </div>
        </div>

        <button
          className="btn-invite"
          onClick={() => {
            alert("초대 링크가 복사되었습니다!");
          }}
        >
          <i className="fa-solid fa-share-nodes"></i> INVITE FRIENDS
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSidebar;
