// src/features/workspace/components/notice/NoticeItemModal.tsx
import React, { useEffect, useState } from "react";
import "../../styles/noticeModal.css";
import BaseModal from "../../../../shared/components/BaseModal";
import type { NoticeUiColor, UseNoticesStore } from "../../hooks/useNotices";

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

  const isAddMode = editId === -1;
  const isEditMode = editId !== null && editId !== -1;
  const isNoticeModalOpen = editId !== null;

  const [color, setColor] = useState<NoticeUiColor>(defaultColor);
  const [tag, setTag] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const filteredTags = allTags.filter((t) =>
    t.toLowerCase().includes(tag.toLowerCase()),
  );

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

  useEffect(() => {
    if (!isNoticeModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNotice();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isNoticeModalOpen, closeNotice]);

  const handleSaveNotice = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    await saveNotice({
      color,
      tag,
      title,
      content,
    });
  };

  return (
    <BaseModal
      open={isNoticeModalOpen}
      title="ADD/EDIT NOTICE"
      onClose={closeNotice}
      className="nm-modal"
      width="min(560px, 92vw)"
    >
      <div className="nm-body">
        <div className="nm-field">
          <label>COLOR SELECT</label>
          <div className="nm-color-picker">
            {(["white", "yellow", "blue", "green"] as NoticeUiColor[]).map(
              (c) => (
                <label key={c} className="nm-color-radio">
                  <input
                    type="radio"
                    checked={color === c}
                    onChange={() => setColor(c)}
                  />
                  <span className={`nm-color-box ${c}`} />
                </label>
              ),
            )}
          </div>
        </div>

        <div className="nm-field nm-tag-field">
          <label>TAG</label>

          <div
            className={`nm-input-combo ${
              isOpen && filteredTags.length > 0 ? "is-open" : ""
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
              <div className="nm-tag-list">
                {filteredTags.map((t) => (
                  <div
                    key={t}
                    className="nm-tag-item"
                    onClick={() => {
                      setTag(t);
                      setIsOpen(false);
                    }}
                  >
                    <div className="nm-tag-left">
                      <i className="fa-regular fa-clock"></i>
                      <span>{t}</span>
                    </div>

                    <button
                      type="button"
                      className="nm-tag-del"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteTag(t);
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

        <div className="nm-field">
          <label>TITLE</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="nm-field">
          <label>CONTENT</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="nm-save"
          onClick={() => void handleSaveNotice()}
        >
          SAVE NOTICE
        </button>
      </div>
    </BaseModal>
  );
};

export default NoticeModal;
