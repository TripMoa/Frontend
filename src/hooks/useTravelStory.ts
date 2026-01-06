import { useState } from 'react';

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

const mockStories: Story[] = [
  {
    id: 1,
    title: "강릉 바다 힐링 3박4일",
    description: "청동진 일출부터 안목해변 커피거리까지 바다 보면서 여유를게 힐링하고 왔어요~",
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800",
    author: "채원",
    authorAvatar: "채",
    destination: "강릉",
    duration: "3박4일",
    budget: "500000",
    date: "2023.1.28",
    likes: 2,
    comments: 2,
    bookmarks: 11,
    follows: 45,
    views: "120",
    tags: ["#강릉여행", "#12월출발", "#3박4일", "#동해바다", "#커피투어", "#힐링"]
  },
  {
    id: 2,
    title: "전주 한옥마을 > 모직장 따닥 프라비 힐링여행< 맛집 투어 2박3일",
    description: "전주 한옥마을에서 전통 한옥 체험하고 경기진, 오목대 구경했어요. 맛집은 진짜 끝판이라구요!",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    author: "강",
    authorAvatar: "강",
    destination: "전주",
    duration: "2박3일",
    budget: "300000",
    date: "2023.1.20",
    likes: 8,
    comments: 5,
    bookmarks: 23,
    follows: 67,
    views: "85",
    tags: ["#전주여행", "#한옥", "#기성비"]
  },
  {
    id: 3,
    title: "경주 벚꽃 여행 완벽 가이드",
    description: "4월 초 경주의 벚꽃은 정말 환상적이었어요. 황리단길, 포석정, 하나트리, 불국사 경주님들까지 알찼어요...",
    image: "https://images.unsplash.com/photo-1478059299873-f047d8c5fe1a?w=800",
    author: "김",
    authorAvatar: "김",
    destination: "경주",
    duration: "2박3일",
    budget: "400000",
    date: "2023.4.15",
    likes: 15,
    comments: 12,
    bookmarks: 45,
    follows: 89,
    views: "156",
    tags: ["#경주여행", "#벚꽃투어", "#문화여행", "#단양자기"]
  }
];

function useTravelStory() {
  const [currentPage, setCurrentPage] = useState('main');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [filters, setFilters] = useState({
    destination: '전체',
    duration: '전체',
    budget: '전체',
    style: '전체'
  });
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [likedStories, setLikedStories] = useState<number[]>([]);
  const [followedStories, setFollowedStories] = useState<number[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<any>(null);

  const showCustomAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlert(!!message);
  };

  const getFilteredStories = () => {
    return mockStories.filter(story => {
      const destinationMatch = filters.destination === '전체' || story.destination === filters.destination;
      const durationMatch = filters.duration === '전체' || story.duration === filters.duration;
      
      let budgetMatch = true;
      if (filters.budget !== '전체') {
        const budget = parseInt(story.budget);
        switch(filters.budget) {
          case '10만원 이하':
            budgetMatch = budget <= 100000;
            break;
          case '10-30만원':
            budgetMatch = budget > 100000 && budget <= 300000;
            break;
          case '30-50만원':
            budgetMatch = budget > 300000 && budget <= 500000;
            break;
          case '50-100만원':
            budgetMatch = budget > 500000 && budget <= 1000000;
            break;
          case '100만원 이상':
            budgetMatch = budget > 1000000;
            break;
        }
      }

      const styleMatch = filters.style === '전체' || story.tags.some(tag => tag.includes(filters.style));

      return destinationMatch && durationMatch && budgetMatch && styleMatch;
    });
  };

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    setCurrentPage('detail');
  };

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setCurrentPage('write');
  };

  const handleDelete = (story: Story) => {
    setSelectedStory(story);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    showCustomAlert('여행기가 삭제되었습니다.');
    setShowDeleteModal(false);
    setCurrentPage('myStories');
  };

  const handlePublish = (data: any) => {
    showCustomAlert('여행기가 발행되었습니다!');
    setCurrentPage('main');
  };

  const handleSaveDraft = (data: any) => {
    const newDraft = {
      id: Date.now(),
      ...data,
      date: new Date().toLocaleDateString('ko-KR')
    };
    setDrafts([...drafts, newDraft]);
    showCustomAlert('임시저장되었습니다.');
  };

  const handleShare = () => {
    showCustomAlert('링크가 복사되었습니다!');
  };

  return {
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
  };
}

export default useTravelStory;