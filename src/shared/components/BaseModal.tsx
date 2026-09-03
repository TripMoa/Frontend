// src/shared/components/BaseModal.tsx
import React from "react";
import "../styles/BaseModal.css";

interface BaseModalProps {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  bodyClassName?: string;
  width?: number | string;
  height?: number | string;
  closeText?: React.ReactNode;
}

const BaseModal: React.FC<BaseModalProps> = ({
  open,
  title,
  onClose,
  children,
  className = "",
  overlayClassName = "",
  bodyClassName = "",
  width,
  height,
  closeText = "CLOSE [X]",
}) => {
  if (!open) return null;

  return (
    <div
      className={`base-modal-backdrop ${overlayClassName}`.trim()}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`base-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          ...(width !== undefined ? { width } : {}),
          ...(height !== undefined ? { height } : {}),
        }}
      >
        <div className="base-modal-header">
          <div className="base-modal-title">&gt;&gt; {title}</div>

          <button type="button" className="base-modal-close" onClick={onClose}>
            {closeText}
          </button>
        </div>

        <div className={`base-modal-body ${bodyClassName}`.trim()}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;
