// pages/Mate.tsx (상세 페이지 이동 버전)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, User, ChevronDown } from "lucide-react";
import { useMate } from "../hooks/useMate";
import { ChatFAB } from "../components/mate/chat/ChatFAB";
import { ChatSlideModal } from "../components/mate/chat/ChatSlide";
import { SORT_OPTIONS, getSortLabel } from "../components/mate/mate.constants";
import {
  MateHeader,
  MateFilters,
  MatePostCard,
  MatePagination,
  MateWriteModal,
  MateMySentModal,
  MateReceivedModal,
  MateApplicantDetailModal,
} from "../components/mate";
import styles from "../styles/mate/Mate.module.css";

export default function Mate(): JSX.Element {
  const navigate = useNavigate();
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  
  const {
    // Filter States
    locationFilter, setLocationFilter,
    dateFilter, setDateFilter,
    genderFilter, setGenderFilter,
    ageFilter, setAgeFilter,
    selectedTags, toggleTag,
    sortBy, setSortBy,
    currentPage, setCurrentPage,
    
    // Posts
    visiblePosts,
    filteredPosts,
    totalPages,
    likedPostIds,
    removedPosts,
    isLikedOnlyMode,
    isRemovedOnlyMode,
    hasActiveFilters,
    allPosts,
    
    // Modal States
    showWriteModal, setShowWriteModal,
    showApplicantsModal, setShowApplicantsModal,
    showReceivedModal, setShowReceivedModal,
    selectedApplicant, setSelectedApplicant,
    showSortDropdown, setShowSortDropdown,
    
    // Write Modal States
    startDate, setStartDate,
    endDate, setEndDate,
    selectedTransport, setSelectedTransport,
    selectedTravelTypes, setSelectedTravelTypes,
    selectedAgeGroups, setSelectedAgeGroups,
    selectedGender, setSelectedGender,
    
    // Applications
    myApplications,
    receivedApplications,
    getApplicantStatus,
    approvedApplicants,
    
    // Chat States
    oneOnOneChats,
    groupChats,
    
    // Handlers
    handleLike,
    handleRemove,
    handleRestore,
    handleResetAll,
    handlePostSubmit,
    handleApprove,
    handleReject,
    
    // Chat Handlers
    sendOneOnOneMessage,
    sendGroupMessage,
    getOrCreateOneOnOneChat,
    leaveOneOnOneChat,
    leaveGroupChat,
    createGroupChat,
  } = useMate();

  // 카드 클릭 시 상세 페이지로 이동
  const handleCardClick = (post: any) => {
    navigate(`/mate/${post.id}`);
  };

  // 1:1 채팅 생성
  const handleCreateOneOnOneChat = (postId: string, otherUserId: string) => {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;
    getOrCreateOneOnOneChat(postId, post.author);
  };

  // 그룹 채팅 생성
  const handleCreateGroupChat = (postId: string) => {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;
    
    // 승인된 멤버 수집
    const approvedApps = receivedApplications.filter(app => 
      app.postId === postId && approvedApplicants.includes(app.id)
    );
    
    const approvedMembers = [
      post.author,
      ...approvedApps.map(app => ({
        name: app.applicant.name,
        age: app.applicant.age,
        gender: app.applicant.gender,
        avatar: app.applicant.avatar,
        email: app.applicant.email,
        travelStyle: app.applicant.travelStyle,
      }))
    ];
    
    createGroupChat(post, approvedMembers);
  };

  // 읽지 않은 메시지 개수 (옵션)
  const unreadCount = 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* Header */}
        <MateHeader
          onWriteClick={() => setShowWriteModal(true)}
          onMySentClick={() => setShowApplicantsModal(true)}
          onReceivedClick={() => setShowReceivedModal(true)}
          onChatListClick={() => setShowChatModal(true)}
          mySentCount={myApplications.length}
          receivedPendingCount={receivedApplications.filter(app => getApplicantStatus(app.id) === "pending").length}
          unreadChatCount={unreadCount}
        />

        {/* Filters */}
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

        {/* Sort & Reset */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <ArrowUpDown className="w-5 h-5 text-black/60" />
            <span className="text-sm text-black/60">SORT BY:</span>
            
            <div className="relative dropdown-sort">
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`min-w-[180px] px-4 py-2 border-2 border-black text-left text-sm font-bold flex items-center justify-between transition-all ${
                  sortBy !== "default" ? styles.bgActive : "bg-white text-black hover:bg-[#f5f5f5]"
                }`}
              >
                <span>{getSortLabel(sortBy)}</span>
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
              </button>
              {showSortDropdown && (
                <div className={`absolute top-full left-0 mt-1 min-w-[200px] bg-white z-50 overflow-hidden ${styles.sortDropdown}`}>
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
                            optIdx !== group.options.length - 1 || groupIdx !== SORT_OPTIONS.length - 1 
                              ? "border-b border-black/10" : ""
                          } ${
                            sortBy === option.value ? styles.bgActive : "bg-white text-black hover:bg-[#eee]"
                          }`}
                        >
                          {option.label}
                          {option.value === "liked-only" && likedPostIds.length > 0 && (
                            <span className="ml-2 text-xs opacity-60">({likedPostIds.length})</span>
                          )}
                          {option.value === "removed-only" && removedPosts.length > 0 && (
                            <span className="ml-2 text-xs opacity-60">({removedPosts.length})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-black/70">{filteredPosts.length} posts found</span>
            {hasActiveFilters && (
              <button onClick={handleResetAll} className="text-sm text-black/70 hover:text-black font-bold font-mono underline">
                [ RESET ALL ]
              </button>
            )}
          </div>
        </div>

        {/* Posts */}
        {visiblePosts.length === 0 ? (
          <div className={`bg-white p-12 text-center ${styles.emptyState}`}>
            <User className="w-16 h-16 mx-auto mb-4 text-black/30" />
            {isLikedOnlyMode ? (
              <>
                <p className="text-black/60 text-lg font-bold uppercase">NO LIKED POSTS</p>
                <p className="text-black/40 text-sm mt-2">// 아직 좋아요한 게시물이 없습니다</p>
              </>
            ) : isRemovedOnlyMode ? (
              <>
                <p className="text-black/60 text-lg font-bold uppercase">NO PASSED POSTS</p>
                <p className="text-black/40 text-sm mt-2">// 아직 패스한 게시물이 없습니다</p>
              </>
            ) : (
              <>
                <p className="text-black/60 text-lg font-bold uppercase">NO POSTS FOUND</p>
                <p className="text-black/40 text-sm mt-2">// 필터를 조정해보세요</p>
              </>
            )}
            {(removedPosts.length > 0 && !isRemovedOnlyMode) && (
              <button onClick={handleResetAll} className="mt-4 px-6 py-2 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors font-bold text-sm">
                RESET ALL
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6 mb-8">
            {visiblePosts.map((post) => (
              <MatePostCard
                key={post.id}
                post={post}
                isLiked={likedPostIds.includes(post.id)}
                isRemoved={removedPosts.includes(post.id)}
                isRemovedMode={isRemovedOnlyMode}
                onCardClick={handleCardClick}
                onLike={handleLike}
                onRemove={handleRemove}
                onRestore={handleRestore}
              />
            ))}
          </div>
        )}

        {visiblePosts.length > 0 && (
          <div className="text-center">
            <p className="text-sm text-black/60 font-mono">// 카드를 클릭하면 상세 정보를 확인할 수 있습니다</p>
          </div>
        )}

        {/* Pagination */}
        <MatePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modals */}
      {showWriteModal && (
        <MateWriteModal
          onClose={() => setShowWriteModal(false)}
          onSubmit={handlePostSubmit}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          selectedTransport={selectedTransport}
          setSelectedTransport={setSelectedTransport}
          selectedTravelTypes={selectedTravelTypes}
          setSelectedTravelTypes={setSelectedTravelTypes}
          selectedAgeGroups={selectedAgeGroups}
          setSelectedAgeGroups={setSelectedAgeGroups}
          selectedGender={selectedGender}
          setSelectedGender={setSelectedGender}
        />
      )}

      {showApplicantsModal && (
        <MateMySentModal
          applications={myApplications}
          getApplicantStatus={getApplicantStatus}
          onClose={() => setShowApplicantsModal(false)}
        />
      )}

      {showReceivedModal && (
        <MateReceivedModal
          applications={receivedApplications}
          getApplicantStatus={getApplicantStatus}
          onApprove={handleApprove}
          onReject={handleReject}
          onSelectApplicant={setSelectedApplicant}
          onClose={() => setShowReceivedModal(false)}
        />
      )}

      {selectedApplicant && (
        <MateApplicantDetailModal
          applicant={selectedApplicant}
          getApplicantStatus={getApplicantStatus}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setSelectedApplicant(null)}
        />
      )}

      {/* 플로팅 채팅 버튼 */}
      <ChatFAB onClick={() => setShowChatModal(true)} unreadCount={unreadCount} />

      {/* 슬라이드 채팅 모달 */}
      <ChatSlideModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        oneOnOneChats={oneOnOneChats}
        groupChats={groupChats}
        allPosts={allPosts}
        myApplications={myApplications}
        receivedApplications={receivedApplications}
        approvedApplicants={approvedApplicants}
        onSendOneOnOneMessage={sendOneOnOneMessage}
        onSendGroupMessage={sendGroupMessage}
        onCreateOneOnOneChat={handleCreateOneOnOneChat}
        onCreateGroupChat={handleCreateGroupChat}
        onLeaveOneOnOneChat={leaveOneOnOneChat}
        onLeaveGroupChat={leaveGroupChat}
      />
    </div>
  );
}