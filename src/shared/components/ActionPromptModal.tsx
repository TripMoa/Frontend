import "../styles/ActionPromptModal.css";

interface ActionPromptModalProps {
  open: boolean;
  title: string;
  headline: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ActionPromptModal({
  open,
  title,
  headline,
  description,
  cancelText = "닫기",
  confirmText = "확인",
  onClose,
  onConfirm,
}: ActionPromptModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay active"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-window detail-window"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="mh-title">{title}</span>
        </div>

        <div
          className="modal-body"
          style={{ textAlign: "center", padding: "48px 32px" }}
        >
          <p className="text-xl font-black uppercase tracking-tight mb-2">
            {headline}
          </p>
          <p className="text-sm text-black/50 font-bold mb-8">{description}</p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 border-3 border-black bg-white font-black uppercase text-sm hover:bg-[#eee] transition-all"
              style={{ border: "3px solid #000" }}
              type="button"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              className="px-6 py-3 font-black uppercase text-sm transition-all button bgBlackHoverable"
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
