import React, { useEffect, useState } from "react";
import "../../styles/workspace/modals.css";

import type { NoticeColor, NoticeItem } from "../../hooks/useWorkspaceCore";
import type { UseNoticesStore } from "../../hooks/useNotices";

interface Props {
  noticeStore: UseNoticesStore;
}

const NoticeModal: React.FC<Props> = ({ noticeStore }) => {
  const {
    editId,
    editingNotice,
    saveNotice,
    defaultColor,
    closeNotice,
    allTags,
    deleteTag,
  } = noticeStore;

  // ✅ editId 기반으로 모드 판정
  const isAddMode = editId === -1;
  const isEditMode = editId !== null && editId !== -1;
  const isNoticeModalOpen = editId !== null;

  const [color, setColor] = useState<NoticeColor>(defaultColor);
  const [tag, setTag] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 입력한 글자가 포함된 태그만 필터링
  const filteredTags = allTags.filter((t) => t.includes(tag));

  // 모달 오픈 시 초기화(원본과 최대한 유사하게)
  useEffect(() => {
    if (!isNoticeModalOpen) return;

    if (isEditMode && editingNotice) {
      setColor(editingNotice.color);
      setTag(editingNotice.tag);
      setTitle(editingNotice.title);
      setContent(editingNotice.content);
    } else if (isAddMode) {
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
    const payload: NoticeItem = {
      id: isEditMode ? (editId as number) : Date.now(),
      color,
      tag,
      title,
      content,
    };
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

            <div className="inp-row" style={{ position: "relative" }}>
              <label>TAG</label>
              <div
                className={`input-combo ${
                  isOpen && filteredTags.length > 0 ? "open" : ""
                }`}
              >
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  onFocus={() => setIsOpen(true)}
                  onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                  placeholder="태그를 입력하세요"
                  autoComplete="off"
                />

                {isOpen && filteredTags.length > 0 && (
                  <div className="naver-style-list">
                    {filteredTags.map((t) => (
                      <div
                        key={t}
                        className="naver-style-item"
                        onClick={() => {
                          setTag(t);
                          setIsOpen(false);
                        }}
                      >
                        <div className="ns-left">
                          <i className="fa-regular fa-clock"></i>
                          <span>{t}</span>
                        </div>

                        {/* ✅ 개별 삭제 버튼 */}
                        <button
                          className="ns-del-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // 부모 클릭(태그 선택) 방지
                            deleteTag(t);
                          }}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
