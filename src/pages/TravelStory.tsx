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
                  onClick={() => setCurrentPage('myStories')}
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
                  onClick={() => setCurrentPage('write')}
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px' 
          }}>
            <button 
              onClick={() => setCurrentPage('main')}
              style={{
                padding: '12px 30px',
                border: '3px solid #000',
                background: '#fff',
                color: '#000',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
                boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
                transition: 'all 0.3s'
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
              ← BACK
            </button>
            <button 
              onClick={() => setShowDraftModal(true)}
              style={{
                padding: '12px 30px',
                border: '3px solid #000',
                background: '#fff',
                color: '#000',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
                boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
                transition: 'all 0.3s'
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
              SAVE DRAFT
            </button>
          </div>

          <div className="my-stats-section-main">
            <div className="stat-box">
              <div className="stat-number">3</div>
              <div className="stat-label">작성한 여행기</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">125</div>
              <div className="stat-label">총 조회수</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">48</div>
              <div className="stat-label">받은 좋아요</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">12</div>
              <div className="stat-label">받은 댓글</div>
            </div>
          </div>

          <div className="posts-grid">
            {/* Implement my stories list here */}
          </div>
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
          onBack={() => {
            setCurrentPage('main');
            setEditingStory(null);
            setCurrentDraft(null);
          }}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
        />
      )}

{/* Detail Page */}
{currentPage === 'detail' && selectedStory && (
  <div className="detail-page-container">
    {/* Content */}
    <div className="detail-page-content">
      {/* BACK Button - 오른쪽 정렬 */}
      <div style={{ 
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'flex-end'  // 오른쪽 정렬
      }}>
        <button
          onClick={() => setCurrentPage('main')}
          className="detail-header-button"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#000';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#000';
          }}
        >
          ← BACK
        </button>
      </div>

      {/* Author Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        paddingBottom: '25px',
        borderBottom: '2px solid #000',
        marginBottom: '30px'
      }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#fff',
                fontWeight: 700,
                fontFamily: "'Share Tech Mono', monospace"
              }}>
                {selectedStory.authorAvatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace",
                  textTransform: 'uppercase',
                  marginBottom: '5px'
                }}>
                  {selectedStory.author}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  fontFamily: "'Share Tech Mono', monospace"
                }}>
                  {selectedStory.date} · {selectedStory.views} VIEWS
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              lineHeight: 1.4,
              marginBottom: '20px',
              fontFamily: "'Share Tech Mono', monospace"
            }}>
              {selectedStory.title}
            </h1>

            {/* Info Tags - 이모티콘 제거 */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '30px'
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

            {/* 여행 경비 총정리 섹션 */}
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
                {/* 교통비 */}
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

                {/* 숙박비 */}
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

                {/* 식비 */}
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

                {/* 관광/입장료 */}
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

                {/* 쇼핑/기타 */}
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

                {/* 총 합계 */}
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

            {/* Stats - Interactive Buttons */}
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
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: "'Share Tech Mono', monospace"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: '#000' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.3-3.86-.83l-.28-.15-2.86.49.49-2.86-.15-.28C4.3 14.68 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                {selectedStory.comments} COMMENTS
              </div>
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
              <button className="draft-close-btn" onClick={() => setShowDraftModal(false)}>×</button>
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