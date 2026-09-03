// src/features/workspace/components/notice/NoticeItemModal.tsx
import React, { useEffect, useState } from "react";
import "../../styles/noticeModal.css";
import BaseModal from "../../../../shared/components/BaseModal";
import { useTripContext } from "../../hooks/useTripContext";
import type { NoticeUiColor, UseNoticesStore } from "../../hooks/useNotices";
import { ActionPromptModal } from "../../../../shared/components/ActionPromptModal";

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
  const { isOwner } = useTripContext();

  const isAddMode = editId === -1;
  const isEditMode = editId !== null && editId !== -1;
  const isNoticeModalOpen = editId !== null;

  const [color, setColor] = useState<NoticeUiColor>(defaultColor);
  const [tag, setTag] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const titleError = submitted && !title.trim();
  const contentError = submitted && !content.trim();

  const [deletePrompt, setDeletePrompt] = useState({
    open: false,
    tagName: "",
  });

  const [noticePrompt, setNoticePrompt] = useState({
    open: false,
    headline: "",
    description: "",
  });

  const filteredTags = allTags.filter((t) =>
    t.toLowerCase().includes(tag.toLowerCase()),
  );

  useEffect(() => {
    if (!isNoticeModalOpen) return;

    setSubmitted(false);

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
    setSubmitted(true);

    if (!title.trim() || !content.trim()) {
      return;
    }

    try {
      await saveNotice({
        color,
        tag,
        title: title.trim(),
        content: content.trim(),
      });
    } catch (error: any) {
      setNoticePrompt({
        open: true,
        headline: "공지 저장 실패",
        description:
          error?.response?.data?.message ??
          error?.message ??
          "공지 저장에 실패했습니다.",
      });
    }
  };

  const closeNoticePrompt = () => {
    setNoticePrompt((prev) => ({ ...prev, open: false }));
    setDeletePrompt({ open: false, tagName: "" });
  };

  const requestDeleteTag = (tagName: string) => {
    if (!isOwner) {
      setNoticePrompt({
        open: true,
        headline: "삭제 권한이 없습니다.",
        description: "태그 삭제는 여행 소유주만 할 수 있습니다.",
      });
      return;
    }

    setDeletePrompt({
      open: true,
      tagName,
    });
  };

  const confirmDeleteTag = async () => {
    try {
      await deleteTag(deletePrompt.tagName);

      setDeletePrompt({
        open: false,
        tagName: "",
      });
    } catch (error: any) {
      setDeletePrompt({
        open: false,
        tagName: "",
      });

      setNoticePrompt({
        open: true,
        headline: "태그 삭제 실패",
        description:
          error?.response?.data?.message ??
          error?.message ??
          "태그 삭제에 실패했습니다.",
      });
    }
  };

  return (
    <>
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

                      {isOwner && (
                        <button
                          type="button"
                          className="nm-tag-del"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDeleteTag(t);
                          }}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="nm-field">
            <label>TITLE</label>
            <input
              className={titleError ? "is-error" : ""}
              type="text"
              value={titleError ? "" : title}
              placeholder={titleError ? "제목을 입력해주세요." : "제목 입력"}
              onChange={(e) => {
                setSubmitted(false);
                setTitle(e.target.value);
              }}
            />
          </div>

          <div className="nm-field">
            <label>CONTENT</label>
            <textarea
              className={contentError ? "is-error" : ""}
              value={contentError ? "" : content}
              placeholder={contentError ? "내용을 입력해주세요." : "내용 입력"}
              onChange={(e) => {
                setSubmitted(false);
                setContent(e.target.value);
              }}
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

      <ActionPromptModal
        open={deletePrompt.open}
        title="태그 삭제"
        headline="태그를 삭제할까요?"
        description={`"${deletePrompt.tagName}" 태그를 삭제합니다.`}
        cancelText="취소"
        confirmText="삭제"
        onClose={() =>
          setDeletePrompt({
            open: false,
            tagName: "",
          })
        }
        onConfirm={() => void confirmDeleteTag()}
      />

      <ActionPromptModal
        open={noticePrompt.open}
        title="안내"
        headline={noticePrompt.headline}
        description={noticePrompt.description}
        hideCancel
        confirmText="확인"
        onClose={closeNoticePrompt}
        onConfirm={closeNoticePrompt}
      />
    </>
  );
};

export default NoticeModal;
