// src/features/workspace/components/notice/NoticeView.tsx
//
// 공지 목록 — 시안: 카드(태그 · 고정 표시 · 제목 · 내용)를 격자로 놓고, 누르면 수정 창이 열린다.
// 고정·삭제는 수정 창 안으로 옮겼고, 윗줄(그룹 알약 · 그룹 관리 · + 공지 추가)은 WorkspaceCenter 에 있다.
import React from "react";
import type { NoticeItem, NoticeUiColor } from "../../hooks/useNotices";

interface Props {
  notices: NoticeItem[];
  isLoading?: boolean;
  onEdit: (id: number) => void | Promise<void>;
}

// 공지 색 → 카드 왼쪽 띠 색 · 태그 색조
const BAR: Record<NoticeUiColor, string> = {
  white: "var(--tm-line-strong)",
  yellow: "var(--tm-yellow)",
  blue: "var(--tm-tint-blue)",
  green: "var(--tm-tint-mint)",
};
const TONE: Record<NoticeUiColor, string> = {
  white: "",
  yellow: " tm-tag--yellow",
  blue: " tm-tag--blue",
  green: " tm-tag--mint",
};

const NoticeView: React.FC<Props> = ({ notices, isLoading = false, onEdit }) => {
  if (isLoading) return <div className="tm-empty">공지사항을 불러오는 중이에요.</div>;

  if (notices.length === 0) {
    return (
      <div className="tm-empty">
        등록된 공지사항이 없습니다.
        <br />
        <span className="tm-hint">새로운 공지를 추가해 보세요.</span>
      </div>
    );
  }

  // 고정한 공지를 위로 (같은 묶음 안에서는 원래 순서)
  const sorted = [...notices].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

  return (
    <div className="ws-ngrid">
      {sorted.map((n) => (
        <button
          key={n.id}
          type="button"
          className="tm-notice-item tm-notice-item--colored ws-ncard"
          style={{ ["--tm-nc" as string]: BAR[n.color] ?? BAR.yellow }}
          onClick={() => void onEdit(n.id)}
          aria-label={`${n.title} 공지 열기`}
        >
          <span className="tm-row tm-gap-2">
            {n.tag && <span className={`tm-tag${TONE[n.color] ?? ""}`}>{n.tag}</span>}
            {n.isPinned && <span className="tm-tag tm-tag--dark">고정</span>}
          </span>
          <span className="tm-notice-item__title">{n.title}</span>
          <span className="tm-notice-item__meta">{n.content}</span>
        </button>
      ))}
    </div>
  );
};

export default NoticeView;
