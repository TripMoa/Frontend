import StoryCard from '../components/StoryCard';
import { useState } from 'react';
import '../styles/travelStory.css';
import '../styles/MyStoriesPage.css';


interface MyStoriesPageProps {
  goBack: () => void;
  navigateToPage: (page: string) => void;
  myStories: any[];
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


// 내 여행기 페이지 - 작성한 스토리 목록 및 통계(조회수, 좋아요, 저장 일정) 표시
function MyStoriesPage({
  goBack,
  navigateToPage,
  myStories,
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

  const [writeType, setWriteType] = useState<"FREE" | "REVIEW">("FREE");
  const stories = myStories;

  return (
    <div className="container">
      <div className="mystories-header">
        <button
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            goBack(); 
          }}
          className="mystories-close-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '24px', height: '24px', fill: '#000' }}>
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        <button
          onClick={() => {
            setWriteType("REVIEW");     // 타입 먼저 설정
            navigateToPage("write");    // 페이지 이동
          }}
        >
          후기 작성 테스트
        </button>

        {/* 통계 카드 - 작성한 여행기 수, 총 조회수, 받은 좋아요 수, 저장한 일정 수 */}
        <div className="mystories-stats-grid">
          <div className="mystories-stat-card">
            <div className="mystories-stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ fill: '#000' }}>
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
            </div>
            <div className="mystories-stat-value">{stories.length}</div>
            <div className="mystories-stat-label">작성한 여행기</div>
          </div>

          <div className="mystories-stat-card">
            <div className="mystories-stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ fill: '#000' }}>
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </div>
            {/* 전체 스토리 조회수 합산 */}
            <div className="mystories-stat-value">
              {stories.reduce((sum, story) => sum + parseInt(story.views || '0'), 0)}
            </div>
            <div className="mystories-stat-label">총 조회수</div>
          </div>

          <div className="mystories-stat-card">
            <div className="mystories-stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ fill: '#000' }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            {/* 전체 스토리 좋아요 수 합산 */}
            <div className="mystories-stat-value">
              {stories.reduce((sum, story) => sum + (story.likes || 0), 0)}
            </div>
            <div className="mystories-stat-label">받은 좋아요</div>
          </div>

          {/* 클릭 시 저장한 일정 모달 표시 */}
          <div 
            onClick={() => setShowLikesModal(true)}
            className="mystories-stat-card clickable"
          >
            <div className="mystories-stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ fill: 'none', stroke: '#000', strokeWidth: '2' }}>
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div className="mystories-stat-value">{followedStories.length}</div>
            <div className="mystories-stat-label">SAVED ITINERARIES</div>
          </div>
        </div>
      </div>

      {/* 내 스토리 카드 목록 - 수정/삭제 버튼 포함 */}
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

      {/* 작성한 스토리가 없을 때 안내 메시지 */}
      {stories.length === 0 && (
        <div className="ts-empty" style={{ marginTop: '80px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
          <div className="my-stories-empty-text">작성한 여행기가 없습니다.</div>
          <div className="my-stories-empty-sub">첫 여행기를 작성해보세요!</div>
        </div>
      )}
    </div>
  );
}

export default MyStoriesPage;