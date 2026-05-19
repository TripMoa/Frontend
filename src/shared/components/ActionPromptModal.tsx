// src/shared/components/ActionPromptModal.tsx

import type { ReactNode } from "react";
import "../styles/ActionPromptModal.css";

interface ActionPromptModalProps {
  open: boolean;
  title: string;
  headline: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  hideCancel?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}

export function ActionPromptModal({
  open,
  title,
  headline,
  description,
  cancelText = "닫기",
  confirmText = "확인",
  hideCancel = false,
  onClose,
  onConfirm,
  children,
}: ActionPromptModalProps) {
  if (!open) return null;

  return (
    <div
      className="action-prompt-overlay active"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="action-prompt-window"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="action-prompt-header">
          <span className="action-prompt-title">{title}</span>
        </div>

        <div className="action-prompt-body">
          <p className="action-prompt-headline">{headline}</p>
          <p className="action-prompt-description">{description}</p>

          {children && <div className="action-prompt-extra">{children}</div>}

          <div className="action-prompt-buttons">
            {!hideCancel && (
              <button
                onClick={onClose}
                className="action-prompt-cancel-btn"
                type="button"
              >
                {cancelText}
              </button>
            )}

            <button
              onClick={onConfirm}
              className="action-prompt-confirm-btn"
              type="button"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
