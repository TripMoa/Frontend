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
  const rawTags = story.tags as unknown as string | string[] | null | undefined;
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string'
      ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

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

  // 카드 위 글 종류 표시 (디자인 기준: 리뷰 = 검정 태그, 자유글 = 회색 태그)
  const typeLabelMap: Record<string, string> = {
    FREE: '자유글',
    REVIEW: '리뷰',
  };

  // 본문 HTML에서 태그·특수문자·슬라이더 글자를 지우고 100자로 자름
  const plainDescription = story.description
    ?.replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, ' ')
    .replace(/[‹›]/g, '')
    .replace(/\d+\/\d+/g, '')
    .replace(/cover/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);

  const isLiked = likedStories.includes(story.id);
  const isFollowed = followedStories.includes(story.id);

  // 작성일 (ISO 형식을 YYYY.MM.DD로 변환)
  const displayDate = story.createdAt
    ? new Date(story.createdAt).toISOString().split('T')[0].replace(/-/g, '.')
    : story.date;

  return (
    // = tm-polaroid + tm-tape (디자인 기준 story.html 과 같은 구성)
    <article className="tm-polaroid story-card" onClick={() => onCardClick(story)}>
      <span className="tm-tape" />

      {/* 사진 칸: 사진이 없으면 회색 칸만 보임 */}
      <div className="tm-polaroid__cover story-card-cover">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={story.title}
            style={coverPosition ? { objectPosition: coverPosition } : undefined}
          />
        )}
        <span className={`tm-tag ${story.type === 'REVIEW' ? 'tm-tag--dark' : ''}`}>
          {typeLabelMap[story.type] || 'OTHER'}
        </span>
        {/* 내 글이 비공개일 때만 */}
        {isMyStory && story.isPublic === false && (
          <span className="tm-badge tm-badge--yellow story-card-private">PRIVATE</span>
        )}
        <span className="story-card-views">{story.views || 0}</span>
      </div>

      {/* 작성자 (여럿이 간 여행이면 "외 n명") */}
      <div className="story-card-author">
        {story.author?.name}
        {story.type === 'REVIEW' && (story.memberCount ?? 0) > 1 && ` 외 ${(story.memberCount as number) - 1}명`}
      </div>

      <h3 className="tm-polaroid__title">{story.title}</h3>
      <p className="tm-polaroid__desc">{plainDescription || '내용 없음'}</p>

      {/* 태그는 최대 3개 */}
      {tags.length > 0 && (
        <div className="tm-polaroid__tags">
          {tags.slice(0, 3).map((tag: string, idx: number) => (
            <span key={idx} className="tm-tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="tm-polaroid__foot story-card-foot">
        <button
          type="button"
          onClick={toggleLike}
          className={`story-card-like ${isLiked ? 'is-on' : ''}`}
          aria-pressed={isLiked}
        >
          {isLiked ? '♥' : '♡'} LIKES {likeCount}
        </button>
        <span>댓글 {story.comments || 0}</span>
        <span className="tm-grow" />
        <span className="story-card-date">{displayDate}</span>
      </div>

      {/* 버튼 줄: 일정 가져오기(리뷰만) + 내 글이면 수정·삭제 */}
      {(story.type === 'REVIEW' || isMyStory) && (
        <div className="tm-row tm-row--wrap story-card-buttons">
          {story.type === 'REVIEW' && (
            <button
              type="button"
              onClick={toggleFollow}
              className={`tm-btn tm-btn--sm ${isFollowed ? 'tm-btn--dark' : 'tm-btn--primary'}`}
              aria-pressed={isFollowed}
            >
              {isFollowed ? 'SAVED ✓' : 'USE THIS ITINERARY'}
            </button>
          )}
          {isMyStory && (
            <>
              <button type="button" onClick={handleEdit} className="tm-btn tm-btn--sm">
                수정
              </button>
              <button type="button" onClick={handleDelete} className="tm-btn tm-btn--sm tm-btn--danger">
                삭제
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

export default StoryCard;
