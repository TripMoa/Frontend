interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

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
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff',
          border: '3px solid #000',
          boxShadow: '15px 15px 0px #000',
          width: '360px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            background: '#000',
            color: '#fff',
            padding: '12px 20px'
          }}
        >
          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '16px',
              fontWeight: 900,
              letterSpacing: '1px'
            }}
          >
            {title}
          </span>
        </div>

        {/* 본문 */}
        <div style={{ padding: '24px' }}>
          <p
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '24px',
              whiteSpace: 'pre-line'
            }}
          >
            {message}
          </p>

          {/* 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={onCancel}
              style={{
                border: '2px solid #000',
                background: '#fff',
                padding: '8px 16px',
                fontWeight: 900,
                fontSize: '12px',
                fontFamily: "'Share Tech Mono', monospace",
                cursor: 'pointer'
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              style={{
                border: '2px solid #d00000',
                background: '#fff',
                color: '#d00000',
                padding: '8px 16px',
                fontWeight: 900,
                fontSize: '12px',
                fontFamily: "'Share Tech Mono', monospace",
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d00000';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#d00000';
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