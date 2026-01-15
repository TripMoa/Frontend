import StoryCard from './StoryCard';

interface MyStoriesPageProps {
  goBack: () => void;
  navigateToPage: (page: string) => void;
  getFilteredStories: () => any[];
  handleStoryClick: (story: any) => void;
  handleEdit: (story: any) => void;
  handleDelete: (id: number) => void;
  likedStories: number[];
  setLikedStories: (ids: number[] | ((prev: number[]) => number[])) => void;
  followedStories: number[];
  setFollowedStories: (ids: number[] | ((prev: number[]) => number[])) => void;
  setShowLikesModal: (show: boolean) => void;
}

function MyStoriesPage({
  goBack,
  navigateToPage,
  getFilteredStories,
  handleStoryClick,
  handleEdit,
  handleDelete,
  likedStories,
  setLikedStories,
  followedStories,
  setFollowedStories,
  setShowLikesModal
}: MyStoriesPageProps) {
  const stories = getFilteredStories();

  return (
    <div className="container">
      {/* Header with Close Button */}
      <div style={{
        position: 'relative',
        marginBottom: '30px',
        padding: '20px',
        background: '#fff',
        border: '3px solid #000',
        boxShadow: '8px 8px 0px rgba(0, 0, 0, 1)',
        zIndex: 1
      }}>
        <button
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            goBack(); 
          }}
          style={{
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            width: '40px',
            height: '40px',
            border: '2px solid #000',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto',
            borderRadius: '50%',
            boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
            zIndex: 99999,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#000';
            const svg = e.currentTarget.querySelector('svg');
            if (svg) (svg as SVGElement).style.fill = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            const svg = e.currentTarget.querySelector('svg');
            if (svg) (svg as SVGElement).style.fill = '#000';
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            style={{ width: '24px', height: '24px', fill: '#000', transition: 'fill 0.2s' }}
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        {/* 통계 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '0 20px'
        }}>
          {/* 작성한 여행기 */}
          <div style={{
            padding: '12px 15px',
            border: '2px solid #000',
            background: '#fff',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: '#000' }}>
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', fontFamily: "'Share Tech Mono', monospace" }}>
              {stories.length}
            </div>
            <div style={{ fontSize: '10px', color: '#666', fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              작성한 여행기
            </div>
          </div>

          {/* 총 조회수 */}
          <div style={{
            padding: '12px 15px',
            border: '2px solid #000',
            background: '#fff',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: '#000' }}>
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', fontFamily: "'Share Tech Mono', monospace" }}>
              {stories.reduce((sum, story) => sum + parseInt(story.views || '0'), 0)}
            </div>
            <div style={{ fontSize: '10px', color: '#666', fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              총 조회수
            </div>
          </div>

          {/* 받은 좋아요 */}
          <div style={{
            padding: '12px 15px',
            border: '2px solid #000',
            background: '#fff',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: '#ff4757' }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', fontFamily: "'Share Tech Mono', monospace" }}>
              {stories.reduce((sum, story) => sum + (story.likes || 0), 0)}
            </div>
            <div style={{ fontSize: '10px', color: '#666', fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              받은 좋아요
            </div>
          </div>

          {/* 좋아요 목록 */}
          <div 
            onClick={() => setShowLikesModal(true)}
            style={{
              padding: '12px 15px',
              border: '2px solid #000',
              background: '#fff',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: '#000', strokeWidth: '2' }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', fontFamily: "'Share Tech Mono', monospace" }}>
              {likedStories.length}
            </div>
            <div style={{ fontSize: '10px', color: '#666', fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              좋아요 목록
            </div>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="posts-grid">
        {stories.map((story: any) => (
          <StoryCard 
            key={story.id}
            story={story}
            onCardClick={handleStoryClick}
            likedStories={likedStories}
            setLikedStories={setLikedStories}
            followedStories={followedStories}
            setFollowedStories={setFollowedStories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isMyStory={true}
          />
        ))}
      </div>

      {stories.length === 0 && (
        <div className="no-results-fullpage">
          <div className="no-results-text">작성한 여행기가 없습니다.</div>
          <div className="no-results-subtext">첫 여행기를 작성해보세요!</div>
        </div>
      )}
    </div>
  );
}

export default MyStoriesPage;