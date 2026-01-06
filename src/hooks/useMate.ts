// hooks/useMate.ts

import { useState, useEffect, MouseEvent } from "react";
import type { Post, MyApplication, ReceivedApplication, PostStats, SelectedApplicant, Author } from "../components/mate/mate.types";
import type {
  ChatMessage,
  OneOnOneChat,
  GroupChat,
} from "../components/mate/chat/chat.types";

import {
  STORAGE_KEYS,
  DEFAULT_POSTS,
  DEFAULT_RECEIVED_APPLICATIONS,
  CURRENT_USER,
} from "../components/mate/mate.constants";

// localStorage 유틸리티
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("localStorage 저장 실패:", error);
  }
}

function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => getFromStorage(key, defaultValue));

  useEffect(() => {
    setToStorage(key, state);
  }, [key, state]);

  return [state, setState];
}

export function useMate() {
  // LocalStorage States
  const [removedPosts, setRemovedPosts] = useLocalStorage<string[]>(STORAGE_KEYS.REMOVED_POSTS, []);
  const [selectedTags, setSelectedTags] = useLocalStorage<string[]>(STORAGE_KEYS.SELECTED_TAGS, []);
  const [locationFilter, setLocationFilter] = useLocalStorage<string>(STORAGE_KEYS.LOCATION_FILTER, "");
  const [genderFilter, setGenderFilter] = useLocalStorage<string>(STORAGE_KEYS.GENDER_FILTER, "전체");
  const [ageFilter, setAgeFilter] = useLocalStorage<string>(STORAGE_KEYS.AGE_FILTER, "전체");
  const [sortBy, setSortBy] = useLocalStorage<string>(STORAGE_KEYS.SORT_BY, "default");
  const [currentPage, setCurrentPage] = useLocalStorage<number>(STORAGE_KEYS.CURRENT_PAGE, 1);
  const [userPosts, setUserPosts] = useLocalStorage<Post[]>(STORAGE_KEYS.USER_POSTS, []);
  const [likedPostIds, setLikedPostIds] = useLocalStorage<string[]>(STORAGE_KEYS.LIKED_POSTS, []);
  const [approvedApplicants, setApprovedApplicants] = useLocalStorage<string[]>(STORAGE_KEYS.APPROVED_APPLICANTS, []);
  const [rejectedApplicants, setRejectedApplicants] = useLocalStorage<string[]>(STORAGE_KEYS.REJECTED_APPLICANTS, []);
  const [postStats, setPostStats] = useLocalStorage<PostStats>(STORAGE_KEYS.POST_STATS, {});
  const [myApplications, setMyApplications] = useLocalStorage<MyApplication[]>(STORAGE_KEYS.MY_APPLICATIONS, []);
  const [receivedApplications] = useLocalStorage<ReceivedApplication[]>(
    STORAGE_KEYS.RECEIVED_APPLICATIONS, 
    DEFAULT_RECEIVED_APPLICATIONS
  );

  const [oneOnOneChats, setOneOnOneChats] = useLocalStorage<OneOnOneChat[]>(
    STORAGE_KEYS.ONE_ON_ONE_CHATS, 
    []
  );
  const [groupChats, setGroupChats] = useLocalStorage<GroupChat[]>(
    STORAGE_KEYS.GROUP_CHATS, 
    []
  );

  const leaveOneOnOneChat = (chatId: string): void => {
    setOneOnOneChats(prev => prev.filter(chat => chat.id !== chatId));
  };

  const leaveGroupChat = (chatId: string): void => {
    setGroupChats(prev => prev.filter(chat => chat.id !== chatId));
  };

  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [activeChatType, setActiveChatType] = useState<"one-on-one" | "group" | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Date filter
  const [dateFilter, setDateFilter] = useState<Date | null>(() => {
    const stored = getFromStorage<string | null>(STORAGE_KEYS.DATE_FILTER, null);
    return stored ? new Date(stored) : null;
  });

  useEffect(() => {
    setToStorage(STORAGE_KEYS.DATE_FILTER, dateFilter ? dateFilter.toISOString() : null);
  }, [dateFilter]);

  // Modal States
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showWriteModal, setShowWriteModal] = useState<boolean>(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState<boolean>(false);
  const [showReceivedModal, setShowReceivedModal] = useState<boolean>(false);
  const [selectedApplicant, setSelectedApplicant] = useState<SelectedApplicant | null>(null);
  const [showApplyMessage, setShowApplyMessage] = useState<boolean>(false);
  const [applyMessage, setApplyMessage] = useState<string>("");

  // Sort Dropdown State
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);

  // Write Modal States
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<string[]>([]);
  const [selectedTravelTypes, setSelectedTravelTypes] = useState<string[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>("무관");

  // Helper Functions
  const getPostStats = (postId: string): { views: number; likes: number } => {
    const stats = postStats[postId] || {};
    const defaultPost = DEFAULT_POSTS.find(p => p.id === postId);
    return {
      views: stats.views ?? defaultPost?.views ?? 0,
      likes: stats.likes ?? defaultPost?.likes ?? 0,
    };
  };

  const incrementViews = (postId: string): void => {
    setPostStats(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        views: (prev[postId]?.views ?? DEFAULT_POSTS.find(p => p.id === postId)?.views ?? 0) + 1,
        likes: prev[postId]?.likes ?? DEFAULT_POSTS.find(p => p.id === postId)?.likes ?? 0,
      }
    }));
  };

  const toggleLike = (postId: string): void => {
    const defaultLikes = DEFAULT_POSTS.find(p => p.id === postId)?.likes ?? 0;
    const currentLikes = postStats[postId]?.likes ?? defaultLikes;
    
    if (likedPostIds.includes(postId)) {
      setLikedPostIds(likedPostIds.filter(id => id !== postId));
      setPostStats(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          views: prev[postId]?.views ?? DEFAULT_POSTS.find(p => p.id === postId)?.views ?? 0,
          likes: currentLikes - 1,
        }
      }));
    } else {
      setLikedPostIds([...likedPostIds, postId]);
      setPostStats(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          views: prev[postId]?.views ?? DEFAULT_POSTS.find(p => p.id === postId)?.views ?? 0,
          likes: currentLikes + 1,
        }
      }));
    }
  };

  const toggleTag = (tag: string): void => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setCurrentPage(1);
  };

  const getApplicantStatus = (applicantId: string): "approved" | "rejected" | "pending" => {
    if (approvedApplicants.includes(applicantId)) return "approved";
    if (rejectedApplicants.includes(applicantId)) return "rejected";
    return "pending";
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent): void => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-sort')) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Data Processing
  const allPosts: Post[] = [...userPosts, ...DEFAULT_POSTS,].map(post => ({
    ...post,
    views: getPostStats(post.id).views,
    likes: getPostStats(post.id).likes,
  }));

  // Special filter modes
  const isLikedOnlyMode = sortBy === "liked-only";
  const isRemovedOnlyMode = sortBy === "removed-only";

  const filteredPosts = allPosts.filter((post) => {
    if (isLikedOnlyMode) return likedPostIds.includes(post.id);
    if (isRemovedOnlyMode) return removedPosts.includes(post.id);

    if (removedPosts.includes(post.id)) return false;
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => post.tags.includes(tag));
    const matchesLocation = locationFilter === "" ||
      post.destination.toLowerCase().includes(locationFilter.toLowerCase()) ||
      post.from.toLowerCase().includes(locationFilter.toLowerCase()) ||
      post.to.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesDate = !dateFilter ||
      post.dates.start >= dateFilter.toISOString().split("T")[0] ||
      post.dates.end >= dateFilter.toISOString().split("T")[0];
    const matchesGender = genderFilter === "전체" || post.gender === genderFilter || post.gender === "무관";
    const matchesAge = ageFilter === "전체" || post.ageGroup === ageFilter;
    return matchesTags && matchesLocation && matchesDate && matchesGender && matchesAge;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (isLikedOnlyMode || isRemovedOnlyMode) return 0;
    switch (sortBy) {
      case "budget-high": return b.budgetNumber - a.budgetNumber;
      case "budget-low": return a.budgetNumber - b.budgetNumber;
      case "views": return b.views - a.views;
      case "likes": return b.likes - a.likes;
      default: return 0;
    }
  });

  const POSTS_PER_PAGE = 5;
  const visiblePosts = sortedPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);


  // 1:1 채팅 찾기 또는 생성
  const getOrCreateOneOnOneChat = (postId: string, postAuthor: Author): OneOnOneChat => {
    const existing = oneOnOneChats.find(
      chat => chat.postId === postId && 
      chat.applicantId === CURRENT_USER.email
    );
    
    if (existing) return existing;
    
    const newChat: OneOnOneChat = {
      id: `chat-1on1-${Date.now()}`,
      postId,
      postAuthorId: postAuthor.email,
      applicantId: CURRENT_USER.email,
      messages: [],
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
    };
    
    setOneOnOneChats([...oneOnOneChats, newChat]);
    return newChat;
  };

  // 그룹 채팅 찾기
  const getGroupChat = (postId: string): GroupChat | null => {
    return groupChats.find(chat => chat.postId === postId) || null;
  };

  // 그룹 채팅 생성 (승인 시 자동 생성)
  const createGroupChat = (post: Post, approvedMembers: Author[]): GroupChat => {
    const existingChat = groupChats.find(chat => chat.postId === post.id);
    
    if (existingChat) {
      // 이미 있으면 멤버만 업데이트
      const updatedChat = {
        ...existingChat,
        members: approvedMembers,
      };
      setGroupChats(groupChats.map(chat => 
        chat.postId === post.id ? updatedChat : chat
      ));
      return updatedChat;
    }
    
    const newGroupChat: GroupChat = {
      id: `chat-group-${Date.now()}`,
      postId: post.id,
      postDestination: post.destination,
      postDates: post.dates,
      members: approvedMembers,
      messages: [],
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
    };
    
    setGroupChats([...groupChats, newGroupChat]);
    return newGroupChat;
  };

  // 1:1 채팅 메시지 전송
  const sendOneOnOneMessage = (chatId: string, content: string): void => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: CURRENT_USER.email,
      senderName: CURRENT_USER.name,
      senderAvatar: CURRENT_USER.avatar,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    
    setOneOnOneChats(oneOnOneChats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessageAt: new Date().toISOString(),
        };
      }
      return chat;
    }));
  };

  // 그룹 채팅 메시지 전송
  const sendGroupMessage = (chatId: string, content: string): void => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: CURRENT_USER.email,
      senderName: CURRENT_USER.name,
      senderAvatar: CURRENT_USER.avatar,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    
    setGroupChats(groupChats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessageAt: new Date().toISOString(),
        };
      }
      return chat;
    }));
  };

  // 1:1 채팅 열기
  const openOneOnOneChat = (post: Post): void => {
    const chat = getOrCreateOneOnOneChat(post.id, post.author);
    setActiveChatId(chat.id);
    setActiveChatType("one-on-one");
    setShowChatModal(true);
  };

  // 그룹 채팅 열기
  const openGroupChat = (postId: string): void => {
    const chat = getGroupChat(postId);
    if (chat) {
      setActiveChatId(chat.id);
      setActiveChatType("group");
      setShowChatModal(true);
    }
  };

  // 채팅 닫기
  const closeChatModal = (): void => {
    setShowChatModal(false);
    setActiveChatId(null);
    setActiveChatType(null);
  };
  // Event Handlers
  const handleCardClick = (post: Post): void => {
    incrementViews(post.id);
    setSelectedPost({ ...post, views: getPostStats(post.id).views + 1 });
  };

  const handleLike = (postId: string, e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    toggleLike(postId);
  };

  const handleRemove = (postId: string, e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setRemovedPosts([...removedPosts, postId]);
  };

  const handleRestore = (postId: string, e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setRemovedPosts(removedPosts.filter(id => id !== postId));
  };

  const handleApply = (): void => {
    setShowApplyMessage(true);
  };

  const handleSendApplication = (post: Post): void => {
    const newApplication: MyApplication = {
      id: `app-${Date.now()}`,
      postId: post.id,
      postDestination: post.destination,
      postDates: post.dates,
      postAuthor: post.author,
      applicant: {
        ...CURRENT_USER,
        message: applyMessage,
        preferredActivities: selectedTravelTypes.length > 0 ? selectedTravelTypes : ["미정"],
        budget: post.budget,
        appliedDate: new Date().toISOString().split("T")[0],
      },
    };

    setMyApplications([...myApplications, newApplication]);
    setSelectedPost(null);
    setRemovedPosts([...removedPosts, post.id]);
    setShowApplyMessage(false);
    setApplyMessage("");
  };

  const handleCloseDetailModal = (): void => {
    setSelectedPost(null);
    setShowApplyMessage(false);
    setApplyMessage("");
  };

  const handleCancelApply = (): void => {
    setShowApplyMessage(false);
    setApplyMessage("");
  };

  const handleResetAll = (): void => {
    setRemovedPosts([]);
    setSelectedTags([]);
    setLocationFilter("");
    setDateFilter(null);
    setGenderFilter("전체");
    setAgeFilter("전체");
    setSortBy("default");
    setCurrentPage(1);
  };

  const handlePostSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newPostId = `user-${Date.now()}`;
    const newPost: Post = {
      id: newPostId,
      author: CURRENT_USER,
      from: "SEL",
      to: (formData.get("destination") as string)?.slice(0, 3).toUpperCase() || "???",
      destination: (formData.get("destination") as string) || "",
      dates: {
        start: startDate ? startDate.toISOString().split("T")[0] : "",
        end: endDate ? endDate.toISOString().split("T")[0] : "",
      },
      duration: startDate && endDate 
        ? `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))}박 ${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1}일`
        : "",
      participants: { current: 1, max: parseInt((formData.get("participants") as string)?.split("/")[1]) || 4 },
      tags: [...selectedTransport, ...selectedTravelTypes],
      gender: selectedGender,
      ageGroup: selectedAgeGroups[0] || "20대",
      description: (formData.get("description") as string) || "",
      budget: (formData.get("budget") as string) || "$0",
      budgetNumber: parseInt((formData.get("budget") as string)?.replace(/\D/g, "") || "0"),
      travelStyle: selectedTravelTypes,
      views: 0,
      likes: 0,
    };

    setUserPosts([newPost, ...userPosts]);
    setPostStats(prev => ({ ...prev, [newPostId]: { views: 0, likes: 0 } }));
    setShowWriteModal(false);
    setStartDate(null);
    setEndDate(null);
    setSelectedTransport([]);
    setSelectedTravelTypes([]);
    setSelectedAgeGroups([]);
    setSelectedGender("무관");
  };

  const handleApprove = (applicantId: string, e?: MouseEvent<HTMLButtonElement>): void => {
  e?.stopPropagation();
    if (!approvedApplicants.includes(applicantId)) {
      setApprovedApplicants([...approvedApplicants, applicantId]);
      setRejectedApplicants(rejectedApplicants.filter(id => id !== applicantId));
      
      // 승인된 신청자 찾기
      const application = receivedApplications.find(app => app.id === applicantId);
      if (application) {
        // 해당 게시물 찾기
        const post = allPosts.find(p => p.id === application.postId);
        if (post) {
          // 승인된 모든 멤버 수집
          const approvedApps = receivedApplications.filter(app => 
            app.postId === application.postId && 
            approvedApplicants.includes(app.id)
          );
          const approvedMembers = [
            post.author, // 방장
            ...approvedApps.map(app => ({
              name: app.applicant.name,
              age: app.applicant.age,
              gender: app.applicant.gender,
              avatar: app.applicant.avatar,
              email: app.applicant.email,
              travelStyle: app.applicant.travelStyle,
            }))
          ];
          
          // 그룹 채팅 생성 또는 업데이트
          createGroupChat(post, approvedMembers);
        }
      }
    }
  };

  const handleReject = (applicantId: string, e?: MouseEvent<HTMLButtonElement>): void => {
    e?.stopPropagation();
    if (!rejectedApplicants.includes(applicantId)) {
      setRejectedApplicants([...rejectedApplicants, applicantId]);
      setApprovedApplicants(approvedApplicants.filter(id => id !== applicantId));
    }
  };

  const hasActiveFilters = removedPosts.length > 0 || selectedTags.length > 0 || 
    locationFilter || dateFilter || genderFilter !== "전체" || ageFilter !== "전체" ||
    sortBy === "liked-only" || sortBy === "removed-only";

  return {
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
    
    // Modal States
    selectedPost, setSelectedPost,
    showWriteModal, setShowWriteModal,
    showApplicantsModal, setShowApplicantsModal,
    showReceivedModal, setShowReceivedModal,
    selectedApplicant, setSelectedApplicant,
    showApplyMessage,
    applyMessage, setApplyMessage,
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
    
    // Handlers
    handleCardClick,
    handleLike,
    handleRemove,
    handleRestore,
    handleApply,
    handleSendApplication,
    handleCloseDetailModal,
    handleCancelApply,
    handleResetAll,
    handlePostSubmit,
    handleApprove,
    handleReject,

    // 채팅 관련
    allPosts,
    oneOnOneChats,
    groupChats,
    showChatModal,
    activeChatType,
    activeChatId,
    openOneOnOneChat,
    openGroupChat,
    closeChatModal,
    sendOneOnOneMessage,
    sendGroupMessage,
    getOrCreateOneOnOneChat,
    getGroupChat,
    leaveOneOnOneChat,
    leaveGroupChat,
  };
}
