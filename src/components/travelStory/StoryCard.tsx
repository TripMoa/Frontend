import { useState, useEffect } from 'react';

interface Story {
  id: number;
  title: string;
  description: string;
  image: string;
  images?: string[];
  author: string;
  authorAvatar: string;
  destination: string;
  duration: string;
  budget: string;
  date: string;
  likes: number;
  comments: number;
  follows: number;
  views: string;
  tags: string[];
}

interface StoryCardProps {
  story: Story;
  onCardClick: (story: Story) => void;
  likedStories: number[];
  setLikedStories: (ids: number[] | ((prev: number[]) => number[])) => void;
  followedStories: number[];
  setFollowedStories: (ids: number[] | ((prev: number[]) => number[])) => void;
  onEdit?: (story: any) => void;
  onDelete?: (id: number) => void;
  isMyStory?: boolean;
}

function StoryCard({ 
  story, 
  onCardClick, 
  onEdit, 
  onDelete, 
  isMyStory 
}: StoryCardProps) {
  const images = story.images || [story.image];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [actualCommentsCount, setActualCommentsCount] = useState(0);

  // localStorage에서 실제 댓글 수 가져오기
  useEffect(() => {
    const updateCommentsCount = () => {
      const STORAGE_KEY = `comments_${story.id}`;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const comments = JSON.parse(saved);
          setActualCommentsCount(comments.length);
        } catch (e) {
          setActualCommentsCount(0);
        }
      } else {
        setActualCommentsCount(0);
      }
    };

    // 초기 로드
    updateCommentsCount();

    // window focus 시 업데이트 (DetailPage에서 돌아올 때)
    window.addEventListener('focus', updateCommentsCount);
    
    return () => {
      window.removeEventListener('focus', updateCommentsCount);
    };
  }, [story.id]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="story-card" style={{ position: 'relative' }}>
      {/* 이미지 영역 */}
      <div 
        onClick={() => onCardClick(story)}
        style={{ position: 'relative' }}
      >
        <img 
          className="story-image" 
          src={images[currentImageIndex]} 
          alt={story.title} 
        />
        
        {/* 이미지 슬라이드 컨트롤 */}
        {images.length > 1 && (
          <>
            {/* 왼쪽 화살표 */}
            <button
              onClick={handlePrevImage}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* 오른쪽 화살표 */}
            <button
              onClick={handleNextImage}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* 인디케이터 점 */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
              zIndex: 2
            }}>
              {images.map((_, index) => (
                <div
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: index === currentImageIndex 
                      ? '#fff' 
                      : 'rgba(255, 255, 255, 0.5)',
                    transition: 'all 0.3s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </>
        )}

        <div className="story-stats-badge">
          <span>{story.views}</span>
        </div>
      </div>
      
      <div className="story-content">
        <div onClick={() => onCardClick(story)}>
          <div className="story-header">
            <div className="author-avatar">{story.authorAvatar}</div>
            <div className="author-info">
              <div className="author-name">{story.author}</div>
            </div>
          </div>
          
          <div className="story-title">{story.title}</div>
          <div className="story-description">
            {story.description
              .replace(/<[^>]*>/g, '') // HTML 태그 제거
              .replace(/\d+\/\d+COVER/gi, '') // "1/5COVER" 같은 텍스트 제거
              .replace(/COVER/gi, '') // "COVER" 텍스트 제거
              .replace(/<>/g, '') // "<>" 제거
              .replace(/[<>]/g, '') // 남은 < > 제거
              .trim()}
          </div>
          
          <div className="story-tags">
            {story.tags.map((tag, index) => (
              <span key={index} className="story-tag">{tag}</span>
            ))}
          </div>

          <div className="story-stats-simple">
            <div className="stat-simple-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>LIKES</span>
            </div>
            <div className="stat-simple-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              <span>FOLLOW THIS</span>
            </div>
            <div className="stat-simple-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.3-3.86-.83l-.28-.15-2.86.49.49-2.86-.15-.28C4.3 14.68 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
              <span>{actualCommentsCount}</span>
            </div>
          </div>

          <div className="story-meta">
            <span>{story.date}</span>
          </div>
        </div>

        {isMyStory && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '15px',
            paddingTop: '15px',
            borderTop: '2px solid #f0f0f0'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(story);
              }}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: '2px solid #000',
                background: '#fff',
                color: '#000',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#000';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#000';
              }}
            >
              EDIT
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(story.id);
              }}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: '2px solid #dc3545',
                background: '#fff',
                color: '#dc3545',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#dc3545';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#dc3545';
              }}
            >
              DELETE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoryCard;