import { useState, useMemo, useEffect } from 'react';
import '../styles/StoryCard.css';
import type { Story } from '../../../api/stories.api';
import { toggleLike as toggleLikeAPI, saveItinerary, unsaveItinerary } from '../../../api/stories.api';

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

// URL 비교용 - 경로만 추출
const toPath = (url: string) => {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
};

// 본문에서 커버 사진의 object-position 값 추출
const getCoverPosition = (description: string, coverUrl: string | null): string | null => {
  if (!description || !coverUrl || typeof DOMParser === "undefined") return null;
  try {
    const doc = new DOMParser().parseFromString(description, "text/html");
    const target = toPath(coverUrl);
    const imgs = Array.from(doc.querySelectorAll("img"));
    const match = imgs.find((img) => {
      const src = img.getAttribute("data-image-src") || img.getAttribute("src") || "";
      return src && toPath(src) === target;
    });
    return match?.style.objectPosition || null;
  } catch {
    return null;
  }
};

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

  // 좋아요 수
  const [likeCount, setLikeCount] = useState<number>(story.likes ?? 0);
  useEffect(() => { setLikeCount(story.likes ?? 0); }, [story.likes]);

  // 좋아요 토글 (서버 저장)
  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await toggleLikeAPI(story.id);
      const nowLiked = !!res.data;
      setLikedStories(prev =>
        nowLiked ? (prev.includes(story.id) ? prev : [...prev, story.id]) : prev.filter(id => id !== story.id)
      );
      setLikeCount(prev => Math.max(0, prev + (nowLiked ? 1 : -1)));
    } catch {
      alert("로그인 후 좋아요를 누를 수 있어요.");
    }
  };

  // 일정 저장 토글 (서버 저장)
  const toggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const isFollowed = followedStories.includes(story.id);
    try {
      if (isFollowed) {
        await unsaveItinerary(story.id);
        setFollowedStories(prev => prev.filter(id => id !== story.id));
      } else {
        await saveItinerary(story.id);
        setFollowedStories(prev => [...prev, story.id]);
      }
    } catch {
      alert("로그인 후 일정을 저장할 수 있어요.");
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
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${import.meta.env.VITE_API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // FREE 타입이고 이미지 없으면 그레이, 아니면 기존 unsplash 이미지
    const imageUrl = (() => {
      if (story.imageUrl && !story.imageUrl.includes('unsplash')) return story.imageUrl;
      const fromDesc = getImageFromDescription(story.description);
      if (fromDesc) return fromDesc;
      if (story.type === 'FREE') return null;
      return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';
    })();

  // 드래그로 맞춘 커버 위치를 카드에도 적용
  const coverPosition = useMemo(
    () => getCoverPosition(story.description, imageUrl),
    [story.description, imageUrl]
  );

  const typeLabelMap = {
  FREE: 'FREE',
  REVIEW: 'REVIEW',
};

return (  
  <div className="story-card" onClick={() => onCardClick(story)}>

    <div className="story-card-image-wrapper">
    {imageUrl ? (
      <img
        src={imageUrl}
        alt={story.title}
        className="story-card-image"
        style={coverPosition ? { objectPosition: coverPosition } : undefined}
      />
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
          <span className="story-card-author-name">
            {story.author?.name}
            {/* 여럿이 간 여행이면 "외 n명" */}
            {story.type === 'REVIEW' && (story.memberCount ?? 0) > 1 && ` 외 ${(story.memberCount as number) - 1}명`}
          </span>
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
              {/* 좋아요 수 */}
              <span>{likeCount}</span>
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
