import "../styles/MateModals.css";

interface LoginPromptModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export function LoginPromptModal({ onClose, onLogin }: LoginPromptModalProps) {
  return (
    <div className="modal-overlay active" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-window detail-window" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; LOGIN REQUIRED</span>
        </div>

        <div className="modal-body" style={{ textAlign: "center", padding: "48px 32px" }}>
          <p className="text-xl font-black uppercase tracking-tight mb-2">
            Members Only
          </p>
          <p className="text-sm text-black/50 font-bold mb-8">
            이 기능은 로그인 후 이용할 수 있습니다
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 border-3 border-black bg-white font-black uppercase text-sm hover:bg-[#eee] transition-all"
              style={{ border: "3px solid #000" }}
            >
              둘러보기
            </button>
            <button
              onClick={onLogin}
              className="px-6 py-3 font-black uppercase text-sm transition-all button bgBlackHoverable"
            >
              로그인하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}