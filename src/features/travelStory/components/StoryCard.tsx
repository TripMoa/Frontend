import { useState } from 'react';
import '../styles/StoryCard.css';
import type { Story } from '../../../api/stories.api';

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
  likedStories,
  setLikedStories,
  followedStories,
  setFollowedStories,
  onEdit,
  onDelete,
  isMyStory = false
}: StoryCardProps) {
  // 카드 클릭 이벤트가 버블링되지 않도록 막고 수정 핸들러 호출
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(story);
  };

  // 카드 클릭 이벤트가 버블링되지 않도록 막고 삭제 핸들러 호출
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(story.id);
  };

  // 좋아요 토글 (이미 좋아요한 경우 제거, 아닌 경우 추가)
  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedStories.includes(story.id)) {
      setLikedStories(prev => prev.filter(id => id !== story.id));
    } else {
      setLikedStories(prev => [...prev, story.id]);
    }
  };

  // 일정 저장 토글 (이미 저장한 경우 제거, 아닌 경우 추가)
  const toggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (followedStories.includes(story.id)) {
      setFollowedStories(prev => prev.filter(id => id !== story.id));
    } else {
      setFollowedStories(prev => [...prev, story.id]);
    }
  };

  // tags가 문자열이면 쉼표로 분리, 배열이면 그대로 사용
  const tags = Array.isArray(story.tags) ? story.tags : [];

  // description에서 이미지 URL 추출 (src 속성 또는 직접 URL 패턴 순으로 탐색)
  const getImageFromDescription = (desc: string) => {
    if (!desc) return null;
    
    // 1. src="..." 패턴
    let match = desc.match(/src=["']([^"']+)["']/);
    if (match) return match[1];
    
    // 2. src=... (따옴표 없음)
    match = desc.match(/src=([^\s>]+)/);
    if (match) return match[1];
    
    // 3. http로 시작하는 URL
    match = desc.match(/(https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp))/i);
    if (match) return match[1];
    
    return null;
  };

  // 상대경로 URL을 절대경로로 변환
  const normalizeImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // FREE 타입이고 이미지 없으면 그레이, 아니면 기존 unsplash 이미지
    const imageUrl = (() => {
      if (story.imageUrl && !story.imageUrl.includes('unsplash')) return story.imageUrl;
      const fromDesc = getImageFromDescription(story.description);
      if (fromDesc) return fromDesc;
      if (story.type === 'FREE') return null;
      return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';
    })();

  const typeLabelMap = {
  FREE: 'FREE',
  REVIEW: 'REVIEW',
};

return (  
  <div className="story-card" onClick={() => onCardClick(story)}>

    <div className="story-card-image-wrapper">
    {imageUrl ? (
      <img src={imageUrl} alt={story.title} className="story-card-image" />
    ) : (
      <div style={{
        width: '100%', height: '100%',
        background: '#888888',
      }} />
    )}

  {/* 아래 기존 코드들 그대로 유지 */}
  <div className="story-type-badge">
    {typeLabelMap[story.type] || 'OTHER'}
  </div>

  {/* PRIVATE 배지 추가 */}
  {isMyStory && story.isPublic === false && (
    <div className="story-private-badge">
      PRIVATE
    </div>
  )}
  
  <div className="story-card-views">
    {story.views || 0}
  </div>
</div>

      <div className="story-card-content">
        <div className="story-card-author">
          {(() => {
            const a = story.author as any;
            if (a?.profileType === 'CUSTOM' && a?.profileImage) {
              return (
                <img src={a.profileImage} alt={a.name}
                  className="story-card-avatar"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              );
            }
            if (a?.avatarEmoji) {
              return (
                <div className="story-card-avatar-placeholder"
                  style={{ background: a.avatarColor || '#e0e0e0', fontSize: '20px' }}>
                  {a.avatarEmoji}
                </div>
              );
            }
            return (
              <div className="story-card-avatar-placeholder">
                {a?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            );
          })()}
          <span className="story-card-author-name">{story.author?.name}</span>
        </div>

        <div className="story-card-divider"></div>

        <h3 className="story-card-title">{story.title}</h3>

        {/* HTML 태그, 특수문자, 불필요한 문자열 제거 후 100자로 truncate */}
        <p className="story-card-description">
          {story.description
            ?.replace(/<[^>]*>/g, '')
            .replace(/&[^;]+;/g, ' ')
            .replace(/[‹›]/g, '')       
            .replace(/\d+\/\d+/g, '')
            .replace(/cover/gi, '')
            .replace(/COVER/g, '')       
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 100) || '내용 없음'}...
        </p>

        {/* 최대 3개의 태그만 표시 */}
        {tags.length > 0 && (
          <div className="story-card-tags">
            {tags.slice(0, 3).map((tag: string, idx: number) => (
              <span key={idx} className="story-card-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="story-card-footer">
          <div className="story-card-stats">
            {/* 좋아요 버튼 */}
            <button 
              onClick={toggleLike}
              className={`story-card-stat-btn ${likedStories.includes(story.id) ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                      fill={likedStories.includes(story.id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"/>
              </svg>
              <span>LIKES</span>
            </button>

            {/* 일정 저장 버튼 */}
            {story.type === 'REVIEW' && (
              <button
                onClick={toggleFollow}
                className={`story-card-stat-btn ${followedStories.includes(story.id) ? 'active' : ''}`}
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                </svg>
                <span>USE THIS ITINERARY</span>
              </button>
            )}

            {/* 댓글 수 */}
            <button className="story-card-stat-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{story.comments || 0}</span>
            </button>
          </div>

          {/* 작성일 (ISO 형식을 YYYY.MM.DD로 변환) */}
          <span className="story-card-date">
            {story.createdAt ? new Date(story.createdAt).toISOString().split('T')[0].replace(/-/g, '.') : story.date}
          </span>
        </div>

        {/* 내 스토리일 때만 수정/삭제 버튼 표시 */}
        {isMyStory && (
          <div className="story-card-actions">
            <button onClick={handleEdit} className="story-card-action-btn edit">
              EDIT
            </button>
            <button onClick={handleDelete} className="story-card-action-btn delete">
              DELETE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoryCard;