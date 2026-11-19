import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useMate } from "../hooks/useMate";
import { useAuth } from "../../user/pages/AuthContext";
import { useChat } from "../../chat/hooks/useChat";
import { ChatFAB } from "../../chat/components/ChatFAB";
import { ChatSlideModal } from "../../chat/components/ChatSlideModal";
import { useMateFilters } from "../hooks/useMateFilters";
import { usePagination } from "../hooks/usePagination";
import { SORT_OPTIONS, getSortLabel, POSTS_PER_PAGE } from "../hooks/mate.constants";

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
import type { MateTabKey } from "../components/MateTabs";
import { isPostExpired } from "../hooks/mate.util";
import { getAccessToken } from "../../../api/api";

export default function Mate() {
  const navigate = useNavigate();
  const { userId } = useAuth();

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
    deleteSentApplication,
    deleteReceivedApplication,
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
        return posts.filter(p => p.author.id === userId);
      case 'all':
      default:
        return filteredPosts.filter(p =>
          !passedIdSet.has(p.id) && !isPostExpired(p)
        );
    }
  }, [activeTab, filteredPosts, passedPosts, expiredPosts, passedIdSet]);

  const counts = useMemo (() => ({
    all: filteredPosts.filter(p => !passedIdSet.has(p.id) && !isPostExpired(p)).length,
    passed: passedPosts.length,
    expired: expiredPosts.length,
    liked: posts.filter(p => p.liked).length,
    my: posts.filter(p => p.author.id === userId).length,
  }), [filteredPosts, passedIdSet, passedPosts, expiredPosts, posts, userId]);

  const { currentPage, setCurrentPage, totalPages, visiblePosts } = usePagination(
    displayedPosts,
    POSTS_PER_PAGE
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!showSortDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".mate-sort")) setShowSortDropdown(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showSortDropdown]);

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

  useEffect(() => {
    if (activeTab === 'passed') fetchPassedPosts();
    else if (activeTab === 'expired') fetchExpiredPosts();
  }, [activeTab, fetchPassedPosts, fetchExpiredPosts]);

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

  const token = getAccessToken();

  useEffect(() => {
    if (!token) return;
    fetchSentApplications();
    fetchReceivedApplications();
  }, [token, fetchSentApplications, fetchReceivedApplications]);

  const mySentCount = applications.length;
  const receivedPendingCount = receivedApplications.filter(
    (a) => String(a.status ?? "pending").toLowerCase() === "pending"
  ).length;

  const TAB_BANNER: Record<Exclude<MateTabKey, 'all'>, [string, string, string]> = {
    passed: ["📁", ">> PASSED ARCHIVE", "관심 없음으로 넘긴 글이에요. UNPASS를 누르면 목록에 다시 나와요."],
    expired: ["⏳", ">> EXPIRED POSTS", "모집 기간이 끝난 글이에요. 내용만 볼 수 있어요."],
    liked: ["💖", ">> MY WISHLIST", "찜한 글이에요. 마음에 드는 동행에게 신청해 보세요."],
    my: ["👤", ">> MY OWN POSTS", "내가 쓴 모집 글이에요. 받은 신청은 RECEIVED에서 관리해요."],
  };

  const sortControl = (
    <div className="mate-sort">
      <button
        type="button"
        className="mate-bt"
        onClick={() => setShowSortDropdown(!showSortDropdown)}
        aria-haspopup="menu"
        aria-expanded={showSortDropdown}
      >
        정렬: {getSortLabel(sortBy)}
      </button>
      {showSortDropdown && (
        <div className="mate-sort__menu" role="menu">
          <div className="mate-sort__head" aria-hidden="true">정렬 기준</div>
          {SORT_OPTIONS.flatMap((group) => group.options).map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={sortBy === option.value}
              className={`mate-sort__item ${sortBy === option.value ? "is-on" : ""}`}
              onClick={() => {
                setSortBy(option.value);
                setCurrentPage(1);
                setShowSortDropdown(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="page-section tm-grid-bg">
      <div className="mate-p2">
        <MateHeader
          onWriteClick={() => setShowWriteModal(true)}
          onMySentClick={() => setShowSentModal(true)}
          onReceivedClick={() => setShowReceivedModal(true)}
          onChatListClick={() => {}}
          mySentCount={mySentCount}
          receivedPendingCount={receivedPendingCount}
          unreadChatCount={0}
        />

        <MateTabs
          active={activeTab}
          onChange={setActiveTab}
          counts={counts}
          aside={<b className="mate-found">{displayedPosts.length} posts found</b>}
        />

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
            actions={
              <>
                {sortControl}
                {hasActiveFilters && (
                  <button type="button" className="mate-x" onClick={handleResetAll}>초기화</button>
                )}
              </>
            }
          />
        ) : (
          <div className="mate-notice mate-banner">
            <span className="mate-banner__icon" aria-hidden="true">{TAB_BANNER[activeTab][0]}</span>
            <div className="mate-banner__text">
              <b>{TAB_BANNER[activeTab][1]}</b>
              <span>{TAB_BANNER[activeTab][2]}</span>
            </div>
            {sortControl}
          </div>
        )}

        {loading && posts.length === 0 ? (
          <div className="mate-section">
            <div className="tm-loading"><span className="tm-spinner" />동행 글을 불러오는 중...</div>
          </div>
        ) : !visiblePosts || visiblePosts.length === 0 ? (
          <div className="mate-section">
            <div className="mate-empty">
              <span className="mate-empty__icon" aria-hidden="true">🧳</span>
              <b>
                {activeTab === 'passed' ? '넘긴 글이 없어요'
                : activeTab === 'expired' ? '마감된 글이 없어요'
                : activeTab === 'liked' ? '찜한 글이 없어요'
                : activeTab === 'my' ? '아직 쓴 글이 없어요'
                : '조건에 맞는 글이 없어요'}
              </b>
              {activeTab === 'all' && (hasActiveFilters ? "필터를 바꾸거나 초기화해 보세요" : "직접 모집글을 써 보세요")}
            </div>
          </div>
        ) : (
          <div>
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
          onDeleteReceived={(applyId) => deleteReceivedApplication(applyId)}
        />
      )}

      {token && (
      <ChatFAB 
        onClick={() => {
          refreshRooms();
          fetchSentApplications();
          fetchReceivedApplications();
          setShowChatModal(true);
        }}
      />
      )}

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