interface DeleteModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

function DeleteModal({ 
  show, 
  onClose, 
  onConfirm,
  title = '댓글 삭제',
  message = '댓글을 삭제하시겠습니까?\n삭제된 댓글은 복구할 수 없습니다.'
}: DeleteModalProps) {
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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          border: '3px solid #000',
          boxShadow: '15px 15px 0px #000',
          width: '360px'
        }}
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
              onClick={onClose}
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
              취소
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
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;