interface LikesModalProps {
  show: boolean;
  onClose: () => void;
  stories: any[];
  onStoryClick: (story: any) => void;
}

function LikesModal({ show, onClose, stories, onStoryClick }: LikesModalProps) {
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
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          background: '#fff',
          border: '3px solid #000',
          boxShadow: '15px 15px 0px #000',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          background: '#000',
          color: '#fff',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '16px',
            fontWeight: 900,
            letterSpacing: '1px',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {'>>'}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              width="16"
              height="16"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {'LIKES LIST'}
          </h2>

          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #fff',
              color: '#fff',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: '0.5px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#fff';
            }}
          >
            CLOSE [X]
          </button>
        </div>

        {/* 바디 */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: '30px',
          background: '#fff'
        }}>
          {stories.map((story: any) => (
            <div 
              key={story.id}
              onClick={() => onStoryClick(story)}
              style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                padding: '15px',
                marginBottom: '15px',
                border: '2px solid #000',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: '#fff',
                boxShadow: '4px 4px 0px #000'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = '6px 6px 0px #000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '4px 4px 0px #000';
              }}
            >
              <img 
                src={story.image} 
                alt={story.title}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  border: '2px solid #000'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  marginBottom: '6px',
                  color: '#000',
                  fontFamily: "'Share Tech Mono', monospace"
                }}>
                  {story.title}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontWeight: 600
                }}>
                  {story.destination} · {story.duration} · {parseInt(story.budget).toLocaleString()}원
                </div>
              </div>
            </div>
          ))}

          {stories.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999',
              fontSize: '13px',
              fontFamily: "'Share Tech Mono', monospace",
              fontWeight: 600
            }}>
              좋아요한 여행기가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LikesModal;