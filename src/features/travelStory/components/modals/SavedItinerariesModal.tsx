interface SavedItinerariesModalProps {
  show: boolean;
  onClose: () => void;
  stories: any[];
  onStoryClick: (story: any) => void;
  onUseItinerary?: (story: any) => void;
}

// 저장한 일정 모달
function SavedItinerariesModal({ show, onClose, stories, onStoryClick, onUseItinerary }: SavedItinerariesModalProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'var(--tm-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--tm-paper)',
          border: 'var(--tm-bd-thin)',
          boxShadow: 'var(--tm-shadow-float)',
          width: 'min(700px, 100%)',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--tm-font)',
          color: 'var(--tm-ink)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          background: 'var(--tm-paper)',
          color: 'var(--tm-ink)',
          padding: '14px 20px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--tm-gap-2)'
        }}>
          <h2 style={{
            fontFamily: 'var(--tm-font)',
            fontSize: '20px',
            fontWeight: 900,
            lineHeight: 1.3,
            letterSpacing: '-.03em',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {'>> SAVED ITINERARIES'}
          </h2>

          {/* 닫기 */}
          <button
            onClick={onClose}
            style={{
              background: 'var(--tm-paper)',
              border: 'var(--tm-bd-thin)',
              color: 'var(--tm-ink)',
              height: 'var(--tm-h-btn-sm)',
              padding: '0 12px',
              fontSize: 'var(--tm-fs-sm)',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'var(--tm-font)',
              transition: 'background .12s, color .12s'
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
            CLOSE [X]
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 16px', background: 'var(--tm-paper)' }}>
          {/* 목록 */}
          <div style={{ borderTop: stories.length > 0 ? 'var(--tm-bd-soft)' : 'none' }}>
            {stories.map((story: any) => (
              <div
                key={story.id}
                style={{
                  display: 'flex',
                  gap: 'var(--tm-gap-3)',
                  alignItems: 'center',
                  padding: '12px 4px',
                  borderBottom: 'var(--tm-bd-soft)',
                  background: 'var(--tm-paper)',
                  transition: 'background .12s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--tm-yellow-soft)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--tm-paper)';
                }}
              >
                <img
                  src={story.image || story.imageUrl}
                  alt={story.title}
                  style={{
                    width: '72px',
                    height: '72px',
                    flexShrink: 0,
                    objectFit: 'cover',
                    border: 'var(--tm-bd-thin)',
                    background: 'var(--tm-soft)'
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--tm-fs-md)', fontWeight: 800, lineHeight: 1.4, marginBottom: '2px',
                    color: 'var(--tm-ink)', fontFamily: 'var(--tm-font)'
                  }}>
                    {story.title}
                  </div>
                  <div style={{
                    fontSize: 'var(--tm-fs-sm)', color: 'var(--tm-mute)',
                    fontFamily: 'var(--tm-font)', fontWeight: 600, lineHeight: 1.5,
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {story.destination} · {story.duration} · {parseInt(story.budget || '0').toLocaleString()}원
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* 여행기 보기 */}
                  <button
                    onClick={() => onStoryClick(story)}
                    style={{
                      height: 'var(--tm-h-btn-sm)',
                      padding: '0 12px',
                      border: 'var(--tm-bd-thin)',
                      background: 'var(--tm-paper)',
                      color: 'var(--tm-ink)',
                      fontSize: 'var(--tm-fs-sm)',
                      fontWeight: 800,
                      fontFamily: 'var(--tm-font)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background .12s, color .12s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--tm-ink)'; e.currentTarget.style.color = 'var(--tm-paper)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--tm-paper)'; e.currentTarget.style.color = 'var(--tm-ink)'; }}
                  >
                    여행기 보기
                  </button>
                  {/* USE THIS ITINERARY */}
                  <button
                    onClick={() => onUseItinerary?.(story)}
                    style={{
                      height: 'var(--tm-h-btn-sm)',
                      padding: '0 12px',
                      border: '1.5px solid var(--tm-red)',
                      background: 'var(--tm-red)',
                      color: 'var(--tm-paper)',
                      fontSize: 'var(--tm-fs-sm)',
                      fontWeight: 800,
                      fontFamily: 'var(--tm-font)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background .12s, border-color .12s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--tm-ink)'; e.currentTarget.style.border = '1.5px solid var(--tm-ink)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--tm-red)'; e.currentTarget.style.border = '1.5px solid var(--tm-red)'; }}
                  >
                    USE THIS ITINERARY
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 빈 화면 */}
          {stories.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '46px 20px', color: '#777',
              fontSize: 'var(--tm-fs-md)', fontFamily: 'var(--tm-font)', fontWeight: 700, lineHeight: 1.6
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
