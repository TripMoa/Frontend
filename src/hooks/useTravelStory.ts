import { useState, useEffect } from 'react';

interface Story {
  id: number;
  title: string;
  description: string;
  image: string;
  images?: string[];
  author: string;
  authorAvatar: string;
  destination: string;
  duration: string;
  budget: string;
  departureDate?: string;
  date: string;
  likes: number;
  comments: number;
  follows: number;
  views: string;
  tags: string[];
}

interface Draft {
  id: number;
  title: string;
  content: string;
  date: string;
}

function useTravelStory() {
  const [currentPage, setCurrentPageState] = useState(() => {
    // URL 해시를 먼저 체크 (#main, #detail 등)
    const hash = window.location.hash.slice(1);
    if (hash) return hash;
    
    // 없으면 localStorage에서
    const saved = localStorage.getItem('currentPage');
    return saved || 'main';
  });
  const [previousPage, setPreviousPage] = useState('main');
  
  // selectedStoryId만 저장 (story 전체는 너무 큼)
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedStoryId');
    return saved ? parseInt(saved) : null;
  });
  
  const [filters, setFilters] = useState({
    searchTerm: '',
    destination: '',
    duration: '',
    minBudget: '',
    maxBudget: '',
    tags: [] as string[]
  });
  
  const [likedStories, setLikedStories] = useState<number[]>(() => {
    const saved = localStorage.getItem('likedStories');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [followedStories, setFollowedStories] = useState<number[]>(() => {
    const saved = localStorage.getItem('followedStories');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  
  const [drafts, setDraftsState] = useState<Draft[]>(() => {
    const saved = localStorage.getItem('drafts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [editingStory, setEditingStory] = useState<any>(null);
  const [currentDraft, setCurrentDraft] = useState<any>(null);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingStoryId, setDeletingStoryId] = useState<number | null>(null);
  
  const [myStories, setMyStoriesState] = useState<Story[]>(() => {
    const saved = localStorage.getItem('myStories');
    return saved ? JSON.parse(saved) : [];
  });

  // setMyStories wrapper - 이미지 최대 3개까지 저장 시도
  const setMyStories = (newStories: Story[] | ((prev: Story[]) => Story[])) => {
    try {
      if (typeof newStories === 'function') {
        setMyStoriesState(prev => {
          const updated = newStories(prev);
          
          try {
            // 이미지 3개까지만 저장 시도
            const limitedImages = updated.map(s => ({
              ...s,
              images: s.images?.slice(0, 3) || []
            }));
            localStorage.setItem('myStories', JSON.stringify(limitedImages));
          } catch (e) {
            console.warn('이미지 포함 저장 실패, 기본 이미지로 대체');
            try {
              // 실패하면 기본 이미지로 대체
              const withoutImages = updated.map(s => ({
                ...s,
                image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
                images: []
              }));
              localStorage.setItem('myStories', JSON.stringify(withoutImages));
            } catch (e2) {
              console.error('localStorage 저장 완전 실패:', e2);
            }
          }
          
          return updated;
        });
      } else {
        setMyStoriesState(newStories);
        
        try {
          // 이미지 3개까지만 저장 시도
          const limitedImages = newStories.map(s => ({
            ...s,
            images: s.images?.slice(0, 3) || []
          }));
          localStorage.setItem('myStories', JSON.stringify(limitedImages));
        } catch (e) {
          console.warn('이미지 포함 저장 실패, 기본 이미지로 대체');
          try {
            // 실패하면 기본 이미지로 대체
            const withoutImages = newStories.map(s => ({
              ...s,
              image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
              images: []
            }));
            localStorage.setItem('myStories', JSON.stringify(withoutImages));
          } catch (e2) {
            console.error('localStorage 저장 완전 실패:', e2);
          }
        }
      }
    } catch (error) {
      console.error('Error in setMyStories:', error);
      if (typeof newStories === 'function') {
        setMyStoriesState(prev => newStories(prev));
      } else {
        setMyStoriesState(newStories);
      }
    }
  };

  // myStories에서 실제 story 찾기 (id만 저장해서 용량 절약)
  const selectedStory = selectedStoryId 
    ? myStories.find(s => s.id === selectedStoryId) || null
    : null;
  
  const setSelectedStory = (story: any) => {
    if (story) {
      setSelectedStoryId(story.id);
      localStorage.setItem('selectedStoryId', story.id.toString());
    } else {
      setSelectedStoryId(null);
      localStorage.removeItem('selectedStoryId');
    }
  };

  // setDrafts wrapper
  const setDrafts = (newDrafts: Draft[] | ((prev: Draft[]) => Draft[])) => {
    if (typeof newDrafts === 'function') {
      setDraftsState(prev => {
        const updated = newDrafts(prev);
        localStorage.setItem('drafts', JSON.stringify(updated));
        return updated;
      });
    } else {
      setDraftsState(newDrafts);
      localStorage.setItem('drafts', JSON.stringify(newDrafts));
    }
  };

  // localStorage 동기화
  useEffect(() => {
    localStorage.setItem('likedStories', JSON.stringify(likedStories));
  }, [likedStories]);

  useEffect(() => {
    localStorage.setItem('followedStories', JSON.stringify(followedStories));
  }, [followedStories]);

  // 브라우저 뒤로가기/앞으로가기 버튼 지원
  useEffect(() => {
    // 초기 로드 시 history state 설정
    if (!window.history.state?.page) {
      window.history.replaceState({ page: currentPage }, '', `#${currentPage}`);
    }

    const handlePopState = (event: PopStateEvent) => {
      const page = event.state?.page || 'main';
      setCurrentPageState(page);
      localStorage.setItem('currentPage', page);
      
      // write 페이지에서 벗어나면 상태 초기화
      if (page !== 'write') {
        setCurrentDraftId(null);
        setCurrentDraft(null);
        setEditingStory(null);
      }
      
      // detail 페이지가 아니면 selectedStory 초기화
      if (page !== 'detail') {
        setSelectedStory(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Alert 함수들
  const showCustomAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
    setAlertMessage('');
  };

  // 페이지 네비게이션
  const setCurrentPage = (page: string) => {
    setCurrentPageState(page);
    localStorage.setItem('currentPage', page);
    window.history.pushState({ page }, '', `#${page}`);
  };

  const navigateToPage = (newPage: string) => {
    if (currentPage === 'write' && newPage !== 'write') {
      setCurrentDraftId(null);
      setCurrentDraft(null);
      setEditingStory(null);
    }

    if (currentPage !== newPage) {
      setPreviousPage(currentPage);
    }

    setCurrentPageState(newPage);
    localStorage.setItem('currentPage', newPage);
    window.history.pushState({ page: newPage }, '', `#${newPage}`);
  };

  const goBack = () => {
    const targetPage = previousPage || 'main';
    setCurrentPage(targetPage);
    setCurrentDraftId(null);
    setCurrentDraft(null);
    setEditingStory(null);
    setSelectedStory(null);
    setPreviousPage('main');
  };

  // 필터링
  const getFilteredStories = () => {
    return myStories.filter(story => {
      const matchesSearch =
        story.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        story.description.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesDestination =
        !filters.destination || story.destination === filters.destination;

      const matchesDuration =
        !filters.duration || story.duration === filters.duration;

      const matchesBudget =
        (!filters.minBudget || parseInt(story.budget) >= parseInt(filters.minBudget)) &&
        (!filters.maxBudget || parseInt(story.budget) <= parseInt(filters.maxBudget));

      const matchesTags =
        filters.tags.length === 0 ||
        filters.tags.some(tag => story.tags.includes(tag));

      return (
        matchesSearch &&
        matchesDestination &&
        matchesDuration &&
        matchesBudget &&
        matchesTags
      );
    });
  };

  // 스토리 관련 함수들
  const handleStoryClick = (story: any) => {
    setSelectedStory(story);
    navigateToPage('detail');
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
      setMyStories(myStories.filter(story => story.id !== deletingStoryId));
      showCustomAlert('여행기가 삭제되었습니다.');
    }
    setShowDeleteModal(false);
    setDeletingStoryId(null);
  };

  // 발행 함수
  const handlePublish = () => {
    const titleInput = document.querySelector('.title-input') as HTMLInputElement;
    const destinationInput = document.querySelector('.form-input') as HTMLInputElement;
    const durationSelect = document.querySelector('.form-select') as HTMLSelectElement;
    const budgetInput = document.querySelectorAll('.form-input')[2] as HTMLInputElement;
    const departureDateInput = document.querySelectorAll('.form-input')[1] as HTMLInputElement;
    const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;
    
    const selectedTags: string[] = [];
    document.querySelectorAll('.style-tag').forEach((btn) => {
      const button = btn as HTMLButtonElement;
      if (button.style.background === 'rgb(0, 0, 0)') {
        selectedTags.push(button.textContent || '');
      }
    });

    // 커버 이미지 가져오기
    const coverImage = (window as any).selectedCoverImageForPublish || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';
    
    // 업로드된 이미지들 가져오기 (최대 5개로 제한)
    const uploadedImages = (window as any).uploadedImagesForPublish || [];
    const limitedImages = uploadedImages.slice(0, 5);
    const finalImages = limitedImages.length > 0 ? limitedImages : [coverImage];

    if (editingStory) {
      const updatedStory: Story = {
        ...editingStory,
        title: titleInput?.value || '제목 없음',
        description: editor?.innerHTML || '내용 없음',
        image: coverImage,
        images: finalImages,
        destination: destinationInput?.value || '미정',
        duration: durationSelect?.value || '선택하세요',
        budget: budgetInput?.value || '0',
        departureDate: departureDateInput?.value || '',
        tags: selectedTags
      };

      setMyStories(myStories.map(story => 
        story.id === editingStory.id ? updatedStory : story
      ));
      
      showCustomAlert('여행기가 수정되었습니다!');
    } else {
      const newStory: Story = {
        id: Date.now(),
        title: titleInput?.value || '제목 없음',
        description: editor?.innerHTML || '내용 없음',
        image: coverImage,
        images: finalImages,
        author: "나",
        authorAvatar: "나",
        destination: destinationInput?.value || '미정',
        duration: durationSelect?.value || '선택하세요',
        budget: budgetInput?.value || '0',
        departureDate: departureDateInput?.value || '',
        date: new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1),
        likes: 0,
        comments: 0,
        follows: 0,
        views: "0",
        tags: selectedTags
      };

      setMyStories([newStory, ...myStories]);
      showCustomAlert('여행기가 발행되었습니다!');
      
      if (uploadedImages.length > 5) {
        setTimeout(() => {
          showCustomAlert('이미지가 너무 많아 최신 5개만 저장되었습니다.');
        }, 2000);
      }
    }

    setEditingStory(null);
    setCurrentDraftId(null);
    
    if (previousPage === 'myStories') {
      navigateToPage('myStories');
    } else {
      navigateToPage('main');
    }
  };

  // 임시저장 함수
  const handleSaveDraft = () => {
    const titleInput = document.querySelector('.title-input') as HTMLInputElement;
    const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;

    const title = titleInput?.value?.trim() || '';
    const content = editor?.innerHTML?.trim() || '';

    if (!title && !content) {
      showCustomAlert('제목과 본문을 작성해주세요.');
      return;
    }

    const now = new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1);

    if (currentDraftId) {
      setDrafts(
        drafts.map(d =>
          d.id === currentDraftId ? { ...d, title, content, date: now } : d
        )
      );
    } else {
      const newDraftId = Date.now();
      setDrafts([
        { id: newDraftId, title, content, date: now },
        ...drafts
      ]);
      setCurrentDraftId(newDraftId);
    }

    showCustomAlert('임시저장되었습니다.');
  };

  // 좋아요 토글
  const toggleLike = (storyId: number) => {
    setMyStories(prev =>
      prev.map(story =>
        story.id === storyId
          ? { ...story, likes: likedStories.includes(storyId) ? story.likes - 1 : story.likes + 1 }
          : story
      )
    );

    setLikedStories(prev =>
      prev.includes(storyId)
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  // 조회수 증가
  const incrementViews = (storyId: number) => {
    setMyStories(prev =>
      prev.map(story =>
        story.id === storyId
          ? { ...story, views: String(parseInt(story.views || '0') + 1) }
          : story
      )
    );
  };

  return {
    currentPage,
    setCurrentPage,
    navigateToPage,
    goBack,
    previousPage,
    selectedStory,
    setSelectedStory,
    filters,
    setFilters,
    likedStories,
    setLikedStories,
    followedStories,
    setFollowedStories,
    showAlert,
    alertMessage,
    showCustomAlert,
    closeAlert,
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
    currentDraftId,
    setCurrentDraftId,
    getFilteredStories,
    handleStoryClick,
    handleEdit,
    handleDelete,
    confirmDelete,
    handlePublish,
    handleSaveDraft,
    toggleLike,
    incrementViews,
    myStories,
    setMyStories
  };
}

export default useTravelStory;