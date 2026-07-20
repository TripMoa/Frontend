import { useState, useEffect } from "react";
import * as storyAPI from "../../../api/stories.api";
import { useNavigate } from "react-router-dom";
import * as draftAPI from "../../../api/drafts.api";
import { getMyInfo } from "../../../api/auth.api";
import { useAuth } from "../../user/pages/AuthContext";
import { createDraft } from "../../../api/drafts.api";
import { getStories } from "../../../api/stories.api";
import { getTravelStyles } from "../../../api/auth.api";
import type { TravelStyleOption } from "../../../types/auth.types";
import type { Story } from "../../../api/stories.api";
import Filter from "badwords-ko";
const filter = new Filter();


interface Draft {
  id: number;
  title: string;
  content: string;
  date: string;
}

function useTravelStory() {

  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();

  // 현재 페이지 상태 - URL 경로에서 복원
  const [currentPage, setCurrentPageState] = useState(() => {
    const path = window.location.pathname;
    if (path.includes("/write") || path.includes("/edit")) return "write";
    if (path.includes("/detail")) return "detail";
    if (path.includes("/mystories")) return "myStories";
    return "main";
  });

  const [previousPage, setPreviousPage] = useState("main");

  // 선택된 스토리 ID - localStorage에서 복원 (새로고침 대응)
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedStoryId");
    return saved ? parseInt(saved) : null;
  });

  // 스토리 목록 필터 상태
  const [filters, setFilters] = useState({
    searchTerm: "",
    destination: "",
    duration: "",
    minBudget: "",
    maxBudget: "",
    tags: [] as number[],
  });

  const [myStories, setMyStories] = useState<Story[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [drafts, setDraftsState] = useState<Draft[]>([]);
  const [likedStories, setLikedStories] = useState<number[]>([]);
  const [followedStories, setFollowedStories] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [currentDraft, setCurrentDraft] = useState<any>(null);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingStoryId, setDeletingStoryId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<"FREE" | "REVIEW" | "ALL">("ALL");
  const [writeType, setWriteType] = useState<"FREE" | "REVIEW">("FREE");
  const [tags, setTags] = useState<TravelStyleOption[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [pageState, setPageState] = useState<any>(null);
  const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);


  // 앱 최초 진입 시 전체 스토리 로드 (비로그인도 가능)
  useEffect(() => {
    loadAllStories();
  }, []);

  useEffect(() => {
  const fetchTags = async () => {
    try {
      const res = await getTravelStyles();
      setTags(res.data);
    } catch (e) {
      console.error("태그 가져오기 실패", e);
    }
  };

  fetchTags();
}, []);


useEffect(() => {
  const fetchStories = async () => {
    try {
      const res = await getStories();
      setStories(res.data);
    } catch (e) {
      console.error("스토리 불러오기 실패", e);
    }
  };

  fetchStories();
}, []);

  // 로그인 상태가 확인된 후 인증 필요한 데이터 로드
  useEffect(() => {
    if (!isAuthenticated) {
      setMyStories([]);
      setDraftsState([]);
      setLikedStories([]);
      setFollowedStories([]);
      setCurrentUser(null);
      return;
    }
    loadMyStories();
    loadDrafts();
    loadLikedStories();
    loadFollowedStories();
  }, [isAuthenticated]);

  // 전체 스토리, 내 스토리, 현재 유저 정보를 병렬로 로드
  const loadAllStories = async () => {
    try {
      setLoading(true);
      const allRes = await storyAPI.getStories();
      setAllStories(allRes.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "여행기를 불러오는데 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 내 스토리 + 현재 유저 정보 로드 (로그인 필요)
  const loadMyStories = async () => {
    try {
      const [myRes, meRes] = await Promise.all([
        storyAPI.getMyStories(),
        getMyInfo(),
      ]);
      setMyStories(myRes.data);
      setCurrentUser(meRes.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "내 여행기를 불러오는데 실패했습니다.",
      );
    }
  };

  // 임시저장 목록 로드 (description을 content 필드로 변환하여 저장)
  const loadDrafts = async () => {
    try {
      const response = await draftAPI.getDrafts();
      const draftsWithContent = response.data.map((draft: any) => ({
        ...draft,
        content: draft.description,
      }));
      setDraftsState(draftsWithContent);
    } catch (err) {
      console.error("Draft 로드 실패:", err);
    }
  };

  // 좋아요한 스토리 ID 목록 로드
  const loadLikedStories = async () => {
    try {
      const response = await storyAPI.getLikedStories();
      const likedIds = response.data.map((story: Story) => story.id);
      setLikedStories(likedIds);
    } catch (err) {}
  };

  // 저장한 일정 ID 목록 로드
  const loadFollowedStories = async () => {
    try {
      const response = await storyAPI.getSavedItineraries();
      const followedIds = response.data.map((story: Story) => story.id);
      setFollowedStories(followedIds);
    } catch (err) {}
  };

  // 선택된 스토리 객체 - allStories 또는 myStories에서 탐색
  const selectedStory = selectedStoryId
    ? allStories.find((s) => s.id === selectedStoryId) ||
      myStories.find((s) => s.id === selectedStoryId) ||
      null
    : null;

  // 선택된 스토리를 상태 및 localStorage에 동기화
  const setSelectedStory = (story: any) => {
    if (story) {
      setSelectedStoryId(story.id);
      localStorage.setItem("selectedStoryId", story.id.toString());
    } else {
      setSelectedStoryId(null);
      localStorage.removeItem("selectedStoryId");
    }
  };


  // 커스텀 알럿 표시
  const showCustomAlert = (message: string, onConfirm?: () => void) => {
  setAlertMessage(message);
  setShowAlert(true);
  if (onConfirm) {
    // 알럿 닫힐 때 콜백 실행
    setAlertCallback(() => onConfirm);
  }
};

  // 커스텀 알럿 닫기
  const closeAlert = () => {
  setShowAlert(false);
  setAlertMessage("");
  if (alertCallback) {
    alertCallback();
    setAlertCallback(null);
  }
};

  // 페이지 이동 및 URL 해시, localStorage 동기화
  const setCurrentPage = (page: string) => {
  setCurrentPageState(page);
  const pathMap: Record<string, string> = {
    main: "/travelstory",
    write: "/travelstory/write",
    detail: "/travelstory/detail",
    myStories: "/travelstory/mystories",
  };
  navigate(pathMap[page] || "/travelstory");
};

  // 페이지 이동 시 write 페이지를 벗어나면 편집 상태 초기화
  const navigateToPage = (newPage: string, state?: any) => {
    if (currentPage === "write" && newPage !== "write") {
      setCurrentDraftId(null);
      setCurrentDraft(null);
      setEditingStory(null);
    }
    if (currentPage !== newPage) {
      setPreviousPage(currentPage);
    }
    setCurrentPageState(newPage);
    setPageState(state);
    
    const pathMap: Record<string, string> = {
      main: "/travelstory",
      write: "/travelstory/write",
      myStories: "/travelstory/mystories",
    };
    
    // detail은 URL 변경 없이 상태로만 관리
    if (newPage !== "detail") {
      navigate(pathMap[newPage] || "/travelstory");
    }
  };

  // 이전 페이지로 이동 및 편집/선택 상태 초기화
  const goBack = () => {
  const reviewFrom = localStorage.getItem("reviewFrom");
  if (reviewFrom === "mytrips") {
    localStorage.removeItem("reviewFrom");
    localStorage.removeItem("currentPage");
    window.location.href = "/mytrips";
    return;
  }

  const targetPage = previousPage || "main";
  setCurrentPage(targetPage);
  setCurrentDraftId(null);
  setCurrentDraft(null);
  setEditingStory(null);
  setSelectedStory(null);
  setPreviousPage("main");
  if (currentPage === "write" && isAuthenticated) {
    loadDrafts();
  }
};

  // 필터 조건에 맞는 스토리 목록 반환
  const getFilteredStories = () => {
    return allStories.filter((story) => {
      const matchesSearch =
        !filters.searchTerm ||
        story.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        story.description
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase());

      const dest = filters.destination;
      const matchesDestination =
        !dest || dest === "" || dest === "전체"
          ? true
          : story.destination?.toLowerCase().includes(dest.toLowerCase());

      const matchesDuration =
        !filters.duration || filters.duration === "전체"
          ? true
          : story.duration === filters.duration;

      // 예산 범위 필터 (원 단위)
      const budget = parseInt(story.budget) || 0;
      const matchesBudget = (() => {
        switch (filters.minBudget) {
          case "":
          case "전체":
            return true;
          case "10만원 이하":
            return budget <= 100000;
          case "10-30만원":
            return budget > 100000 && budget <= 300000;
          case "30-50만원":
            return budget > 300000 && budget <= 500000;
          case "50-100만원":
            return budget > 500000 && budget <= 1000000;
          case "100만원 이상":
            return budget > 1000000;
          default:
            return true;
        }
      })();

      // 태그 필터 - 문자열/배열 모두 대응
      const matchesTags =
        filters.tags.length === 0 ||
        filters.tags.some((tagId) => {
          const storyTags = story.tags as string | string[];
          if (!storyTags) return false;

          const tagName = tags.find(
            (t: TravelStyleOption) => t.id === tagId
          )?.name;

          if (!tagName) return false;

          if (typeof storyTags === "string")
            return storyTags.includes(tagName);

          if (Array.isArray(storyTags))
            return (storyTags as string[]).includes(tagName);

          return false;
        });

      return (
        matchesSearch &&
        matchesDestination &&
        matchesDuration &&
        matchesBudget &&
        matchesTags
      );
    });
  };

  // 스토리 클릭 시 상세 페이지로 이동
  const handleStoryClick = (story: any) => {
    setSelectedStory(story);
     setCurrentPageState("detail");
    navigate(`/travelstory/detail/${story.id}`);
  };

  // 스토리 수정 - 최신 데이터를 API에서 직접 조회 후 편집 페이지로 이동
  const handleEdit = async (story: any) => {
    try {
      setLoading(true);
      const response = await storyAPI.getStory(story.id);
      setEditingStory(response.data);
      setWriteType(response.data.type === "FREE" ? "FREE" : "REVIEW");
      setPreviousPage("myStories");
      navigate(`/travelstory/edit/${story.id}`);
    } catch (err: any) {
      showCustomAlert("여행기를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 스토리 삭제 확인 모달 표시
  const handleDelete = (id: number) => {
    setDeletingStoryId(id);
    setShowDeleteModal(true);
  };

  // 스토리 삭제 확정 처리
  const confirmDelete = async () => {
    if (!deletingStoryId) return;
    try {
      setLoading(true);
      await storyAPI.deleteStory(deletingStoryId);
      setMyStories(myStories.filter((story) => story.id !== deletingStoryId));
      setAllStories(allStories.filter((story) => story.id !== deletingStoryId));
      setStories(prev => prev.filter((story) => story.id !== deletingStoryId));
      showCustomAlert("여행기가 삭제되었습니다.");
    } catch (err: any) {
      showCustomAlert(err.response?.data?.message || "삭제에 실패했습니다.");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeletingStoryId(null);
    }
  };

  // 스토리 발행 - DOM에서 에디터 데이터를 수집하여 생성/수정 API 호출
  const handlePublish = async () => {
    const titleInput = document.querySelector(
      ".title-input",
    ) as HTMLInputElement;
    const destinationInput = document.querySelector(
      ".form-input",
    ) as HTMLInputElement;
    const durationSelect = document.querySelector(
      ".form-select",
    ) as HTMLSelectElement;
    const departureDateInput = document.querySelectorAll(
      ".form-input",
    )[1] as HTMLInputElement;
    const editor = document.querySelector(
      ".blog-editor-wysiwyg",
    ) as HTMLDivElement;

    const coverImage =
      (window as any).selectedCoverImageForPublish ||
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800";
    const uploadedImages = (window as any).uploadedImagesForPublish || [];
    const limitedImages = uploadedImages.slice(0, 5);
    const finalImages = limitedImages.length > 0 ? limitedImages : [coverImage];

    const publishData = (window as any).publishData;


    // 금칙어 필터링
    const editorText = editor?.innerText || "";
    if (
      filter.isProfane(titleInput?.value || "") ||
      filter.isProfane(editorText)
    ) {
      showCustomAlert("부적절한 단어가 포함되어 있습니다.");
      return;
    }

    const tags = publishData?.tags
      ? publishData.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter((t: string) => t)
      : [];

    const storyData = {
      title: titleInput?.value || "제목 없음",
      description: editor?.innerHTML || "내용 없음",
      imageUrl: coverImage,
      images: finalImages,
      destination: destinationInput?.value || "미정",
      duration: publishData?.duration || "선택하세요",
      departureDate: publishData?.departureDate || null,
      budget: publishData?.budget || "0",
      tags: tags,
      type: publishData?.type || "FREE",
      isPublic: publishData?.isPublic ?? true,
      tripId: publishData?.tripId || null,

      // 경비 항목 개별 필드로 전달
      transportation: publishData?.expenses
        ? JSON.parse(publishData.expenses).transportation
        : null,
      accommodation: publishData?.expenses
        ? JSON.parse(publishData.expenses).accommodation
        : null,
      food: publishData?.expenses
        ? JSON.parse(publishData.expenses).food
        : null,
      attraction: publishData?.expenses
        ? JSON.parse(publishData.expenses).attraction
        : null,
      shopping: publishData?.expenses
        ? JSON.parse(publishData.expenses).shopping
        : null,
    };

    try {
      setLoading(true);
      if (editingStory) {
        // 수정 모드
        const response = await storyAPI.updateStory(editingStory.id, storyData);
        setMyStories(
          myStories.map((story) =>
            story.id === editingStory.id ? response.data : story,
          ),
        );
        showCustomAlert("여행기가 수정되었습니다.", () => {  
          setEditingStory(null);
          setCurrentDraftId(null);
          navigateToPage(previousPage === "myStories" ? "myStories" : "main");
          setPreviousPage("main");
        });
      } else {
        // 신규 발행
        const response = await storyAPI.createStory(storyData);
        setMyStories([...myStories, response.data]);
        setAllStories([...allStories, response.data]);
        setStories(prev => [response.data, ...prev]);
        showCustomAlert("여행기가 발행되었습니다.", () => {
          setEditingStory(null);
          setCurrentDraftId(null);
          navigateToPage(previousPage === "myStories" ? "myStories" : "main");
          setPreviousPage("main");
        });
      }
    } catch (err: any) {
      showCustomAlert(err.response?.data?.message || "발행에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 임시저장 - DOM에서 에디터 데이터를 수집하여 생성/수정 API 호출
  const handleSaveDraft = async () => {
    const titleInput = document.querySelector(
      ".title-input",
    ) as HTMLInputElement;
    const destinationInput = document.querySelector(
      ".form-input",
    ) as HTMLInputElement;
    const durationSelect = document.querySelector(
      ".form-select",
    ) as HTMLSelectElement;
    const departureDateInput = document.querySelectorAll(
      ".form-input",
    )[1] as HTMLInputElement;
    const editor = document.querySelector(
      ".blog-editor-wysiwyg",
    ) as HTMLDivElement;

    const title = titleInput?.value?.trim() || "";
    const content = editor?.innerHTML?.trim() || "";
    const destination = destinationInput?.value?.trim() || "";
    const duration = durationSelect?.value || "";
    const departureDate = departureDateInput?.value || "";


    if (!title && !content) {
      showCustomAlert("제목과 본문을 작성해주세요.");
      return;
    }

    const coverImage = (window as any).selectedCoverImageForPublish || "";
    const uploadedImages = (window as any).uploadedImagesForPublish || [];
    const publishData = (window as any).publishData;

    const tags = publishData?.tags || "";
    const budget = publishData?.budget || "0";
    const expensesJson = publishData?.expenses || "";

    const draftData = {
      title,
      description: content,
      destination,
      duration,
      departureDate,
      budget,
      tags,
      images: uploadedImages.length > 0 ? uploadedImages.join(",") : null,
      imageUrl: coverImage,
      expenses: expensesJson,
      type: selectedType === "ALL" ? "FREE" : selectedType
    };


    try {
      setLoading(true);
      if (currentDraftId) {
        // 기존 임시저장 수정
        const response = await draftAPI.updateDraft(currentDraftId, draftData);
        setDraftsState(
          drafts.map((d) => (d.id === currentDraftId ? response.data : d)),
        );
      } else {
        // 새 임시저장 생성
        const response = await draftAPI.createDraft(draftData);
        setDraftsState([response.data, ...drafts]);
        setCurrentDraftId(response.data.id);
      }
      showCustomAlert("임시저장되었습니다.");
    } catch (err: any) {
      console.error("임시저장 실패:", err);
      showCustomAlert(
        err.response?.data?.message || "임시저장에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 임시저장 삭제
  const deleteDraft = async (draftId: number) => {
    try {
      await draftAPI.deleteDraft(draftId);
      setDraftsState(drafts.filter((d) => d.id !== draftId));
    } catch (err: any) {
      throw err;
    }
  };

  // 함수형 업데이트를 지원하는 drafts setter 래퍼
  const setDrafts = (newDrafts: Draft[] | ((prev: Draft[]) => Draft[])) => {
    if (typeof newDrafts === "function") {
      setDraftsState((prev) => newDrafts(prev));
    } else {
      setDraftsState(newDrafts);
    }
  };

  // 일정 저장/취소 토글 및 follows 카운트 로컬 반영
  const toggleFollow = async (storyId: number) => {
    const isFollowed = followedStories.includes(storyId);
    try {
      if (isFollowed) {
        await storyAPI.unsaveItinerary(storyId);
        setFollowedStories((prev) => prev.filter((id) => id !== storyId));
      } else {
        await storyAPI.saveItinerary(storyId);
        setFollowedStories((prev) => [...prev, storyId]);
      }
      setMyStories((prev) =>
        prev.map((story) =>
          story.id === storyId
            ? {
                ...story,
                follows: isFollowed ? story.follows - 1 : story.follows + 1,
              }
            : story,
        ),
      );
    } catch (err) {
      showCustomAlert("저장 처리에 실패했습니다.");
    }
  };

  // 좋아요 토글 및 likes 카운트 로컬 반영
  const toggleLike = async (storyId: number) => {
    try {
      const response = await storyAPI.toggleLike(storyId);
      const isNowLiked = response.data;

      if (isNowLiked) {
        setLikedStories((prev) => [...prev, storyId]);
      } else {
        setLikedStories((prev) => prev.filter((id) => id !== storyId));
      }

      setMyStories((prev) =>
        prev.map((story) =>
          story.id === storyId
            ? {
                ...story,
                likes: isNowLiked ? story.likes + 1 : story.likes - 1,
                isLiked: isNowLiked,
              }
            : story,
        ),
      );
    } catch (err) {
      showCustomAlert("좋아요 처리에 실패했습니다.");
    }
  };

  // 조회수 증가 및 전체 스토리 목록에 즉시 반영
  const incrementViews = async (storyId: number) => {
    try {
      await storyAPI.incrementStoryViews(storyId);
      setMyStories((prev) =>
        prev.map((story) =>
          story.id === storyId ? { ...story, views: story.views + 1 } : story,
        ),
      );
      setAllStories((prev) =>  
      prev.map((story) =>
        story.id === storyId ? { ...story, views: story.views + 1 } : story,
      ),
    );
    setStories((prev) =>  
      prev.map((story) =>
        story.id === storyId ? { ...story, views: story.views + 1 } : story,
      ),
    );
    } catch (err) {}
  };

  return {
    currentPage,
    previousPage,
    selectedStory,
    filters,
    allStories,
    likedStories,
    followedStories,
    showAlert,
    alertMessage,
    showDraftModal,
    showLikesModal,
    drafts,
    editingStory,
    showDeleteModal,
    currentDraft,
    currentDraftId,
    myStories,
    loading,
    error,
    currentUser,
    setCurrentPage,
    setSelectedStory,
    setFilters,
    setLikedStories,
    setFollowedStories,
    setShowDraftModal,
    setShowLikesModal,
    setDrafts,
    setEditingStory,
    setShowDeleteModal,
    setCurrentPageState,
    setCurrentDraft,
    setCurrentDraftId,
    setMyStories,
    navigateToPage,
    goBack,
    showCustomAlert,
    closeAlert,
    getFilteredStories,
    handleStoryClick,
    handleEdit,
    handleDelete,
    confirmDelete,
    handlePublish,
    handleSaveDraft,
    toggleLike,
    toggleFollow,
    incrementViews,
    loadMyStories,
    loadDrafts,
    deleteDraft,
    tags,
    stories,
    pageState,
    writeType,
    setWriteType,
    selectedType,
    setSelectedType,
    setPreviousPage,
  };
}

export default useTravelStory;