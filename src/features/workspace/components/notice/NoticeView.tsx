// src/features/workspace/components/notice/NoticeView.tsx

import React, { useState } from "react";
import { ActionPromptModal } from "../../../../shared/components/ActionPromptModal";
import type { NoticeItem } from "../../hooks/useNotices";
import { useTripContext } from "../../hooks/useTripContext";

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
  const { isOwner } = useTripContext();

  const [deletePrompt, setDeletePrompt] = useState({
    open: false,
    noticeId: null as number | null,
  });

  const [noticePrompt, setNoticePrompt] = useState({
    open: false,
    headline: "",
    description: "",
  });

  const closeNoticePrompt = () => {
    setNoticePrompt((prev) => ({ ...prev, open: false }));
    setDeletePrompt({ open: false, noticeId: null });
  };

  const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message ?? error?.message ?? fallback;

  const confirmDeleteNotice = async () => {
    if (deletePrompt.noticeId == null) return;

    try {
      await onDelete(deletePrompt.noticeId);
      setDeletePrompt({ open: false, noticeId: null });
    } catch (error: any) {
      setDeletePrompt({ open: false, noticeId: null });
      setNoticePrompt({
        open: true,
        headline: "공지 삭제 실패",
        description: getErrorMessage(error, "공지 삭제에 실패했습니다."),
      });
    }
  };

  const handleTogglePin = async (notice: NoticeItem) => {
    if (notice.isPinned && !isOwner) return;

    try {
      await onTogglePin(notice.id);
    } catch (error: any) {
      setNoticePrompt({
        open: true,
        headline: "고정 상태 변경 실패",
        description: getErrorMessage(
          error,
          "공지 고정 상태 변경에 실패했습니다.",
        ),
      });
    }
  };

  const requestDeleteNotice = (noticeId: number) => {
    if (!isOwner) {
      setNoticePrompt({
        open: true,
        headline: "삭제 권한이 없습니다.",
        description: "공지 삭제는 여행 소유주만 할 수 있습니다.",
      });
      return;
    }

    setDeletePrompt({
      open: true,
      noticeId,
    });
  };

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

      <div
        className={`notice-container ${!isLoading && notices.length === 0 ? "empty" : ""}`}
        id="notice-list-container"
      >
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
          <div className="notice-empty">
            <i className="fa-regular fa-note-sticky"></i>
            <p>등록된 공지사항이 없습니다.</p>
            <span>새로운 공지를 추가해보세요.</span>
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
                className={`nc-pin-btn ${notice.isPinned ? "active" : ""} ${
                  notice.isPinned && !isOwner ? "disabled" : ""
                }`}
                onClick={() => void handleTogglePin(notice)}
                title={
                  notice.isPinned
                    ? isOwner
                      ? "핀 해제"
                      : "핀 해제는 소유주만 가능합니다"
                    : "핀 고정"
                }
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

                {isOwner && (
                  <span
                    className="nc-btn del"
                    onClick={() => requestDeleteNotice(notice.id)}
                  >
                    DELETE
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ActionPromptModal
        open={deletePrompt.open}
        title="공지 삭제"
        headline="공지를 삭제할까요?"
        description="삭제한 공지는 다시 복구할 수 없습니다."
        cancelText="취소"
        confirmText="삭제"
        onClose={() => setDeletePrompt({ open: false, noticeId: null })}
        onConfirm={() => void confirmDeleteNotice()}
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

export default NoticeView;
