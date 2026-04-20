// components/ProfileIncompleteModal.tsx
import "../styles/MateModals.css";

interface ProfileIncompleteModalProps {
  onClose: () => void;
  onGoToEdit: () => void;
}

export function ProfileIncompleteModal({ onClose, onGoToEdit }: ProfileIncompleteModalProps) {
  return (
    <div className="modal-overlay active" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-window detail-window" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; PROFILE INCOMPLETE</span>
        </div>

        <div className="modal-body" style={{ textAlign: "center", padding: "48px 32px" }}>
          <p className="text-xl font-black uppercase tracking-tight mb-2">
            Complete Your Profile
          </p>
          <p className="text-sm text-black/50 font-bold mb-8">
            나이와 성별을 먼저 설정해주세요
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 border-3 border-black bg-white font-black uppercase text-sm hover:bg-[#eee] transition-all"
              style={{ border: "3px solid #000" }}
            >
              닫기
            </button>
            <button
              onClick={onGoToEdit}
              className="px-6 py-3 font-black uppercase text-sm transition-all button bgBlackHoverable"
            >
              프로필 설정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}