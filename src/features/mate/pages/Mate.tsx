// pages/Mate.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, User, ChevronDown } from "lucide-react";

// Hooks
import { useMate } from "../hooks";
import { SORT_OPTIONS, getSortLabel } from "../hooks/mate.constants";

// Components
import {
  MateHeader,
  MateFilters,
  MatePostCard,
  MatePagination,
  MateWriteModal,
  MateSentModal,
  MateReceivedModal,
} from "../components";

// Chat Components
import { ChatFAB, ChatSlide } from "../components/chat";

// Styles
import "../styles/Mate.css";

export default function Mate(){
  const navigate = useNavigate();
  const [showChatModal, setShowChatModal] = useState<boolean>(false);

  const {
    locationFilter, setLocationFilter,
    dateFilter, setDateFilter,
    genderFilter, setGenderFilter,
    ageFilter, setAgeFilter,
    selectedTags, toggleTag,
    sortBy, setSortBy,
    currentPage, setCurrentPage,

    visiblePosts,
    filteredPosts,
    totalPages,
    likedPostIds,
    removedPosts,
    isLikedOnlyMode,
    isRemovedOnlyMode,
    isAppliedOnlyMode,
    hasActiveFilters,
    allPosts,

    showWriteModal, setShowWriteModal,
    showApplicantsModal, setShowApplicantsModal,
    showReceivedModal, setShowReceivedModal,
    selectedApplicant, setSelectedApplicant,
    showSortDropdown, setShowSortDropdown,

    startDate, setStartDate,
    endDate, setEndDate,
    selectedTransport, setSelectedTransport,
    selectedTravelTypes, setSelectedTravelTypes,
    selectedAgeGroups, setSelectedAgeGroups,
    selectedGender, setSelectedGender,

    myApplications,
    receivedApplications,
    allReceivedApplications,
    getApplicantStatus,
    approvedApplicants,

    oneOnOneChats,

    handleLike,
    handleRemove,
    handleRestore,
    handleResetAll,
    handlePostSubmit,
    handleApprove,
    handleReject,
    handleDeletePost,

    sendOneOnOneMessage,
    leaveOneOnOneChat,
    createOneOnOneChat,
  } = useMate();

  const handleCardClick = (post: any) => {
    navigate(`/mate/${post.id}`);
  };

  const unreadCount = 0;

  return (
    <section className="page-section">
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>

        {/* Header */}
        <div style={{ marginBottom: '35px' }}>
          <MateHeader
            onWriteClick={() => setShowWriteModal(true)}
            onMySentClick={() => setShowApplicantsModal(true)}
            onReceivedClick={() => setShowReceivedModal(true)}
            onChatListClick={() => setShowChatModal(true)}
            mySentCount={myApplications.length}
            receivedPendingCount={receivedApplications.filter(app => getApplicantStatus(app.id) === "pending").length}
            unreadChatCount={unreadCount}
          />
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '30px' }}>
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
        </div>

        {/* Sort / Filter */}
        <div style={{ marginBottom: '30px' }} className="flex items-center justify-between flex-wrap gap-4">
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
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
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
                            optIdx !== group.options.length - 1 || groupIdx !== SORT_OPTIONS.length - 1
                              ? "border-b border-black/10" : ""
                          } ${
                            sortBy === option.value ? "bgActive" : "bg-white text-black hover:bg-[#eee]"
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
          <div className="bg-white p-12 text-center emptyState">
            <User className="w-16 h-16 mx-auto mb-4 text-black/30" />
            <p className="text-black/60 text-lg font-bold uppercase">NO POSTS FOUND</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '40px' }}>
            {visiblePosts.map((post) => (
              <MatePostCard
                key={post.id}
                post={post}
                isLiked={likedPostIds.includes(post.id)}
                isRemoved={removedPosts.includes(post.id)}
                isRemovedMode={isRemovedOnlyMode}
                onDelete={handleDeletePost}
                onCardClick={handleCardClick}
                onLike={handleLike}
                onRemove={handleRemove}
                onRestore={handleRestore}
              />
            ))}
          </div>
        )}

        <MatePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

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
        <MateSentModal
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
          onClose={() => setShowReceivedModal(false)}
        />
      )}

      <ChatFAB onClick={() => setShowChatModal(true)} unreadCount={unreadCount} />

      <ChatSlide
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        oneOnOneChats={oneOnOneChats}
        allPosts={allPosts}
        myApplications={myApplications}
        receivedApplications={allReceivedApplications}
        onSendOneOnOneMessage={sendOneOnOneMessage}
        onCreateOneOnOneChat={createOneOnOneChat}
        onLeaveOneOnOneChat={leaveOneOnOneChat}
      />
    </section>
  );
}