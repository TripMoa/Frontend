
import { useState, useRef, useEffect } from 'react';
import FilterSection from '../components/FilterSection';
import StoryCard from '../components/StoryCard';
import WritePage from './WritePage';
import DetailPage from './DetailPage';
import MyStoriesPage from './MyStoriesPage';
import DraftModal from '../components/modals/DraftModal';
import SavedItinerariesModal from '../components/modals/SavedItinerariesModal';
import { useAccessGuard } from "../../../shared/hooks/useAccessGuard";
import { ActionPromptModal } from "../../../shared/components/ActionPromptModal";
import type { Story } from '../../../api/stories.api';
import CustomAlert from '../components/modals/CustomAlert';
import { User } from 'lucide-react';
import DeleteModal from '../components/modals/DeleteModal';
import { useLocation, useParams } from "react-router-dom";
import { useTravelStory } from '../hooks';
import '../styles/travelStory.css';

const SORT_OPTIONS = ['기본 순서', '예산 높은 순', '예산 낮은 순', '조회수 높은 순', '좋아요 많은 순'];

function EmptyState() {
  return (
    <div className="bg-white p-12 text-center emptyState" style={{ marginTop: '40px' }}>
      <User className="w-16 h-16 mx-auto mb-4 text-black/30" />
      <p className="text-black/60 text-lg font-bold uppercase">
        NO POSTS FOUND
      </p>
    </div>
  );
}

// 여행 스토리 기능 전체를 관리하는 루트 컴포넌트 (페이지 라우팅, 정렬, 페이지네이션 포함)
function TravelStory() {
  const hook = useTravelStory();

  const { storyId } = useParams();

  const location = useLocation();

  useEffect(() => {
  const path = window.location.pathname;
  
  // 마이플랜에서 리뷰 작성으로 온 경우
  if (location.state?.goToWrite) {
    hook.setWriteType(location.state.writeType || "REVIEW");
    hook.setPreviousPage("myPlan");
    if (location.state?.tripData) {
      (window as any).tripDataForReview = location.state.tripData;
    }
    setTimeout(() => {
      hook.setPreviousPage("myPlan");
      hook.navigateToPage("write");
    }, 0);
    return;
  }

  // URL 경로에 따라 페이지 설정
  if (path.includes("/write") && !storyId) {
    hook.navigateToPage("write");
  } else if (path.includes("/edit")) {
    hook.setCurrentPageState("write");
  } else if (path.includes("/mystories")) {
    hook.navigateToPage("myStories");
  } else if (path.includes("/detail")) {
    hook.navigateToPage("detail");
  }
}, []);


  const filteredStories = (hook.stories || []).filter((story) => {
  // 타입 필터
  if (hook.selectedType !== "ALL" && story.type !== hook.selectedType) return false;

  // 여행지 필터
  if (hook.filters.destination) {
    if (!story.destination?.includes(hook.filters.destination)) return false;
  }

  // 기간 필터
  if (hook.filters.duration && hook.filters.duration !== "전체") {
    if (story.duration !== hook.filters.duration) return false;
  }

  // 예산 필터
  if (hook.filters.minBudget && hook.filters.minBudget !== "전체") {
    const total = story.expenses?.total || 0;
    const budgetMap: Record<string, [number, number]> = {
      "10만원 이하":   [0, 100000],
      "10-30만원":     [100000, 300000],
      "30-50만원":     [300000, 500000],
      "50-100만원":    [500000, 1000000],
      "100만원 이상":  [1000000, Infinity],
    };
    const range = budgetMap[hook.filters.minBudget];
    if (range && (total < range[0] || total >= range[1])) return false;
  }

  // 태그 필터
  if (hook.filters.tags.length > 0) {
    // 태그 ID → 이름으로 변환 후 비교
    const storyTags = typeof story.tags === 'string'
      ? (story.tags as string).split(',').map((t: string) => t.trim())
      : (story.tags || []);
    const selectedTagNames = hook.filters.tags
      .map((id: number) => hook.tags.find((t: any) => t.id === id)?.name)
      .filter(Boolean);
    const hasTag = selectedTagNames.some((name: any) => storyTags.includes(name));
    if (!hasTag) return false;
  }

  return true;
});

  
  const [hoveredDraftId, setHoveredDraftId] = useState<number | null>(null);
  const [deleteHoverId, setDeleteHoverId] = useState<number | null>(null);
  const {
    requireLogin,
    showLoginModal,
    closeLoginModal,
    moveToLogin
  } = useAccessGuard();

  const handleMyStoriesClick = () => {
    if (!requireLogin()) return;
    hook.navigateToPage('myStories');
  };

  const handleWriteClick = () => {
    if (!requireLogin()) return;
    hook.setEditingStory(null);    
    hook.setCurrentDraft(null);    
    hook.setCurrentDraftId(null);
    hook.setWriteType("FREE");
    hook.navigateToPage('write');
  };
  
  const [sortBy, setSortBy] = useState('기본 순서');
  const [sortOpen, setSortOpen] = useState(false);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const sortRef = useRef<HTMLDivElement>(null);

  // 정렬 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 정렬 기준 또는 필터 변경 시 첫 페이지로 초기화
  useEffect(() => {
    setCurrentPageNum(1);
  }, [sortBy, hook.filters]);

  // 저장한 일정 모달에 표시할 스토리 목록 (followedStories ID 기준으로 필터링)
  const getLikedStoriesList = () => {
    return hook.allStories.filter(story => hook.followedStories.includes(story.id));
  };

  // 필터링된 스토리를 선택한 정렬 기준에 따라 정렬
  const getSortedStories = (data: Story[]) => {
    const filtered = data;
    
    switch (sortBy) {
      case '예산 높은 순':
        return [...filtered].sort((a: any, b: any) => {
          const budgetA = a.expenses?.total || parseInt(a.budget || '0');
          const budgetB = b.expenses?.total || parseInt(b.budget || '0');
          return budgetB - budgetA;
        });
      case '예산 낮은 순':
        return [...filtered].sort((a: any, b: any) => {
          const budgetA = a.expenses?.total || parseInt(a.budget || '0');
          const budgetB = b.expenses?.total || parseInt(b.budget || '0');
          return budgetA - budgetB;
        });
      case '조회수 높은 순':
        return [...filtered].sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
      case '좋아요 많은 순':
        return [...filtered].sort((a: any, b: any) => (b.likes || 0) - (a.likes || 0));
      default:
        return filtered;
    }
  };

  // 초기 데이터 로딩 중 스피너 표시
  if (hook.loading && hook.myStories.length === 0) {
    return (
      <div className="travel-story-app">
        <div className="ts-loading">
          <div className="ts-spinner" />
          <div>LOADING...</div>
        </div>
      </div>
    );
  }

  // 페이지네이션 계산 - 정렬된 스토리를 ITEMS_PER_PAGE 단위로 분할
  const sortedStories = getSortedStories(filteredStories);
  const totalPages = Math.ceil(sortedStories.length / ITEMS_PER_PAGE);
  const pagedStories = sortedStories.slice(
    (currentPageNum - 1) * ITEMS_PER_PAGE,
    currentPageNum * ITEMS_PER_PAGE
  );

  // API 오류 발생 시 에러 표시
  if (hook.error) {
    return (
      <div className="travel-story-app">
        <div className="ts-error">ERROR</div>
      </div>
    );
  }

 return (
   <> 
    <div className="travel-story-app">
      {/* ================= MAIN PAGE ================= */}
      {hook.currentPage === 'main' && (
        <div className="container">

          {/* 상단 헤더 - MY STORIES 및 WRITE 페이지 이동 버튼 포함 */}
          <div className="ts-header">
            <div className="ts-title">
              <h1>VERIFIED DATA</h1>
              <p>검증된 여행 작전 로그를 확인하십시오.</p>
            </div>

            <div className="ts-actions">
              <button
                className="ts-btn outline"
                onClick={handleMyStoriesClick}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" fill="currentColor"/>
                </svg>
                MY STORIES
              </button>

              <button className="ts-btn solid" onClick={handleWriteClick}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                WRITE
              </button>
            </div>
          </div>

           <div className="type-filter">
                <button
                  onClick={() => hook.setSelectedType("ALL")}
                  className={hook.selectedType === "ALL" ? "active" : ""}
                >
                  ALL
                </button>

                <button
                  onClick={() => {
                    hook.setSelectedType("FREE");
                  }}
                  className={hook.selectedType === "FREE" ? "active" : ""}
                >
                  FREE
                </button>

                <button
                  onClick={() => hook.setSelectedType("REVIEW")}
                  className={hook.selectedType === "REVIEW" ? "active" : ""}
                >
                  REVIEW
                </button>
              </div>

          {/* 여행지, 기간, 예산, 태그 필터 */}
          <FilterSection
            filters={hook.filters}
            setFilters={hook.setFilters}
            selectedType={hook.selectedType}        
            setSelectedType={hook.setSelectedType}
            tags={hook.tags}
          />

          {/* 정렬 드롭다운 및 검색 결과 수 표시 */}
          <div className="ts-sort-bar">
            <div className="ts-sort-left" ref={sortRef}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 3l0 18M7 3l-3 3M7 3l3 3"/>
                <path d="M17 21l0 -18M17 21l-3 -3M17 21l3 -3"/>
              </svg>

              <span className="ts-sort-label">SORT BY:</span>

              <div className="ts-sort-wrapper">
                <button
                  className={`ts-sort-trigger ${sortOpen ? 'open' : ''}`}
                  onClick={() => setSortOpen(!sortOpen)}
                >
                  <span>{sortBy}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    style={{ transform: sortOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {sortOpen && (
                  <div className="ts-sort-dropdown">
                    <div className="ts-sort-dropdown-label">정렬 기준</div>
                    {SORT_OPTIONS.map((opt) => (
                      <div
                        key={opt}
                        className={`ts-sort-option ${sortBy === opt ? 'selected' : ''}`}
                        onClick={() => {
                          setSortBy(opt);
                          setSortOpen(false);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <span className="ts-post-count">{sortedStories.length} posts found</span>
          </div>

          {/* 스토리 목록 - 전체 없음 / 검색 결과 없음 / 카드 그리드 분기 */}
          {hook.allStories.length === 0 ? (
            <EmptyState />
          ) : sortedStories.length === 0 ? (
            <EmptyState />
          ) : (
            <>
           

              <div className="posts-grid">
                {pagedStories.map((story: Story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onCardClick={hook.handleStoryClick}
                    likedStories={hook.likedStories}
                    setLikedStories={hook.setLikedStories}
                    followedStories={hook.followedStories}
                    setFollowedStories={hook.setFollowedStories}
                  />
                ))}
              </div>

              {/* 페이지네이션 - 총 페이지가 2 이상일 때만 표시 */}
              {totalPages > 1 && (
                <div className="ts-pagination">
                  <button
                    className="ts-page-btn"
                    onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
                    disabled={currentPageNum === 1}
                  >
                    {'<'}
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`ts-page-btn ${currentPageNum === page ? 'active' : ''}`}
                      onClick={() => setCurrentPageNum(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="ts-page-btn"
                    onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
                    disabled={currentPageNum === totalPages}
                  >
                    {'>'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ================= DETAIL ================= */}
      {hook.currentPage === 'detail' && hook.selectedStory && (
        <DetailPage
          story={hook.selectedStory}
          goBack={hook.goBack}
          likedStories={hook.likedStories}
          toggleLike={hook.toggleLike}
          followedStories={hook.followedStories}
          toggleFollow={hook.toggleFollow}
          setFollowedStories={hook.setFollowedStories}
          incrementViews={hook.incrementViews}
          currentUserId={hook.currentUser?.id} 
          onEdit={hook.handleEdit}              
          onDelete={hook.handleDelete}
        />
      )}


      {/* ================= WRITE ================= */}
      {hook.currentPage === 'write' && (
        // key를 editingStory ID로 지정해 수정/신규 전환 시 컴포넌트 완전 초기화
        <WritePage
          key={hook.editingStory?.id || 'new'}
          type={hook.writeType}
          goBack={hook.goBack}
          onPublish={hook.handlePublish}
          onSaveDraft={hook.handleSaveDraft}
          onOpenDraftModal={() => hook.setShowDraftModal(true)}
          editingStory={hook.editingStory}
          currentDraft={hook.currentDraft}
          drafts={hook.drafts}
        />
      )}

      {/* ================= MY STORIES ================= */}
      {hook.currentPage === 'myStories' && (
        <MyStoriesPage
          goBack={hook.goBack}
          navigateToPage={hook.navigateToPage}
          myStories={hook.myStories}
          handleStoryClick={hook.handleStoryClick}
          handleEdit={hook.handleEdit}
          handleDelete={hook.handleDelete}
          likedStories={hook.likedStories}
          setLikedStories={hook.setLikedStories}
          followedStories={hook.followedStories}
          setFollowedStories={hook.setFollowedStories}
          setShowLikesModal={hook.setShowLikesModal}
          setWriteType={hook.setWriteType}
        />
      )}


      {/* MODALS */}
      {/* 임시저장 목록 모달 */}
      <DraftModal
        show={hook.showDraftModal}
        drafts={hook.drafts}
        onClose={() => hook.setShowDraftModal(false)}
        onSelectDraft={(draft) => {
          hook.setCurrentDraft(draft);
          hook.setCurrentDraftId(draft.id);
          hook.setShowDraftModal(false);
          hook.setWriteType("FREE"); 
          hook.navigateToPage('write');
        }}
        onDeleteDraft={hook.deleteDraft}
        hoveredDraftId={hoveredDraftId}
        setHoveredDraftId={setHoveredDraftId}
        deleteHoverId={deleteHoverId}
        setDeleteHoverId={setDeleteHoverId}
      />

      {/* 저장한 일정 목록 모달 */}
      <SavedItinerariesModal
        show={hook.showLikesModal}
        onClose={() => hook.setShowLikesModal(false)}
        stories={getLikedStoriesList()}
        onStoryClick={(story) => {
          hook.setShowLikesModal(false);
          hook.handleStoryClick(story);
        }}
      />

      {/* 커스텀 알럿 모달 */}
      <CustomAlert
        show={hook.showAlert}
        message={hook.alertMessage}
        onClose={hook.closeAlert}
      />

      {/* 스토리 삭제 확인 모달 */}
      <DeleteModal             
        show={hook.showDeleteModal}
        onClose={() => hook.setShowDeleteModal(false)}
        onConfirm={hook.confirmDelete}
      />
    </div>

       <ActionPromptModal
      open={showLoginModal}
      title="LOGIN REQUIRED"
      headline="MEMBERS ONLY"
      description="이 기능은 로그인 후 이용할 수 있습니다"
      cancelText="취소"
      confirmText="로그인"
      onClose={closeLoginModal}
      onConfirm={moveToLogin}
    />
  </>
);
}

export default TravelStory;