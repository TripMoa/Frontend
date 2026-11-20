interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

// 확인 모달 - 디자인 기준 tm-overlay > tm-modal--narrow 와 같은 값 (구조는 그대로, 값만 --tm-* 토큰)
function ConfirmModal({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소'
}: ConfirmModalProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--tm-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 100000
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--tm-paper)',
          border: 'var(--tm-bd-thin)',
          boxShadow: 'var(--tm-shadow-float)',
          width: 'min(400px, 100%)',
          fontFamily: 'var(--tm-font)',
          color: 'var(--tm-ink)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            background: 'var(--tm-paper)',
            color: 'var(--tm-ink)',
            padding: '14px 20px 10px'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--tm-font)',
              fontSize: '20px',
              fontWeight: 900,
              lineHeight: 1.3,
              letterSpacing: '-.03em'
            }}
          >
            {title}
          </span>
        </div>

        {/* 본문 */}
        <div style={{ padding: '4px 0 0' }}>
          <p
            style={{
              fontFamily: 'var(--tm-font)',
              fontSize: 'var(--tm-fs-md)',
              fontWeight: 600,
              lineHeight: '1.6',
              color: 'var(--tm-mute)',
              margin: 0,
              padding: '0 20px 16px',
              whiteSpace: 'pre-line'
            }}
          >
            {message}
          </p>

          {/* 버튼 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--tm-gap-2)',
              padding: '12px 20px',
              borderTop: 'var(--tm-bd-soft)'
            }}
          >
            <button
              onClick={onCancel}
              style={{
                border: 'var(--tm-bd-thin)',
                background: 'var(--tm-paper)',
                color: 'var(--tm-ink)',
                height: 'var(--tm-h-btn)',
                padding: '0 16px',
                fontWeight: 800,
                fontSize: 'var(--tm-fs-md)',
                fontFamily: 'var(--tm-font)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--tm-ink)';
                e.currentTarget.style.color = 'var(--tm-paper)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--tm-paper)';
                e.currentTarget.style.color = 'var(--tm-ink)';
              }}
            >
              {cancelText}
            </button>
            {/* 삭제·나가기 = tm-btn--danger */}
            <button
              onClick={onConfirm}
              style={{
                border: '1.5px solid var(--tm-ink)',
                background: 'var(--tm-paper)',
                color: 'var(--tm-red)',
                height: 'var(--tm-h-btn)',
                padding: '0 16px',
                fontWeight: 800,
                fontSize: 'var(--tm-fs-md)',
                fontFamily: 'var(--tm-font)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--tm-red)';
                e.currentTarget.style.border = '1.5px solid var(--tm-red)';
                e.currentTarget.style.color = 'var(--tm-paper)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--tm-paper)';
                e.currentTarget.style.border = '1.5px solid var(--tm-ink)';
                e.currentTarget.style.color = 'var(--tm-red)';
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
