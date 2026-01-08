import FilterSection from '../components/travelStory/FilterSection';
import StoryCard from '../components/travelStory/StoryCard';
import WritePage from "../components/travelStory/WritePage";
import CommentSection from "../components/travelStory/CommentSection";
import useTravelStory from '../hooks/useTravelStory';
import '../styles/travelStory/travelStory.css';

interface Story {
  id: number;
  title: string;
  description: string;
  image: string;
  author: string;
  authorAvatar: string;
  destination: string;
  duration: string;
  budget: string;
  departureDate?: string;
  date: string;
  likes: number;
  comments: number;
  bookmarks: number;
  follows: number;
  views: string;
  tags: string[];
}

function TravelStory() {
  const {
    currentPage,
    setCurrentPage,
    navigateToPage,
    goBack,
    previousPage,
    selectedStory,
    setSelectedStory,
    filters,
    setFilters,
    bookmarkedIds,
    setBookmarkedIds,
    likedStories,
    setLikedStories,
    followedStories,
    setFollowedStories,
    showAlert,
    alertMessage,
    showCustomAlert,
    openDropdown,
    setOpenDropdown,
    showDraftModal,
    setShowDraftModal,
    showLikesModal,
    setShowLikesModal,
    drafts,
    setDrafts,
    editingStory,
    setEditingStory,
    showDeleteModal,
    setShowDeleteModal,
    currentDraft,
    setCurrentDraft,
    getFilteredStories,
    handleStoryClick,
    handleEdit,
    handleDelete,
    confirmDelete,
    handlePublish,
    handleSaveDraft,
    handleShare
  } = useTravelStory();

  return (
    <>
      {/* Main Page */}
      {currentPage === 'main' && (
        <div className="container">
          {/* VERIFIED DATA Header - Mate Style */}
          <div style={{ 
            marginBottom: '32px',
            background: '#fff',
            padding: '24px',
            border: '3px solid #000',
            boxShadow: '8px 8px 0px rgba(0, 0, 0, 1)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h1 style={{ 
                  fontSize: '32px', 
                  fontWeight: 700, 
                  letterSpacing: '2px',
                  fontFamily: "'Share Tech Mono', monospace",
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>
                  VERIFIED DATA
                </h1>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#666',
                  fontFamily: "'Share Tech Mono', monospace"
                }}>
                  검증된 여행 작진 로그를 확인하십시오.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => navigateToPage('myStories')}
                  style={{
                    padding: '10px 20px',
                    border: '3px solid #000',
                    background: '#fff',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: '14px',
                    fontFamily: "'Share Tech Mono', monospace",
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#000';
                  }}
                >
                  MY STORIES
                </button>
                <button 
                  onClick={() => navigateToPage('write')}
                  style={{
                    padding: '10px 20px',
                    border: '3px solid #000',
                    background: '#000',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '14px',
                    fontFamily: "'Share Tech Mono', monospace",
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#000';
                    e.currentTarget.style.color = '#fff';
                  }}
                >
                  WRITE
                </button>
              </div>
            </div>
          </div>

          <FilterSection filters={filters} setFilters={setFilters} />

          {getFilteredStories().length === 0 ? (
            <div className="no-results-fullpage">
              <div className="no-results-text">검색 결과가 없습니다.</div>
              <div className="no-results-subtext">다른 조건으로 검색해보세요.</div>
            </div>
          ) : (
            <div className="posts-grid">
              {getFilteredStories().map((story: Story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onCardClick={handleStoryClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Stories Page */}
      {currentPage === 'myStories' && (
        <div className="container">
          {/* 통계 섹션 - VERIFIED DATA와 같은 여백 */}
          <div style={{
            marginBottom: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '15px',
            padding: '12px 20px',
            background: '#fff',
            border: '3px solid #000',
            boxShadow: '8px 8px 0px rgba(0, 0, 0, 1)',
            position: 'relative'
          }}>
            {/* X 버튼 - 통계 박스 오른쪽 위 */}
            <button 
              onClick={goBack}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                border: 'none',
                background: '#fff',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
                zIndex: 10
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
                style={{ 
                  width: '24px',
                  height: '24px',
                  fill: '#000',
                  transition: 'fill 0.2s'
                }}
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>

            {/* 작성한 여행기 */}
            <div style={{
              padding: '12px 15px',
              border: '2px solid #000',
              background: '#fff',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px'
              }}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  style={{ 
                    width: '20px',
                    height: '20px',
                    fill: '#000'
                  }}
                >
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '4px',
                fontFamily: "'Share Tech Mono', monospace"
              }}>3</div>
              <div style={{
                fontSize: '10px',
                color: '#666',
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>작성한 여행기</div>
            </div>

            {/* 총 조회수 */}
            <div style={{
              padding: '12px 15px',
              border: '2px solid #000',
              background: '#fff',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px'
              }}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  style={{ 
                    width: '20px',
                    height: '20px',
                    fill: '#000'
                  }}
                >
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '4px',
                fontFamily: "'Share Tech Mono', monospace"
              }}>125</div>
              <div style={{
                fontSize: '10px',
                color: '#666',
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>총 조회수</div>
            </div>

            {/* 받은 좋아요 */}
            <div style={{
              padding: '12px 15px',
              border: '2px solid #000',
              background: '#fff',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px'
              }}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  style={{ 
                    width: '20px',
                    height: '20px',
                    fill: '#ff4757'
                  }}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '4px',
                fontFamily: "'Share Tech Mono', monospace"
              }}>48</div>
              <div style={{
                fontSize: '10px',
                color: '#666',
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>받은 좋아요</div>
            </div>

            {/* 좋아요 목록 - 클릭 가능 */}
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px'
              }}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  style={{ 
                    width: '20px',
                    height: '20px',
                    fill: likedStories.length > 0 ? '#ff4757' : '#000'
                  }}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '4px',
                fontFamily: "'Share Tech Mono', monospace"
              }}>{likedStories.length}</div>
              <div style={{
                fontSize: '10px',
                color: '#666',
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>좋아요 목록</div>
            </div>
          </div>

          {/* My Stories Grid */}
          <div className="posts-grid">
            {getFilteredStories().slice(0, 3).map((story: Story) => (
              <div key={story.id} className="story-card">
                {/* Story Image */}
                <div style={{ position: 'relative' }} onClick={() => handleStoryClick(story)}>
                  <img src={story.image} alt={story.title} className="story-image" style={{
                    width: '100%',
                    height: '250px',
                    objectFit: 'cover',
                    display: 'block'
                  }} />
                  <div className="story-stats-badge">{story.views}</div>
                </div>

                {/* Story Content */}
                <div className="story-content">
                  <div className="story-header" onClick={() => handleStoryClick(story)}>
                    <div className="author-avatar">{story.authorAvatar}</div>
                    <div className="author-info">
                      <div className="author-name">{story.author}</div>
                    </div>
                  </div>

                  <h3 className="story-title" onClick={() => handleStoryClick(story)}>
                    {story.title}
                  </h3>
                  <p className="story-description" onClick={() => handleStoryClick(story)}>
                    {story.description}
                  </p>

                  <div className="story-tags">
                    {story.tags.map((tag, index) => (
                      <span key={index} className="story-tag">{tag}</span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="story-stats-simple">
                    <div className="stat-simple-item">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      {story.likes}
                    </div>
                    <div className="stat-simple-item">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.3-3.86-.83l-.28-.15-2.86.49.49-2.86-.15-.28C4.3 14.68 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
                      </svg>
                      {story.comments}
                    </div>
                  </div>

                  {/* Edit/Delete Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '2px dashed rgba(0,0,0,0.2)'
                  }}>
                    <button
                      onClick={() => handleEdit(story)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '2px solid #000',
                        background: '#fff',
                        color: '#000',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: "'Share Tech Mono', monospace",
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#000';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#000';
                      }}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(story.id)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '2px solid #dc3545',
                        background: '#fff',
                        color: '#dc3545',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: "'Share Tech Mono', monospace",
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc3545';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#dc3545';
                      }}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Stories */}
          {getFilteredStories().length === 0 && (
            <div className="no-results-fullpage">
              <div className="no-results-text">작성한 여행기가 없습니다.</div>
              <div className="no-results-subtext">첫 여행기를 작성해보세요!</div>
            </div>
          )}
        </div>
      )}

      {/* Bookmarks Page */}
      {currentPage === 'bookmarks' && (
        <div className="container">
          <div style={{ padding: '0 0 40px 0' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '30px' }}>
              즐겨찾기
            </h2>
            {bookmarkedIds.length === 0 ? (
              <div className="bookmarks-empty">
                <div className="bookmarks-empty-text">즐겨찾기한 여행기가 없습니다.</div>
              </div>
            ) : (
              <div className="posts-grid">
                {/* Implement bookmarked stories here */}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Write Page */}
      {currentPage === 'write' && (
        <WritePage
          editingStory={editingStory}
          currentDraft={currentDraft}
          onBack={goBack}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          drafts={drafts}
          onShowDraftModal={() => setShowDraftModal(true)}
        />
      )}

      {/* Detail Page */}
      {currentPage === 'detail' && selectedStory && (
        <div className="detail-page-container">
          {/* Content */}
          <div className="detail-page-content">
            
            {/* Title과 X Button - 같은 라인 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              {/* Title */}
              <h1 style={{
                fontSize: '32px',
                fontWeight: 700,
                lineHeight: 1.4,
                margin: 0,
                fontFamily: "'Share Tech Mono', monospace"
              }}>
                {selectedStory.title}
              </h1>

              {/* X Button */}
              <button
                onClick={goBack}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  style={{ 
                    width: '40px',
                    height: '40px',
                    fill: '#000'
                  }}
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            {/* Info Tags와 Author Info - 같은 라인 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '25px',
              borderBottom: '2px solid #000',
              marginBottom: '30px'
            }}>
              {/* Info Tags */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{
                  padding: '8px 16px',
                  background: '#f5f5f5',
                  border: '2px solid #000',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace",
                  textTransform: 'uppercase'
                }}>
                  {selectedStory.destination}
                </div>
                <div style={{
                  padding: '8px 16px',
                  background: '#f5f5f5',
                  border: '2px solid #000',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace",
                  textTransform: 'uppercase'
                }}>
                  {selectedStory.duration}
                </div>
                <div style={{
                  padding: '8px 16px',
                  background: '#f5f5f5',
                  border: '2px solid #000',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace",
                  textTransform: 'uppercase'
                }}>
                  {parseInt(selectedStory.budget).toLocaleString()}원
                </div>
              </div>

              {/* Author Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexShrink: 0,
                marginRight: '20px'
              }}>
                {/* 프로필 사진 */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: '#fff',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace"
                }}>
                  {selectedStory.authorAvatar}
                </div>

                {/* 닉네임 */}
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace",
                  textTransform: 'uppercase'
                }}>
                  {selectedStory.author}
                </div>

                {/* 날짜, 조회수 */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  fontSize: '11px',
                  color: '#999',
                  fontFamily: "'Share Tech Mono', monospace"
                }}>
                  <div>{selectedStory.date}</div>
                  <div>{selectedStory.views} VIEWS</div>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div style={{
              width: '100%',
              maxWidth: '700px',
              marginBottom: '40px',
              border: '3px solid #000',
              margin: '0 auto 40px auto'
            }}>
              <img 
                src={selectedStory.image} 
                alt={selectedStory.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
              />
            </div>

            {/* Description */}
            <div style={{
              fontSize: '15px',
              lineHeight: '1.8',
              color: '#333',
              marginBottom: '30px',
              fontFamily: "'Share Tech Mono', monospace"
            }}>
              {selectedStory.description}
            </div>

            {/* 여행 경비 총정리 */}
            <div style={{
              background: '#fff',
              border: '2px solid #000',
              padding: '20px 25px',
              marginBottom: '30px',
              maxWidth: '700px',
              margin: '0 auto 30px auto'
            }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '3px solid #000',
                color: '#000'
              }}>
                여행 경비 총정리
              </h3>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #e0e0e0',
                  fontFamily: "'Share Tech Mono', monospace"
                }}>
                  <span style={{ fontSize: '13px', color: '#333' }}>교통비 (렌터카)</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>95,000원</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #e0e0e0',
                  fontFamily: "'Share Tech Mono', monospace"
                }}>
                  <span style={{ fontSize: '13px', color: '#333' }}>숙박비</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>85,000원</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #e0e0e0',
                  fontFamily: "'Share Tech Mono', monospace"
                }}>
                  <span style={{ fontSize: '13px', color: '#333' }}>식비</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>98,000원</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #e0e0e0',
                  fontFamily: "'Share Tech Mono', monospace"
                }}>
                  <span style={{ fontSize: '13px', color: '#333' }}>관광/입장료</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>15,000원</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #e0e0e0',
                  fontFamily: "'Share Tech Mono', monospace"
                }}>
                  <span style={{ fontSize: '13px', color: '#333' }}>쇼핑/기타</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>35,000원</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 25px',
                  background: '#000',
                  color: '#fff',
                  marginTop: '12px',
                  fontFamily: "'Share Tech Mono', monospace"
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>총 합계</span>
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>328,000원</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              paddingTop: '30px',
              borderTop: '2px dashed rgba(0,0,0,0.2)'
            }}>
              {selectedStory.tags.map((tag, index) => (
                <span 
                  key={index}
                  style={{
                    padding: '6px 12px',
                    background: '#000',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: "'Share Tech Mono', monospace",
                    textTransform: 'uppercase'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats - COMMENTS 제거 */}
            <div style={{
              display: 'flex',
              gap: '30px',
              paddingTop: '30px',
              marginTop: '30px',
              borderTop: '2px solid #000'
            }}>
              <button 
                className={`detail-stat-button ${likedStories.includes(selectedStory.id) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (likedStories.includes(selectedStory.id)) {
                    setLikedStories(likedStories.filter(id => id !== selectedStory.id));
                  } else {
                    setLikedStories([...likedStories, selectedStory.id]);
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="detail-stat-number">{selectedStory.likes}</span>
                <span className="detail-stat-tooltip">LIKES</span>
              </button>
              
              <button 
                className={`detail-stat-button ${followedStories.includes(selectedStory.id) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (followedStories.includes(selectedStory.id)) {
                    setFollowedStories(followedStories.filter(id => id !== selectedStory.id));
                  } else {
                    setFollowedStories([...followedStories, selectedStory.id]);
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <span className="detail-stat-number">{selectedStory.follows || 45}</span>
                <span className="detail-stat-tooltip">FOLLOW THIS</span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <CommentSection />
        </div>
      )}

      {/* Custom Alert */}
      {showAlert && (
        <div className="custom-alert" onClick={() => showCustomAlert('')}>
          <div className="custom-alert-content" onClick={(e) => e.stopPropagation()}>
            <div className="custom-alert-message">{alertMessage}</div>
            <button className="custom-alert-btn" onClick={() => showCustomAlert('')}>확인</button>
          </div>
        </div>
      )}

      {/* Draft Modal */}
      {showDraftModal && (
        <div className="draft-modal-overlay" onClick={() => setShowDraftModal(false)}>
          <div className="draft-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="draft-modal-header">
              <h2 className="draft-modal-title">임시저장 목록</h2>
              <button className="draft-close-btn" onClick={() => setShowDraftModal(false)}>&times;</button>
            </div>
            <div className="draft-list">
              {drafts.map((draft: any) => (
                <div 
                  key={draft.id} 
                  className="draft-item"
                  onClick={() => {
                    setCurrentDraft(draft);
                    setShowDraftModal(false);
                    setCurrentPage('write');
                  }}
                >
                  <div className="draft-item-title">{draft.title}</div>
                  <div className="draft-item-date">{draft.date}</div>
                </div>
              ))}
              {drafts.length === 0 && (
                <div className="draft-empty">임시저장된 글이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Likes Modal - 좋아요 목록 */}
      {showLikesModal && (
        <div className="draft-modal-overlay" onClick={() => setShowLikesModal(false)}>
          <div className="draft-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="draft-modal-header">
              <h2 className="draft-modal-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    style={{ 
                      width: '24px', 
                      height: '24px',
                      fill: '#ff4757'
                    }}
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  좋아요 목록
                </div>
              </h2>
              <button className="draft-close-btn" onClick={() => setShowLikesModal(false)}>&times;</button>
            </div>
            <div className="draft-list">
              {getFilteredStories().filter(story => likedStories.includes(story.id)).map((story: Story) => (
                <div 
                  key={story.id} 
                  className="draft-item"
                  onClick={() => {
                    handleStoryClick(story);
                    setShowLikesModal(false);
                  }}
                  style={{
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center'
                  }}
                >
                  <img 
                    src={story.image} 
                    alt={story.title}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      border: '2px solid #000'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div className="draft-item-title">{story.title}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '5px',
                      fontFamily: "'Share Tech Mono', monospace"
                    }}>
                      {story.destination} · {story.duration} · {parseInt(story.budget).toLocaleString()}원
                    </div>
                  </div>
                </div>
              ))}
              {likedStories.length === 0 && (
                <div className="draft-empty">좋아요한 여행기가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h2 className="delete-modal-title">여행기 삭제</h2>
            </div>
            <div className="delete-modal-body">
              <p className="delete-modal-message">
                정말 삭제하시겠습니까?<br />
                삭제된 여행기는 복구할 수 없습니다.
              </p>
              <div className="delete-modal-buttons">
                <button className="delete-btn-cancel" onClick={() => setShowDeleteModal(false)}>
                  취소
                </button>
                <button className="delete-btn-confirm" onClick={confirmDelete}>
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TravelStory;