import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, User, ChevronDown } from "lucide-react";

import { useMate } from "../hooks/useMate";
import { useChat } from "../../chat/hooks/useChat";
import { ChatFAB } from "../../chat/components/ChatFAB";
import { ChatSlideModal } from "../../chat/components/ChatSlideModal";
import { useMateFilters } from "../hooks/useMateFilters";
import { usePagination } from "../hooks/usePagination";
import { SORT_OPTIONS, getSortLabel, POSTS_PER_PAGE } from "../hooks/mate.constants";
import { useCurrentUser } from "../../chat/hooks/useCurrentUser";

import {
  MateHeader,
  MateFilters,
  MatePostCard,
  MatePagination,
  MateWriteModal,
  MateReceivedModal,
  MateSentModal,
  MateTabs,
} from "../components";

import "../styles/Mate.css";
import "../../chat/styles/ChatFAB.css";
import type { MateTabKey } from "../components/MateTabs";
import { getTodayKST, isPostExpired } from "../hooks/mate.util";

export default function Mate() {
  const navigate = useNavigate();

  const [writeError, setWriteError] = useState<string | null>(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [showSentModal, setShowSentModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedTransport, setSelectedTransport] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [showChatModal, setShowChatModal] = useState(false);

  const [activeTab, setActiveTab] = useState<MateTabKey>('all');
  
  const { chatRooms, createRoom, sendMessage, refreshRooms, markAsRead, leaveRoom } = useChat();

  const { posts, loading, error, 
    fetchPosts, createPost, deletePost, 
    toggleLike,
    applications, receivedApplications, 
    fetchSentApplications, fetchReceivedApplications, 
    handleApplicationStatus, 
    fetchPassedPosts, fetchExpiredPosts,
    passPost, unpassPost,
    passedPosts, expiredPosts,
    deleteSentApplication
   } = useMate();

  const {
    locationFilter,
    setLocationFilter,
    dateFilter,
    setDateFilter,
    genderFilter,
    setGenderFilter,
    ageFilter,
    setAgeFilter,
    selectedTags,
    toggleTag,
    sortBy,
    setSortBy,
    filteredPosts,
    hasActiveFilters,
    handleResetAll,
  } = useMateFilters(posts);

  const currentUser = useCurrentUser();
  const currentUserId = currentUser?.id;

  const passedIdSet = useMemo(
    () => new Set(passedPosts.map(p => p.id)),
    [passedPosts]
  );

  const displayedPosts = useMemo(() => {
    switch (activeTab) {
      case 'passed':
        return passedPosts;
      case 'expired':
        return expiredPosts;
      case 'liked':
        return filteredPosts.filter(p => p.liked);
      case 'my':
        return posts.filter(p => p.author.id === currentUserId);
      case 'all':
      default:
        return filteredPosts.filter(p =>
          !passedIdSet.has(p.id) && !isPostExpired(p)
        );
    }
  }, [activeTab, filteredPosts, passedPosts, expiredPosts, passedIdSet, getTodayKST()]);

  const counts = {
    all: filteredPosts.filter(p => !passedIdSet.has(p.id) && p.endDate >= getTodayKST()).length,
    passed: passedPosts.length,
    expired: expiredPosts.length,
    liked: posts.filter(p => p.liked).length,
    my: posts.filter(p => p.author.id === currentUserId).length,
  };

  const { currentPage, setCurrentPage, totalPages, visiblePosts } = usePagination(
    displayedPosts,
    POSTS_PER_PAGE
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (showReceivedModal) {
      fetchReceivedApplications();
    }
  }, [showReceivedModal]);

  useEffect(() => {
    if (showSentModal) {
      fetchSentApplications();
    }
  }, [showSentModal]);

  // 탭 진입 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'passed') fetchPassedPosts();
    else if (activeTab === 'expired') fetchExpiredPosts();
  }, [activeTab, fetchPassedPosts, fetchExpiredPosts]);

  // 페이지 첫 진입 시에도 passed 목록은 받아둬야 ALL 탭에서 필터 가능
  useEffect(() => { fetchPassedPosts(); }, [fetchPassedPosts]);
  useEffect(() => { fetchExpiredPosts(); }, [fetchExpiredPosts]);

  const handleCardClick = (post: any) => {
    navigate(`/mate/${post.id}`);
  };

  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWriteError(null);
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    const budgetString = formData.get("budget") as string;
    const budget = parseInt(budgetString.replace(/,/g, ""));

    if (!startDate || !endDate) {
      alert("날짜를 선택해주세요.");
      return;
    }

    if (!selectedTransport) {
      alert("이동수단을 선택해주세요.");
      return;
    }

    const postData = {
      destination: formData.get("destination") as string,
      startDate,
      endDate,
      currentParticipant: parseInt(formData.get("currentParticipant") as string),
      maxParticipant: parseInt(formData.get("maxParticipant") as string),
      budget,
      transport: selectedTransport, 
      genderPreference: selectedGender || "무관",
      ageGroup: selectedAgeGroup ?? "전체",
      content: formData.get("content") as string,
    };

    const result = await createPost(postData);
    if (result) {
      setShowWriteModal(false);
      setStartDate(null);
      setEndDate(null);
      setSelectedTransport("");
      setSelectedGender("");
      setSelectedAgeGroup("");
      formElement.reset();
    } else {

    }
  };

  useEffect(() => {
    if (error && showWriteModal) {
      setWriteError(error);
    }
  }, [error, showWriteModal]);

  const handleDeletePost = async (postId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await deletePost(postId);
    }
  };

  const handlePass = useCallback(
      async (postId: number, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      await passPost(postId);
    },
    [passPost]
  );

  const handleUnpass = useCallback(
    async (postId: number, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      await unpassPost(postId);
    },
    [unpassPost]
  );

  const handleLike = useCallback(
    (postId: number, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      toggleLike(postId);
    },
    [toggleLike]
  );


  return (
    <section className="page-section">
      <div className="container" style={{ paddingTop: "40px", paddingBottom: "40px" }}>
        <div style={{ marginBottom: "35px" }}>
          <MateHeader
            onWriteClick={() => setShowWriteModal(true)}
            onMySentClick={() => setShowSentModal(true)}
            onReceivedClick={() => setShowReceivedModal(true)}
            onChatListClick={() => {}}
            mySentCount={0}
            receivedPendingCount={0}
            unreadChatCount={0}
          />
        </div>
        
        <div className="mate-management-board">
          <MateTabs
            active={activeTab}
            onChange={setActiveTab}
            counts={counts}
          />

          <div className="filter-wrapper">
            {activeTab === 'all' ? (
              <MateFilters
                locationFilter={locationFilter}
                setLocationFilter={setLocationFilter}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                genderFilter={genderFilter}
                setGenderFilter={setGenderFilter}
                ageFilter={ageFilter}
                setAgeFilter={setAgeFilter}
                selectedTags={selectedTags}
                toggleTag={toggleTag}
                setCurrentPage={setCurrentPage}
              />
            ) : (
            <div className="tab-status-banner">
              <div className="banner-icon">
                {activeTab === 'passed' && '📁'}
                {activeTab === 'expired' && '⏳'}
                {activeTab === 'liked' && '💖'}
                {activeTab === 'my' && '👤'}
              </div>
              <div className="banner-content">
                <span className="banner-title">
                  {activeTab === 'passed' && '>> PASSED ARCHIVE'}
                  {activeTab === 'expired' && '>> EXPIRED POSTS'}
                  {activeTab === 'liked' && '>> MY WISHLIST'}
                  {activeTab === 'my' && '>> MY OWN POSTS'}
                </span>
                <p className="banner-desc">
                  {activeTab === 'passed' && "관심 없음으로 분류한 게시글들입니다. 복원 버튼으로 다시 리스트에 넣을 수 있습니다."}
                  {activeTab === 'expired' && "이미 모집 기간이 종료된 게시글입니다. 정보 확인만 가능합니다."}
                  {activeTab === 'liked' && "내가 찜한 게시글 모음입니다. 관심 있는 파티원에게 신청서를 보내보세요!"}
                  {activeTab === 'my' && "내가 작성한 모집글입니다. 지원자 현황과 상세 내용을 관리하세요."}
                </p>
              </div>
            </div>
            )
            }
          </div>
        </div>

        <div
          style={{ marginBottom: "30px", marginTop: "30px" }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div className="flex items-center gap-3">
            <ArrowUpDown className="w-5 h-5 text-black/60" />
            <span className="text-sm text-black/60">SORT BY:</span>

            <div className="relative dropdown-sort">
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`min-w-[180px] px-4 py-2 border-2 border-black text-left text-sm font-bold flex items-center justify-between transition-all ${
                  sortBy !== "default" ? "bgActive" : "bg-white text-black hover:bg-[#f5f5f5]"
                }`}
              >
                <span>{getSortLabel(sortBy)}</span>
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform ${
                    showSortDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-white z-50 overflow-hidden sortDropdown">
                  {SORT_OPTIONS.map((group, groupIdx) => (
                    <div key={group.group}>
                      <div className="px-4 py-2 bg-[#f4f4f4] text-xs font-bold text-black/50 uppercase border-b border-black/20">
                        {group.group}
                      </div>

                      {group.options.map((option, optIdx) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSortBy(option.value);
                            setCurrentPage(1);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-bold transition-colors ${
                            optIdx !== group.options.length - 1 ||
                            groupIdx !== SORT_OPTIONS.length - 1
                              ? "border-b border-black/10"
                              : ""
                          } ${
                            sortBy === option.value
                              ? "bgActive"
                              : "bg-white text-black hover:bg-[#eee]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-black/70">{displayedPosts.length} posts found</span>
            {hasActiveFilters && (
              <button
                onClick={handleResetAll}
                className="text-sm text-black/70 hover:text-black font-bold font-mono underline"
              >
                [ RESET ALL ]
              </button>
            )}
          </div>
        </div>  

        {loading && posts.length === 0 ? (
          <div className="bg-white p-20 text-center font-mono font-bold animate-pulse border-2 border-black">
            {">> SCANNING FOR NEW MATES..."}
          </div>
        ) : !visiblePosts || visiblePosts.length === 0 ? (
          <div className="bg-white p-12 text-center emptyState">
            <User className="w-16 h-16 mx-auto mb-4 text-black/30" />
            <p className="text-black/60 text-lg font-bold uppercase">
              {activeTab === 'passed' ? 'ARCHIVE IS EMPTY' 
              : activeTab === 'expired' ? 'NO EXPIRED POSTS' 
              : activeTab === 'liked' ? 'NO LIKED POSTS'
              : 'NO POSTS FOUND'}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "25px", marginBottom: "40px" }}
          >
            {visiblePosts.map((post) => (
              <MatePostCard
                key={post.id}
                post={post}
                isLiked={post.liked ?? false}
                isRemoved={activeTab === 'passed'}
                isRemovedMode={activeTab === 'passed'}
                isExpiredMode={activeTab === 'expired'}
                onDelete={handleDeletePost}
                onCardClick={handleCardClick}
                onLike={handleLike}
                onRemove={handlePass}
                onRestore={handleUnpass}
              />
            ))}
          </div>
        )}

        <MatePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {showWriteModal && (
        <MateWriteModal
          onClose={() => {
            setShowWriteModal(false);
            setWriteError(null);
          }}
          // 전역 error보다는 관리 중인 writeError를 넘겨주는 게 더 정확할 수 있습니다.
          writeError={writeError} 
          onSubmit={handlePostSubmit}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          selectedTransport={selectedTransport}
          setSelectedTransport={setSelectedTransport}
          selectedAgeGroup={selectedAgeGroup}
          setSelectedAgeGroup={setSelectedAgeGroup}
          selectedGender={selectedGender}
          setSelectedGender={setSelectedGender}
        />
      )}
      {showSentModal && (
        <MateSentModal
         applications={applications}
         getApplicantStatus={(id) => {
          const app = applications.find(a => a.id === id);
          return app?.status || "pending";
         }}
         onClose={() => setShowSentModal(false)}
         onDeleteSent={(applyId) => deleteSentApplication(applyId)}
        />
      )}

      {showReceivedModal && (
        <MateReceivedModal
          applications={receivedApplications}
          getApplicantStatus={(id) => {
              const app = receivedApplications.find(a => a.id === id);
              return app?.status || "pending";
          }}
          onApprove={(id, postId, applicantId) => handleApplicationStatus(id, 'approve')}
          onReject={(id) => handleApplicationStatus(id, 'reject')}
          onClose={() => setShowReceivedModal(false)}
        />
      )}

      <ChatFAB 
        onClick={() => {
          refreshRooms();
          fetchSentApplications();
          fetchReceivedApplications();
          setShowChatModal(true);
        }}
        unreadCount={0}
      />

      {showChatModal && (
        <ChatSlideModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          oneOnOneChats={chatRooms}
          allPosts={posts}
          myApplications={applications}
          receivedApplications={receivedApplications}
          onSendOneOnOneMessage={(chatId, content) => sendMessage(chatId, content)}
          onCreateOneOnOneChat={async (postId, applicantId) => {
            const room = await createRoom(Number(postId), applicantId!);
            return room;
          }}
          onLeaveOneOnOneChat={(chatId) => {leaveRoom(chatId)}}
          onMarkAsRead={(chatId) => markAsRead(chatId)}
        />
      )}


    </section>
  );
}