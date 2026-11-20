interface CustomAlertProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

// 알림창 - 디자인 기준 tm-overlay > tm-modal--narrow + tm-confirm 과 같은 값 (구조는 그대로, 값만 --tm-* 토큰)
function CustomAlert({ show, message, onClose }: CustomAlertProps) {
  if (!show || !message) return null;

  return (
    <div
      className="custom-alert"
      onClick={onClose}
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
        zIndex: 10000
      }}
    >
      <div
        className="custom-alert-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--tm-paper)',
          border: 'var(--tm-bd-thin)',
          padding: '28px 24px 20px',
          width: 'min(400px, 100%)',
          textAlign: 'center',
          boxShadow: 'var(--tm-shadow-float)'
        }}
      >
        <div
          className="custom-alert-message"
          style={{
            fontSize: 'var(--tm-fs-lg)',
            fontWeight: 900,
            fontFamily: 'var(--tm-font)',
            color: 'var(--tm-ink)',
            marginBottom: '20px',
            lineHeight: 1.4,
            whiteSpace: 'pre-line'
          }}
        >
          {message}
        </div>
        {/* 확인 = tm-btn--dark */}
        <button
          className="custom-alert-btn"
          onClick={onClose}
          style={{
            background: 'var(--tm-ink)',
            color: 'var(--tm-paper)',
            border: '1.5px solid var(--tm-ink)',
            height: 'var(--tm-h-btn)',
            minWidth: '120px',
            padding: '0 24px',
            fontSize: 'var(--tm-fs-md)',
            fontWeight: 800,
            fontFamily: 'var(--tm-font)',
            cursor: 'pointer',
            transition: 'background .12s, border-color .12s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--tm-red)';
            e.currentTarget.style.border = '1.5px solid var(--tm-red)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--tm-ink)';
            e.currentTarget.style.border = '1.5px solid var(--tm-ink)';
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default CustomAlert;
