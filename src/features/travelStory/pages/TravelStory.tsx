import { useState } from 'react';
import FilterSection from '../components/FilterSection';
import StoryCard from '../components/StoryCard';
import WritePage from './WritePage';
import DetailPage from './DetailPage';
import MyStoriesPage from './MyStoriesPage';
import DraftModal from '../components/modals/DraftModal';
import LikesModal from '../components/modals/LikesModal';
import CustomAlert from '../components/modals/CustomAlert';
import DeleteModal from '../components/modals/DeleteModal';
import { useTravelStory } from '../hooks';
import '../styles/travelStory.css';

function TravelStory() {
  const hook = useTravelStory();

  const [hoveredDraftId, setHoveredDraftId] = useState<number | null>(null);
  const [deleteHoverId, setDeleteHoverId] = useState<number | null>(null);

  // LikesModal을 위한 좋아요한 스토리 필터링
  const getLikedStoriesList = () => {
    return hook.myStories.filter(story => hook.likedStories.includes(story.id));
  };

  return (
    <>
      {/* Main Page */}
      {hook.currentPage === 'main' && (
        <div className="container">
          {/* 헤더 섹션 */}
          <div style={{
            background: '#fff',
            padding: '24px 40px',
            marginBottom: '24px',
            border: '3px solid #000',
            boxShadow: '8px 8px 0px rgba(0, 0, 0, 1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '28px',
                fontWeight: 900,
                letterSpacing: '2px',
                marginBottom: '4px',
                margin: 0
              }}>
                VERIFIED DATA
              </h1>
              <p style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '12px',
                color: '#666',
                fontWeight: 600,
                margin: 0
              }}>
                검증된 여행 작진 로그를 확인하십시오.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => hook.navigateToPage('myStories')}
                style={{
                  background: '#fff',
                  border: '3px solid #000',
                  padding: '10px 20px',
                  fontSize: '12px',
                  fontWeight: 900,
                  fontFamily: "'Share Tech Mono', monospace",
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0, 0, 0, 1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 1)';
                }}
              >
                MY STORIES
              </button>
              <button
                onClick={() => hook.navigateToPage('write')}
                style={{
                  background: '#000',
                  color: '#fff',
                  border: '3px solid #000',
                  padding: '10px 20px',
                  fontSize: '12px',
                  fontWeight: 900,
                  fontFamily: "'Share Tech Mono', monospace",
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#000';
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0, 0, 0, 1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#000';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 1)';
                }}
              >
                WRITE
              </button>
            </div>
          </div>

          <FilterSection 
            filters={hook.filters}
            setFilters={hook.setFilters}
          />
          <div className="card-grid">
            {hook.getFilteredStories().map((story) => (
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
        </div>
      )}

      {/* Detail Page */}
      {hook.currentPage === 'detail' && hook.selectedStory && (
        <DetailPage
          story={hook.selectedStory}
          goBack={hook.goBack}
          likedStories={hook.likedStories}
          toggleLike={hook.toggleLike}
          followedStories={hook.followedStories}
          setFollowedStories={hook.setFollowedStories}
          incrementViews={hook.incrementViews}
        />
      )}

      {/* Write Page */}
      {hook.currentPage === 'write' && (
        <WritePage
          goBack={hook.goBack}
          onPublish={hook.handlePublish}
          onSaveDraft={hook.handleSaveDraft}
          onOpenDraftModal={() => hook.setShowDraftModal(true)}
          editingStory={hook.editingStory}
          currentDraft={hook.currentDraft}
          drafts={hook.drafts}
        />
      )}

      {/* My Stories Page */}
      {hook.currentPage === 'myStories' && (
        <MyStoriesPage
          goBack={hook.goBack}
          navigateToPage={hook.navigateToPage}
          getFilteredStories={hook.getFilteredStories}
          handleStoryClick={hook.handleStoryClick}
          handleEdit={hook.handleEdit}
          handleDelete={hook.handleDelete}
          likedStories={hook.likedStories}
          setLikedStories={hook.setLikedStories}
          followedStories={hook.followedStories}
          setFollowedStories={hook.setFollowedStories}
          setShowLikesModal={hook.setShowLikesModal}
        />
      )}

      {/* Draft Modal */}
      {hook.showDraftModal && (
        <DraftModal
          show={hook.showDraftModal}
          drafts={hook.drafts}
          onClose={() => hook.setShowDraftModal(false)}
          onSelectDraft={(draft) => {
            hook.setCurrentDraft(draft);
            hook.setCurrentDraftId(draft.id);
            hook.setShowDraftModal(false);
          }}
          onDeleteDraft={(id) => {
            hook.setDrafts(hook.drafts.filter(d => d.id !== id));
          }}
          hoveredDraftId={hoveredDraftId}
          setHoveredDraftId={setHoveredDraftId}
          deleteHoverId={deleteHoverId}
          setDeleteHoverId={setDeleteHoverId}
        />
      )}

      {/* Likes Modal */}
      {hook.showLikesModal && (
        <LikesModal
          show={hook.showLikesModal}
          onClose={() => hook.setShowLikesModal(false)}
          stories={getLikedStoriesList()}
          onStoryClick={(story) => {
            hook.handleStoryClick(story);
            hook.setShowLikesModal(false);
          }}
        />
      )}

      {/* Custom Alert */}
      {hook.showAlert && (
        <CustomAlert 
          show={hook.showAlert}
          message={hook.alertMessage}
          onClose={hook.closeAlert}
        />
      )}

      {/* Delete Modal */}
      {hook.showDeleteModal && (
        <DeleteModal
          show={hook.showDeleteModal}
          onClose={() => hook.setShowDeleteModal(false)}
          onConfirm={hook.confirmDelete}
          title="여행기 삭제"
          message="여행기를 삭제하시겠습니까?\n삭제된 여행기는 복구할 수 없습니다."
        />
      )}
    </>
  );
}

export default TravelStory;