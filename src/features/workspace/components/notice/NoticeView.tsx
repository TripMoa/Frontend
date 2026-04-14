// src/features/workspace/components/notice/NoticeView.tsx

import React from "react";
import type { NoticeItem } from "../../hooks/useNotices";

interface Props {
  notices: NoticeItem[];
  isLoading?: boolean;
  onAdd: () => void;
  onEdit: (id: number) => void | Promise<void>;
  onDelete: (id: number) => void | Promise<void>;
  onTogglePin: (id: number) => void | Promise<void>;
}

const NoticeView: React.FC<Props> = ({
  notices,
  isLoading = false,
  onAdd,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 800,
            margin: 0,
          }}
        >
          TRIP NOTICE
        </h2>

        <button
          className="btn-sm"
          style={{ padding: "8px 15px" }}
          onClick={onAdd}
        >
          + NEW NOTICE
        </button>
      </div>

      <div className="notice-container" id="notice-list-container">
        {isLoading ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#777",
              fontWeight: 500,
            }}
          >
            공지사항을 불러오는 중입니다.
          </div>
        ) : notices.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#777",
              fontWeight: 500,
            }}
          >
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className={`notice-card ${notice.color} ${
                notice.isPinned ? "pinned" : ""
              }`}
            >
              <div
                className={`nc-pin-btn ${notice.isPinned ? "active" : ""}`}
                onClick={() => void onTogglePin(notice.id)}
              >
                <i className="fa-solid fa-thumbtack"></i>
              </div>

              <div className="nc-tag">{notice.tag}</div>

              <div className="nc-title">{notice.title}</div>

              <div className="nc-content">{notice.content}</div>

              <div className="nc-controls">
                <span
                  className="nc-btn edit"
                  onClick={() => void onEdit(notice.id)}
                >
                  EDIT
                </span>
                <span
                  className="nc-btn del"
                  onClick={() => void onDelete(notice.id)}
                >
                  DELETE
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default NoticeView;
