// src/features/workspace/components/notice/NoticeItemModal.tsx
//
// 공지 추가·수정 — 시안(ntc): 좁은 모달 · 태그(눌러서 고르기 + 새 태그) · 제목 · 내용 · 상단에 고정(수정할 때) · [삭제][취소][저장]
// 저장·삭제·고정·태그 삭제 동작은 예전 창 그대로이고, 모양과 확인창만 바꿨다.
import React, { useEffect, useState } from "react";
import { useTripContext } from "../../hooks/useTripContext";
import type { NoticeUiColor, UseNoticesStore } from "../../hooks/useNotices";
import { apiMessage } from "../../hooks/apiError";
import WsConfirm from "../layout/WsConfirm";

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
    deleteNotice,
    togglePin,
  } = noticeStore;
  const { isOwner } = useTripContext();

  const isAddMode = editId === -1;
  const isEditMode = editId !== null && editId !== -1;
  const isNoticeModalOpen = editId !== null;

  // 카드 색은 시안에서 화면에서 고르지 않는다 — 새 공지는 기본 색, 수정할 땐 원래 색을 그대로 둔다
  const [color, setColor] = useState<NoticeUiColor>(defaultColor);
  const [tag, setTag] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const titleError = submitted && !title.trim();
  const contentError = submitted && !content.trim();

  const [tagManageOpen, setTagManageOpen] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState({ open: false, tagName: "" });
  const [deleteNoticePrompt, setDeleteNoticePrompt] = useState(false);
  const [noticePrompt, setNoticePrompt] = useState({ open: false, headline: "", description: "" });

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

    if (!title.trim() || !content.trim()) return;

    try {
      await saveNotice({ color, tag, title: title.trim(), content: content.trim() });
    } catch (error) {
      setNoticePrompt({ open: true, headline: "공지 저장 실패", description: apiMessage(error, "공지 저장에 실패했습니다.") });
    }
  };

  const closeNoticePrompt = () => {
    setNoticePrompt((prev) => ({ ...prev, open: false }));
    setDeletePrompt({ open: false, tagName: "" });
  };

  const requestDeleteTag = (tagName: string) => {
    if (!isOwner) {
      setNoticePrompt({ open: true, headline: "삭제 권한이 없습니다.", description: "태그 삭제는 여행 소유주만 할 수 있습니다." });
      return;
    }
    setDeletePrompt({ open: true, tagName });
  };

  const confirmDeleteTag = async () => {
    try {
      await deleteTag(deletePrompt.tagName);
      setDeletePrompt({ open: false, tagName: "" });
    } catch (error) {
      setDeletePrompt({ open: false, tagName: "" });
      setNoticePrompt({ open: true, headline: "태그 삭제 실패", description: apiMessage(error, "태그 삭제에 실패했습니다.") });
    }
  };

  const confirmDeleteNotice = async () => {
    if (!isEditMode || editId == null) return;
    setDeleteNoticePrompt(false);
    try {
      await deleteNotice(editId);
      closeNotice();
    } catch (error) {
      setNoticePrompt({ open: true, headline: "공지 삭제 실패", description: apiMessage(error, "공지 삭제에 실패했습니다.") });
    }
  };

  const handleTogglePin = async () => {
    if (!isEditMode || editId == null || !editingNotice) return;
    if (editingNotice.isPinned && !isOwner) return;
    try {
      await togglePin(editId);
    } catch (error) {
      setNoticePrompt({ open: true, headline: "고정 상태 변경 실패", description: apiMessage(error, "공지 고정 상태 변경에 실패했습니다.") });
    }
  };

  const star = <span className="ws-req" aria-hidden="true">*</span>;
  const pinnedLocked = !!editingNotice?.isPinned && !isOwner;

  return (
    <>
      {isNoticeModalOpen && (
        <div className="tm-overlay">
          <div
            className="tm-modal tm-modal--narrow"
            role="dialog"
            aria-modal="true"
            aria-label={isEditMode ? "공지 수정" : "공지 추가"}
          >
            <div className="tm-modal__head">
              <h3 className="tm-modal__title">{isEditMode ? "공지 수정" : "공지 추가"}</h3>
              <button type="button" className="tm-btn tm-btn--sm" onClick={closeNotice}>닫기</button>
            </div>

            <div className="tm-modal__body">
              <div className="ws-fld">
                <span className="ws-when__l">태그</span>
                <div className="tm-row tm-row--wrap tm-gap-2">
                  {allTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`tm-chip${tag === t ? " is-on" : ""}`}
                      aria-pressed={tag === t}
                      onClick={() => setTag(tag === t ? "" : t)}
                    >
                      {t}
                    </button>
                  ))}
                  <input
                    className="tm-input ws-ntag__in"
                    placeholder="새 태그"
                    aria-label="새 태그"
                    value={tag}
                    maxLength={20}
                    onChange={(e) => setTag(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                {isOwner && allTags.length > 0 && (
                  <button
                    type="button"
                    className="tm-btn tm-btn--link tm-btn--sm ws-ulink ws-ntag__manage"
                    onClick={() => setTagManageOpen(true)}
                  >
                    태그 관리
                  </button>
                )}
              </div>

              <div className="ws-fld">
                <label className="ws-when__l" htmlFor="ws-n-t">제목 {star}</label>
                <input
                  id="ws-n-t"
                  className={`tm-input${titleError ? " tm-input--error" : ""}`}
                  type="text"
                  value={titleError ? "" : title}
                  placeholder={titleError ? "제목을 입력해주세요." : "제목 입력"}
                  onChange={(e) => {
                    setSubmitted(false);
                    setTitle(e.target.value);
                  }}
                />
              </div>

              <div className="ws-fld">
                <label className="ws-when__l" htmlFor="ws-n-b">내용 {star}</label>
                <textarea
                  id="ws-n-b"
                  className={`tm-textarea${contentError ? " tm-textarea--error" : ""}`}
                  value={contentError ? "" : content}
                  placeholder={contentError ? "내용을 입력해주세요." : "내용 입력"}
                  onChange={(e) => {
                    setSubmitted(false);
                    setContent(e.target.value);
                  }}
                />
              </div>

              {isEditMode && editingNotice && (
                <label
                  className="tm-check"
                  title={pinnedLocked ? "고정 해제는 소유주만 할 수 있어요" : undefined}
                >
                  <input
                    type="checkbox"
                    checked={editingNotice.isPinned}
                    disabled={pinnedLocked}
                    onChange={() => void handleTogglePin()}
                  />
                  <span>상단에 고정</span>
                </label>
              )}
            </div>

            <div className="tm-modal__foot">
              {isEditMode && isOwner && (
                <button
                  type="button"
                  className="tm-btn tm-btn--danger tm-mr-auto"
                  onClick={() => setDeleteNoticePrompt(true)}
                >
                  삭제
                </button>
              )}
              <button type="button" className="tm-btn" onClick={closeNotice}>취소</button>
              <button type="button" className="tm-btn tm-btn--primary" onClick={() => void handleSaveNotice()}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 태그 관리 — 시안의 "공지 그룹 관리"와 같은 모양 */}
      {isNoticeModalOpen && tagManageOpen && (
        <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setTagManageOpen(false); }}>
          <div
            className="tm-modal tm-modal--narrow"
            role="dialog"
            aria-modal="true"
            aria-label="공지 태그 관리"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tm-modal__head">
              <h3 className="tm-modal__title">공지 태그 관리</h3>
              <button type="button" className="tm-btn tm-btn--sm" onClick={() => setTagManageOpen(false)}>닫기</button>
            </div>
            <div className="tm-modal__body">
              <p className="ws-aidesc ws-ng__desc">태그를 지우면 그 태그가 붙은 공지에서 태그가 사라져요.</p>
              <div className="ws-sett">
                {allTags.map((t) => (
                  <div key={t} className="ws-airow ws-airow--pool">
                    <span className="tm-tag ws-ntag__tag">{t}</span>
                    <button
                      type="button"
                      className="tm-btn tm-btn--link tm-btn--sm ws-ulink ws-ulink--danger"
                      onClick={() => requestDeleteTag(t)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="tm-modal__foot">
              <button type="button" className="tm-btn" onClick={() => setTagManageOpen(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      <WsConfirm
        open={deletePrompt.open}
        title="태그 삭제"
        headline="태그를 삭제할까요?"
        description={`"${deletePrompt.tagName}" 태그를 삭제합니다.`}
        cancelText="취소"
        confirmText="삭제"
        danger
        onClose={() => setDeletePrompt({ open: false, tagName: "" })}
        onConfirm={() => void confirmDeleteTag()}
      />

      <WsConfirm
        open={deleteNoticePrompt}
        title="공지 삭제"
        headline="공지를 삭제할까요?"
        description="삭제한 공지는 다시 복구할 수 없습니다."
        cancelText="취소"
        confirmText="삭제"
        danger
        onClose={() => setDeleteNoticePrompt(false)}
        onConfirm={() => void confirmDeleteNotice()}
      />

      <WsConfirm
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
