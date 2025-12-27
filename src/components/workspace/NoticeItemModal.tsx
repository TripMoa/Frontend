import React, { useEffect, useState } from "react";
import "../../styles/workspace/modals.css";

import type { NoticeColor, NoticeItem } from "../../hooks/useWorkspaceCore";
import type { UseNoticesStore } from "../../hooks/useNotices";

interface Props {
  noticeStore: UseNoticesStore;
}

const NoticeModal: React.FC<Props> = ({ noticeStore }) => {
  const { editIndex, editingNotice, saveNotice, defaultColor, closeNotice } =
    noticeStore;

  const isAddMode = editIndex === -1;
  const isEditMode = editIndex !== null && editIndex !== -1;

  // ✅ editIndex가 null이 아니면 모달 open (새 공지/수정 공지 공용)
  const isNoticeModalOpen = editIndex !== null;

  const [color, setColor] = useState<NoticeColor>(defaultColor);
  const [tag, setTag] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 모달 오픈 시 초기화(원본과 최대한 유사하게)
  useEffect(() => {
    if (!isNoticeModalOpen) return;

    // ✅ 수정 모드: 기존 데이터 채우기
    if (isEditMode && editingNotice) {
      setColor(editingNotice.color);
      setTag(editingNotice.tag);
      setTitle(editingNotice.title);
      setContent(editingNotice.content);
      return;
    }

    // ✅ 추가 모드: 초기화
    if (isAddMode) {
      setColor(defaultColor);
      setTag("");
      setTitle("");
      setContent("");
    }
  }, [isNoticeModalOpen, isAddMode, isEditMode, editingNotice, defaultColor]);

  // ESC 닫기
  useEffect(() => {
    if (!isNoticeModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNotice();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isNoticeModalOpen, closeNotice]);

  const handleSaveNotice = () => {
    const payload: NoticeItem = { color, tag, title, content };
    saveNotice(payload);
  };

  return (
    <>
      {/* ========================= */}
      {/* NOTICE MODAL */}
      {/* ========================= */}
      <div
        id="notice-modal"
        className={`modal-overlay ${isNoticeModalOpen ? "active" : ""}`}
        onMouseDown={(e) => {
          // ✅ overlay(바깥) 클릭 시 닫기
          if (e.target === e.currentTarget) closeNotice();
        }}
      >
        <div className="modal-window" style={{ width: "500px" }}>
          <div className="modal-header">
            <span className="mh-title">&gt;&gt; ADD/EDIT NOTICE</span>

            <button className="mh-close" onClick={closeNotice}>
              CLOSE [X]
            </button>
          </div>

          <div
            className="modal-body"
            style={{ padding: "20px", background: "#fff" }}
          >
            <div className="inp-row">
              <label>COLOR SELECT</label>
              <div className="color-picker">
                {(["white", "yellow", "blue", "green"] as NoticeColor[]).map(
                  (c) => (
                    <label key={c} className="color-radio">
                      <input
                        type="radio"
                        checked={color === c}
                        onChange={() => setColor(c)}
                      />
                      <span className={`c-box ${c}`} />
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="inp-row">
              <label>TAG</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>

            <div className="inp-row">
              <label>TITLE</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="inp-row">
              <label>CONTENT</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <button
              className="btn-save-exp"
              style={{ width: "100%", marginTop: "20px" }}
              onClick={handleSaveNotice}
            >
              SAVE NOTICE
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NoticeModal;
