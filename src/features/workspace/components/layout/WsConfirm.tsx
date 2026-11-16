// src/features/workspace/components/layout/WsConfirm.tsx
//
// 작업 화면 안에서 쓰는 확인창 — 디자인 기준(시안)의 "ask" 모양: 좁은 모달 + 굵은 한 줄 + 설명 + [취소][실행].
// 공통 ActionPromptModal 은 다른 화면이 같이 쓰므로 건드리지 않고, 작업 화면 전용으로 따로 둔다.
import React from "react";

interface Props {
  open: boolean;
  title: string;
  headline: string;
  description?: string;
  cancelText?: string;
  confirmText: string;
  /** 지우기·내보내기처럼 되돌리기 어려운 동작이면 빨간 위험 버튼 */
  danger?: boolean;
  /** 안내만 하는 창(확인 버튼 하나) */
  hideCancel?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const WsConfirm: React.FC<Props> = ({
  open,
  title,
  headline,
  description,
  cancelText = "취소",
  confirmText,
  danger = false,
  hideCancel = false,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;
  return (
    <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="tm-modal tm-modal--narrow"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tm-modal__head">
          <h3 className="tm-modal__title">{title}</h3>
          <button type="button" className="tm-btn tm-btn--sm" onClick={onClose}>닫기</button>
        </div>
        <div className="tm-modal__body">
          <p className="tm-confirm__headline">{headline}</p>
          {description && <p className="tm-hint ws-confirm__desc">{description}</p>}
        </div>
        <div className="tm-modal__foot">
          {!hideCancel && (
            <button type="button" className="tm-btn" onClick={onClose}>{cancelText}</button>
          )}
          <button
            type="button"
            className={`tm-btn ${danger ? "tm-btn--danger" : "tm-btn--primary"}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WsConfirm;
