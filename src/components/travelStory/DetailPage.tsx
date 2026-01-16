import { useEffect, useState, useRef } from 'react';
import CommentSection from './CommentSection';

interface DetailPageProps {
  story: any;
  goBack: () => void;
  likedStories: number[];
  toggleLike: (id: number) => void;
  followedStories: number[];
  setFollowedStories: (ids: number[] | ((prev: number[]) => number[])) => void;
  incrementViews: (id: number) => void;
}

function DetailPage({
  story,
  goBack,
  likedStories,
  toggleLike,
  followedStories,
  setFollowedStories,
  incrementViews
}: DetailPageProps) {
  // 업로드한 이미지들만 사용 (커버 이미지 무시)
  const images = (story.images && story.images.length > 0) ? story.images : [story.image];
  const [likesCount, setLikesCount] = useState(story.likes);
  const [followCount, setFollowCount] = useState(story.follows);
  const [isLiked, setIsLiked] = useState(likedStories.includes(story.id));
  const [isFollowed, setIsFollowed] = useState(followedStories.includes(story.id));
  const hasIncrementedViews = useRef(false);

  // story가 변경되면 카운트 업데이트
  useEffect(() => {
    setLikesCount(story.likes);
    setFollowCount(story.follows);
    setIsLiked(likedStories.includes(story.id));
    setIsFollowed(followedStories.includes(story.id));
  }, [story.likes, story.follows, story.id, likedStories, followedStories]);

  // 조회수 증가 - DetailPage 마운트 시 1번만 (React Strict Mode 대응)
  useEffect(() => {
    if (!hasIncrementedViews.current) {
      hasIncrementedViews.current = true;
      incrementViews(story.id);
    }
  }, []);

  // 슬라이더 버튼 이벤트 리스너
  useEffect(() => {
    // DOM이 완전히 렌더링된 후 실행
    setTimeout(() => {
      const sliders = document.querySelectorAll('.image-slider-wrapper');
      
      sliders.forEach(slider => {
        const imagesContainer = slider.querySelector('.slider-images-container');
        const prevBtn = slider.querySelector('.slider-prev-btn');
        const nextBtn = slider.querySelector('.slider-next-btn');
        const indicator = slider.querySelector('.slider-indicator');
        
        if (!imagesContainer) return;
        
        const images = Array.from(imagesContainer.querySelectorAll('img'));
        if (images.length === 0) return;
        
        let currentIndex = 0;
        
        // 초기 상태: 첫 번째 이미지만 표시
        images.forEach((img, idx) => {
          const imgElement = img as HTMLElement;
          imgElement.style.position = 'absolute';
          imgElement.style.top = '0';
          imgElement.style.left = '0';
          imgElement.style.width = '100%';
          imgElement.style.height = '100%';
          imgElement.style.objectFit = 'cover';
          imgElement.style.display = idx === 0 ? 'block' : 'none';
        });
        
        // 이전 버튼
        if (prevBtn) {
          const handlePrev = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            images[currentIndex].style.display = 'none';
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            images[currentIndex].style.display = 'block';
            if (indicator) {
              indicator.textContent = `${currentIndex + 1}/${images.length}`;
            }
          };
          prevBtn.removeEventListener('click', handlePrev as EventListener);
          prevBtn.addEventListener('click', handlePrev as EventListener);
        }
        
        // 다음 버튼
        if (nextBtn) {
          const handleNext = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            images[currentIndex].style.display = 'none';
            currentIndex = (currentIndex + 1) % images.length;
            images[currentIndex].style.display = 'block';
            if (indicator) {
              indicator.textContent = `${currentIndex + 1}/${images.length}`;
            }
          };
          nextBtn.removeEventListener('click', handleNext as EventListener);
          nextBtn.addEventListener('click', handleNext as EventListener);
        }
      });
    }, 100);
  }, [story.content, story.description]);

  return (
    <div className="detail-page-container">
      <div className="detail-page-content">

        {/* ================= HEADER ================= */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '24px',
            borderBottom: '2px solid #000',
            marginBottom: '40px'
          }}
        >
          {/* 왼쪽 */}
          <div>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 700,
                marginBottom: '10px',
                fontFamily: "'Share Tech Mono', monospace"
              }}
            >
              {story.title}
            </h1>

            <div style={{ display: 'flex', gap: '10px' }}>
              {[story.destination, story.duration, `${parseInt(story.budget).toLocaleString()}원`].map(
                (item) => (
                  <div
                    key={item}
                    style={{
                      padding: '6px 14px',
                      border: '2px solid #000',
                      background: '#f5f5f5',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: "'Share Tech Mono', monospace"
                    }}
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>

          {/* 오른쪽 */}
          <div style={{ position: 'relative', marginTop: '32px' }}>
            <button
              onClick={goBack}
              style={{
                position: 'absolute',
                top: '-28px',
                right: '0',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                style={{ width: '28px', height: '28px', fill: '#000' }}
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: '#000' }} />
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontFamily: "'Share Tech Mono', monospace"
                  }}
                >
                  {story.author}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#999',
                    lineHeight: '1.4',
                    fontFamily: "'Share Tech Mono', monospace"
                  }}
                >
                  {story.date}<br />
                  {story.views} VIEWS
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ================= HEADER 끝 ================= */}

        {/* 본문 내용 (슬라이더 포함) */}

        {/* Description */}
        <div
          style={{
            fontSize: '15px',
            lineHeight: '1.8',
            marginBottom: '40px',
            fontFamily: "'Share Tech Mono', monospace"
          }}
          dangerouslySetInnerHTML={{ __html: story.description }}
        />

        {/* ================= 여행 경비 총정리 ================= */}
        <div
          style={{
            maxWidth: '700px',
            margin: '40px auto',
            border: '2px solid #000',
            padding: '20px',
            background: '#fff'
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '12px',
              fontFamily: "'Share Tech Mono', monospace"
            }}
          >
            여행 경비 총정리
          </h2>

          {[
            ['교통비 (렌터카)', '95,000원'],
            ['숙박비', '85,000원'],
            ['식비', '98,000원'],
            ['관광/입장료', '15,000원'],
            ['쇼핑/기타', '35,000원']
          ].map(([label, price]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid #ddd',
                fontSize: '14px',
                fontFamily: "'Share Tech Mono', monospace"
              }}
            >
              <span>{label}</span>
              <span style={{ fontWeight: 700 }}>{price}</span>
            </div>
          ))}

          <div
            style={{
              marginTop: '16px',
              background: '#000',
              color: '#fff',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'Share Tech Mono', monospace"
            }}
          >
            <span style={{ fontWeight: 700 }}>총 합계</span>
            <span style={{ fontWeight: 700 }}>328,000원</span>
          </div>
        </div>
        {/* ================= 여행 경비 총정리 끝 ================= */}

        {/* ================= 좋아요/팔로우 버튼 ================= */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '40px',
          marginBottom: '40px'
        }}>
          {/* 좋아요 버튼 */}
          <button
            onClick={() => {
              toggleLike(story.id);
            }}
            title="LIKES"
            style={{
              padding: '12px 24px',
              border: '3px solid #000',
              background: isLiked ? '#000' : '#fff',
              color: isLiked ? '#fff' : '#000',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: "'Share Tech Mono', monospace",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)'
            }}
            onMouseEnter={(e) => {
              if (!isLiked) {
                e.currentTarget.style.background = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLiked) {
                e.currentTarget.style.background = '#fff';
              }
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              style={{ 
                width: '20px', 
                height: '20px',
                fill: isLiked ? '#fff' : 'none',
                stroke: isLiked ? '#fff' : '#000',
                strokeWidth: '2',
                transition: 'all 0.2s'
              }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{likesCount}</span>
          </button>

          {/* 팔로우 버튼 */}
          <button
            onClick={() => {
              setFollowedStories((prev: number[]) =>
                prev.includes(story.id)
                  ? prev.filter((id: number) => id !== story.id)
                  : [...prev, story.id]
              );
            }}
            title="FOLLOW THIS"
            style={{
              padding: '12px 24px',
              border: '3px solid #000',
              background: isFollowed ? '#000' : '#fff',
              color: isFollowed ? '#fff' : '#000',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: "'Share Tech Mono', monospace",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)'
            }}
            onMouseEnter={(e) => {
              if (!isFollowed) {
                e.currentTarget.style.background = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) => {
              if (!isFollowed) {
                e.currentTarget.style.background = '#fff';
              }
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              style={{ 
                width: '20px', 
                height: '20px',
                fill: 'none',
                stroke: isFollowed ? '#fff' : '#000',
                strokeWidth: '3',
                transition: 'all 0.2s'
              }}
            >
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>{followCount}</span>
          </button>
        </div>
        {/* ================= 좋아요/팔로우 버튼 끝 ================= */}

        <CommentSection storyId={story.id} />

        <style>{`
          /* 본문 내 일반 이미지는 숨김 (슬라이더만 표시) */
          .detail-page-content > div + div img:not(.slider-images-container img) {
            display: none;
          }

          /* 슬라이더는 표시 */
          .image-slider-wrapper {
            display: block !important;
            position: relative;
            width: 693px;
            max-width: 100%;
            margin: 20px auto;
            background: #f5f5f5;
            border: 3px solid #000;
            box-shadow: 4px 4px 0px rgba(0, 0, 0, 1);
          }
          
          .slider-images-container {
            display: block !important;
            position: relative;
            width: 100%;
            height: 619px;
            overflow: hidden;
          }
          
          .slider-images-container img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .slider-prev-btn,
          .slider-next-btn {
            display: flex !important;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.5);
            color: #fff;
            border: 2px solid #fff;
            font-size: 28px;
            font-weight: 700;
            cursor: pointer;
            z-index: 10;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }
          
          /* 화살표 버튼은 무조건 표시 */
          .slider-prev-btn,
          .slider-next-btn {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          .slider-prev-btn {
            left: 12px;
          }
          
          .slider-next-btn {
            right: 12px;
          }
          
          .slider-prev-btn:hover,
          .slider-next-btn:hover {
            background: rgba(0, 0, 0, 0.8);
          }
          
          .slider-indicator {
            display: block !important;
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            padding: 4px 12px;
            border-radius: 12px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            z-index: 10;
          }

          /* 버튼들은 숨김 - COVER만 숨기고 화살표는 살리기 */
          [contenteditable="false"]:not(.image-slider-wrapper):not(.slider-images-container):not(.slider-prev-btn):not(.slider-next-btn):not(.slider-indicator) {
            display: none !important;
          }

          /* COVER 버튼만 숨김 (화살표는 살림) */
          .set-cover-btn,
          .cover-label,
          .cover-text,
          .editor-toolbar,
          .editor-menu,
          .editor-controls,
          .slider-button-container,
          .slider-delete-container {
            display: none !important;
            visibility: hidden !important;
          }

          /* 노란색 COVER 버튼만 숨김 */
          .image-slider-wrapper button[style*="yellow"],
          .image-slider-wrapper button[style*="#FFD93D"],
          .image-slider-wrapper > div:has(button[style*="yellow"]) {
            display: none !important;
          }

          div:has(> span:contains("COVER")),
          div:has(> span:contains("커버")) {
            display: none !important;
          }
        `}</style>
      </div>
    </div>
  );
}

export default DetailPage;