interface CustomAlertProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

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
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
    >
      <div 
        className="custom-alert-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          border: '3px solid #000',
          padding: '35px 50px',
          minWidth: '400px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 1)'
        }}
      >
        <div 
          className="custom-alert-message"
          style={{
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: "'Share Tech Mono', monospace",
            color: '#000',
            marginBottom: '25px',
            lineHeight: 1.6
          }}
        >
          {message}
        </div>
        <button 
          className="custom-alert-btn" 
          onClick={onClose}
          style={{
            background: '#000',
            color: '#fff',
            border: '3px solid #000',
            padding: '10px 40px',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: "'Share Tech Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#000';
            e.currentTarget.style.color = '#fff';
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default CustomAlert;