import { useState, useEffect } from 'react';

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

// 전체 여행기 데이터 (메인 페이지용 - 다양한 작성자)
const allStoriesData = [
  {
    id: 1,
    title: "강릉 바다 힐링 3박4일",
    description: "동해의 푸른 바다와 함께한 힐링 여행",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
    author: "여행러버",
    authorAvatar: "여",
    destination: "강릉",
    duration: "3박4일",
    budget: "500000",
    departureDate: "2024-03-15",
    date: "2023.1.28",
    likes: 128,
    comments: 45,
    bookmarks: 89,
    follows: 34,
    views: "120",
    tags: ["힐링여행", "바다", "맛집투어"]
  },
  {
    id: 2,
    title: "경주 역사 탐방 2박3일",
    description: "천년 고도 경주의 역사와 문화를 체험하다",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
    author: "역사덕후",
    authorAvatar: "역",
    destination: "경주",
    duration: "2박3일",
    budget: "328000",
    departureDate: "2024-02-10",
    date: "2023.2.15",
    likes: 95,
    comments: 23,
    bookmarks: 67,
    follows: 28,
    views: "85",
    tags: ["문화탐방", "역사", "사진명소"]
  },
  {
    id: 3,
    title: "제주도 완전정복 4박5일",
    description: "제주의 숨은 명소와 맛집을 찾아서",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
    author: "제주매니아",
    authorAvatar: "제",
    destination: "제주",
    duration: "4박5일",
    budget: "850000",
    departureDate: "2024-03-01",
    date: "2023.3.10",
    likes: 203,
    comments: 67,
    bookmarks: 145,
    follows: 56,
    views: "156",
    tags: ["자연", "맛집투어", "렌터카"]
  },
  {
    id: 4,
    title: "부산 해운대 맛집투어",
    description: "부산의 숨은 맛집들을 찾아다닌 여행",
    image: "https://images.unsplash.com/photo-1583470790878-4f89a7bf9b7f?w=800",
    author: "맛집헌터",
    authorAvatar: "맛",
    destination: "부산",
    duration: "2박3일",
    budget: "420000",
    departureDate: "2024-02-20",
    date: "2023.2.25",
    likes: 167,
    comments: 52,
    bookmarks: 98,
    follows: 41,
    views: "134",
    tags: ["맛집투어", "해변", "도시여행"]
  },
  {
    id: 5,
    title: "전주 한옥마을 당일치기",
    description: "전주 비빔밥과 한옥마을의 매력",
    image: "https://images.unsplash.com/photo-1583474679704-34e8e3a6c180?w=800",
    author: "한식러버",
    authorAvatar: "한",
    destination: "전주",
    duration: "당일치기",
    budget: "150000",
    departureDate: "2024-03-05",
    date: "2023.3.08",
    likes: 82,
    comments: 19,
    bookmarks: 45,
    follows: 22,
    views: "67",
    tags: ["문화탐방", "맛집투어", "가성비"]
  }
];

// 내 여행기 데이터 (마이 스토리 페이지용 - 모두 같은 작성자)
const myStoriesData = [
  {
    id: 101,
    title: "강릉 바다 힐링 3박4일",
    description: "동해의 푸른 바다와 함께한 힐링 여행. 정동진 해돋이부터 주문진 수산시장까지, 강릉의 모든 것을 경험했습니다.",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
    author: "채원",
    authorAvatar: "채",
    destination: "강릉",
    duration: "3박4일",
    budget: "500000",
    departureDate: "2024-03-15",
    date: "2023.1.28",
    likes: 128,
    comments: 45,
    bookmarks: 89,
    follows: 34,
    views: "120",
    tags: ["힐링여행", "바다", "맛집투어"]
  },
  {
    id: 102,
    title: "경주 역사 탐방 2박3일",
    description: "천년 고도 경주의 역사와 문화를 체험하다. 불국사, 석굴암, 첨성대 등 역사적인 장소들을 둘러보았습니다.",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
    author: "채원",
    authorAvatar: "채",
    destination: "경주",
    duration: "2박3일",
    budget: "328000",
    departureDate: "2024-02-10",
    date: "2023.2.15",
    likes: 95,
    comments: 23,
    bookmarks: 67,
    follows: 28,
    views: "85",
    tags: ["문화탐방", "역사", "사진명소"]
  },
  {
    id: 103,
    title: "제주도 완전정복 4박5일",
    description: "제주의 숨은 명소와 맛집을 찾아서. 한라산 등반부터 우도 여행까지 알찬 일정이었습니다.",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
    author: "채원",
    authorAvatar: "채",
    destination: "제주",
    duration: "4박5일",
    budget: "850000",
    departureDate: "2024-03-01",
    date: "2023.3.10",
    likes: 203,
    comments: 67,
    bookmarks: 145,
    follows: 56,
    views: "156",
    tags: ["자연", "맛집투어", "렌터카"]
  }
];

function useTravelStory() {
  const [currentPage, setCurrentPage] = useState('main');
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    destination: '',
    duration: '',
    minBudget: '',
    maxBudget: '',
    tags: [] as string[]
  });
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [likedStories, setLikedStories] = useState<number[]>([]);
  const [followedStories, setFollowedStories] = useState<number[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<any>(null);
  const [deletingStoryId, setDeletingStoryId] = useState<number | null>(null);
  const [newStories, setNewStories] = useState<any[]>([]);

  // 브라우저 히스토리 관리
  useEffect(() => {
    // 초기 상태 설정
    const initialState = { page: 'main' };
    window.history.replaceState(initialState, '', window.location.href);

    // 브라우저 뒤로가기/앞으로가기 이벤트 리스너
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        if (event.state.story) {
          setSelectedStory(event.state.story);
        }
      } else {
        // 상태가 없으면 메인으로
        setCurrentPage('main');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const showCustomAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
    }, 2000);
  };

  // 페이지 이동 시 브라우저 히스토리에 추가
  const navigateToPage = (newPage: string, story?: any) => {
    const state = { page: newPage, story: story || null };
    window.history.pushState(state, '', window.location.href);
    setCurrentPage(newPage);
    if (story) {
      setSelectedStory(story);
    }
  };

  // 뒤로가기 - 브라우저 히스토리 사용
  const goBack = () => {
    window.history.back();
  };

  // 네비게이션 바에서 직접 페이지 설정 (히스토리 추가)
  const setPageDirectly = (page: string) => {
    const state = { page: page };
    window.history.pushState(state, '', window.location.href);
    setCurrentPage(page);
    setSelectedStory(null);
  };

  const getFilteredStories = () => {
    let stories = currentPage === 'myStories' 
      ? [...myStoriesData, ...newStories]
      : [...allStoriesData, ...newStories];
    
    return stories.filter((story) => {
      const matchesSearch = story.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                          story.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesDestination = !filters.destination || story.destination === filters.destination;
      const matchesDuration = !filters.duration || story.duration === filters.duration;
      const matchesBudget = (!filters.minBudget || parseInt(story.budget) >= parseInt(filters.minBudget)) &&
                           (!filters.maxBudget || parseInt(story.budget) <= parseInt(filters.maxBudget));
      const matchesTags = filters.tags.length === 0 || 
                         filters.tags.some(tag => story.tags.includes(tag));

      return matchesSearch && matchesDestination && matchesDuration && matchesBudget && matchesTags;
    });
  };

  const handleStoryClick = (story: any) => {
    navigateToPage('detail', story);
  };

  const handleEdit = (story: any) => {
    setEditingStory(story);
    navigateToPage('write');
  };

  const handleDelete = (id: number) => {
    setDeletingStoryId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deletingStoryId) {
      setNewStories(newStories.filter(story => story.id !== deletingStoryId));
      showCustomAlert('여행기가 삭제되었습니다.');
    }
    setShowDeleteModal(false);
    setDeletingStoryId(null);
  };

  const handlePublish = () => {
    const titleInput = document.querySelector('.title-input') as HTMLInputElement;
    const destinationInput = document.querySelector('.form-input') as HTMLInputElement;
    const durationSelect = document.querySelector('.form-select') as HTMLSelectElement;
    const budgetInput = document.querySelectorAll('.form-input')[2] as HTMLInputElement;
    const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;
    
    const selectedTags: string[] = [];
    document.querySelectorAll('.style-tag').forEach((btn) => {
      const button = btn as HTMLButtonElement;
      if (button.style.background === 'rgb(0, 0, 0)') {
        selectedTags.push(button.textContent || '');
      }
    });

    const coverImageElement = document.querySelector('.story-image') as HTMLImageElement;
    const coverImage = coverImageElement?.src || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';

    const newStory = {
      id: Date.now(),
      title: titleInput?.value || '제목 없음',
      description: editor?.innerText || '내용 없음',
      image: coverImage,
      author: "채원",
      authorAvatar: "채",
      destination: destinationInput?.value || '미정',
      duration: durationSelect?.value || '선택하세요',
      budget: budgetInput?.value || '0',
      departureDate: '',
      date: new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1),
      likes: 0,
      comments: 0,
      bookmarks: 0,
      follows: 0,
      views: "0",
      tags: selectedTags
    };

    setNewStories([newStory, ...newStories]);
    showCustomAlert('여행기가 발행되었습니다!');
    setEditingStory(null);
    
    // 발행 후 myStories로 이동
    setPageDirectly('myStories');
  };

  const handleSaveDraft = () => {
    const titleInput = document.querySelector('.title-input') as HTMLInputElement;
    
    const newDraft = {
      id: Date.now(),
      title: titleInput?.value || '제목 없음',
      date: new Date().toLocaleDateString()
    };
    setDrafts([...drafts, newDraft]);
    showCustomAlert('임시저장되었습니다.');
  };

  const handleShare = () => {
    showCustomAlert('링크가 복사되었습니다!');
  };

  return {
    currentPage,
    setCurrentPage: setPageDirectly,
    navigateToPage,
    goBack,
    previousPage: 'main', // 더 이상 사용하지 않지만 호환성을 위해 유지
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
  };
}

export default useTravelStory;