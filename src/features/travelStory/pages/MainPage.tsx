import '../styles/travelStory.css';
import '../styles/MainPage.css';
import StoryCard from '../components/StoryCard';
import FilterSection from '../components/FilterSection';

interface MainPageProps {
  stories: any[];
  likedStories: number[];
  setLikedStories: (ids: number[] | ((prev: number[]) => number[])) => void;
  followedStories: number[];
  setFollowedStories: (ids: number[] | ((prev: number[]) => number[])) => void;
  onStoryClick: (story: any) => void;
  navigateToPage: (page: string) => void;
  filters: {
    destination: string;
    duration: string;
    minBudget: string;
    maxBudget: string;
    tags: string[];
  };
  setFilters: (filters: any) => void;
}

// 메인 페이지 - 헤더 / 필터 / 스토리 카드 목록 렌더링
function MainPage({
  stories,
  likedStories,
  setLikedStories,
  followedStories,
  setFollowedStories,
  onStoryClick,
  navigateToPage,
  filters,
  setFilters
}: MainPageProps) {
  return (
    <div className="travel-story-app container">

      {/* 상단 헤더 - 페이지 제목 + MY STORIES / WRITE 버튼 */}
      <div className="main-header">
        <div className="main-header-left">
          <h1 className="main-header-title">VERIFIED DATA</h1>
          <p className="main-header-subtitle">검증된 여행 작자 로그를 확인하십시오.</p>
        </div>

        <div className="main-header-actions">
          {/* 내 스토리 페이지 이동 버튼 */}
          <button
            onClick={() => navigateToPage('myStories')}
            className="main-action-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            MY STORIES
          </button>

          {/* 글쓰기 페이지 이동 버튼 */}
          <button
            onClick={() => navigateToPage('write')}
            className="main-action-btn primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            WRITE
          </button>
        </div>
      </div>

      {/* 필터 섹션 - 목적지 / 기간 / 예산 / 태그 */}
      <FilterSection filters={filters} setFilters={setFilters} />

      {/* 스토리 카드 목록 */}
      <div className="posts-grid">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            onCardClick={onStoryClick}
            likedStories={likedStories}
            setLikedStories={setLikedStories}
            followedStories={followedStories}
            setFollowedStories={setFollowedStories}
          />
        ))}
      </div>

      {/* 스토리 없을 때 빈 상태 안내 */}
      {stories.length === 0 && (
        <div className="main-empty">
          <div className="main-empty-text">여행기가 없습니다.</div>
          <div className="main-empty-subtext">첫 번째 여행기를 작성해보세요!</div>
        </div>
      )}
    </div>
  );
}

export default MainPage;