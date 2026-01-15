import { useEffect, useRef } from 'react';
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
  const hasIncrementedViews = useRef(false);

  useEffect(() => {
    if (!hasIncrementedViews.current) {
      incrementViews(story.id);
      hasIncrementedViews.current = true;
    }
  }, [story.id, incrementViews]);

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

        {/* Cover Image - 화살표/점 완전 제거 */}
        <div style={{ maxWidth: '700px', margin: '0 auto 40px auto' }}>
          <img
            src={story.image}
            alt={story.title}
            style={{ width: '100%', display: 'block' }}
          />
        </div>

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
            margin: '0 auto 40px auto',
            border: '2px solid #000',
            padding: '20px',
            background: '#f7f7f7'
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
                fontFamily: "'Share Tech Mono', monospace",
                background: '#f7f7f7'
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

        <CommentSection storyId={story.id} />

        <style>{`
          img {
            max-width: 566px;
            margin: 20px auto;
          }

          .detail-page-content > div + div img {
            display: none;
          }

          [contenteditable="false"] {
            display: none !important;
          }

          .set-cover-btn,
          .cover-label,
          .cover-text,
          .editor-toolbar,
          .editor-menu,
          .editor-controls {
            display: none !important;
          }

          div:has(> span:contains("COVER")),
          div:has(> span:contains("커버")),
          div:has(> span:contains("삭제")) {
            display: none !important;
          }
        `}</style>
      </div>
    </div>
  );
}

export default DetailPage;