interface SavedItinerariesModalProps {
  show: boolean;
  onClose: () => void;
  stories: any[];
  onStoryClick: (story: any) => void;
}

function SavedItinerariesModal({ show, onClose, stories, onStoryClick }: SavedItinerariesModalProps) {
  if (!show) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
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
            {'>> SAVED ITINERARIES'}
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

        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', background: '#fff' }}>
          {stories.map((story: any) => (
            <div 
              key={story.id}
              style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                padding: '15px',
                marginBottom: '15px',
                border: '2px solid #000',
                background: '#fff',
                boxShadow: '4px 4px 0px #000',
                transition: 'all 0.2s'
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
                src={story.image || story.imageUrl} 
                alt={story.title}
                style={{ width: '80px', height: '80px', objectFit: 'cover', border: '2px solid #000' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px', fontWeight: 900, marginBottom: '6px',
                  color: '#000', fontFamily: "'Share Tech Mono', monospace"
                }}>
                  {story.title}
                </div>
                <div style={{
                  fontSize: '11px', color: '#666',
                  fontFamily: "'Share Tech Mono', monospace", fontWeight: 600
                }}>
                  {story.destination} · {story.duration} · {parseInt(story.budget || '0').toLocaleString()}원
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => onStoryClick(story)}
                  style={{
                    padding: '8px 14px',
                    border: '2px solid #000',
                    background: '#000',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: "'Share Tech Mono', monospace",
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#000'; }}
                >
                  여행기 보기
                </button>
                <button
                  onClick={() => alert('준비 중입니다.')}
                  style={{
                    padding: '8px 14px',
                    border: '2px solid #000',
                    background: '#fff',
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: "'Share Tech Mono', monospace",
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f0f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                >
                  USE THIS ITINERARY
                </button>
              </div>
            </div>
          ))}

          {stories.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 20px', color: '#999',
              fontSize: '13px', fontFamily: "'Share Tech Mono', monospace", fontWeight: 600
            }}>
              저장한 일정이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavedItinerariesModal;