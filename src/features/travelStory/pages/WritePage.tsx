import { useState, useEffect, useRef, useCallback } from 'react';
import ConfirmModal from '../components/modals/ConfirmModal';
import { useLocation } from "react-router-dom";
import { createDraft } from "../../../api/drafts.api"; 
import { useImageUpload } from '../hooks/useImageUpload';
import { getTags } from '../../../api/travelTags.api';
import type { Tag } from '../../../api/travelTags.api';
import '../styles/travelStory.css';
import '../styles/WritePage.css';

interface WritePageProps {
  goBack: () => void;
  onPublish: () => void;
  onSaveDraft: (type: "FREE" | "REVIEW") => void;
  onOpenDraftModal: () => void;
  editingStory?: any;
  currentDraft?: any;
  drafts: any[];

  type?: "FREE" | "REVIEW";
}

// 기간 선택용 커스텀 드롭다운
function CustomSelect({ value, options, onChange }: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`custom-select-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        style={{ width: '100%' }}
      >
        <span>{value}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="custom-select-dropdown">
          {options.map(opt => (
            <div key={opt} className={`custom-select-option ${value === opt ? 'selected' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 커스텀 날짜 선택 달력
function CustomDatePicker({ value, onChange }: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split('-')[0]) : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split('-')[1]) - 1 : new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const handleDayClick = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const displayValue = value
    ? `${value.split('-')[0]}년 ${String(parseInt(value.split('-')[1]))}월 ${String(parseInt(value.split('-')[2]))}일`
    : '날짜 선택...';

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = new Date();

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="form-input custom-date-trigger" onClick={() => setOpen(!open)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{displayValue}</span>
      </button>
      {open && (
        <div className="custom-calendar">
          <div className="custom-calendar-header">
            <button type="button" onClick={handlePrevMonth}>‹</button>
            <span>{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={handleNextMonth}>›</button>
          </div>
          <div className="custom-calendar-grid">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="custom-calendar-weekday">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
              const isSelected = value === `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              return (
                <button key={day} type="button"
                  className={`custom-calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleDayClick(day)}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 여행 스토리 작성/수정 페이지
function WritePage({ 
  goBack,
  onPublish, 
  onSaveDraft,
  onOpenDraftModal,
  editingStory, 
  currentDraft,
  drafts,
  type = "FREE" 
}: WritePageProps) {

  console.log("type:", type);

const defaultContent = `
<p style="margin-bottom: 12px;">
  여행 이야기를 자유롭게 작성해주세요...
</p>

<div class="tip-box">
  <p style="display:flex; align-items:center; gap:6px;">
    
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h4l2-2h4l2 2h4v12H4z" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="13" r="3" stroke="currentColor" stroke-width="2"/>
    </svg>

    <span> 사진 업로드 TIP</span>

  </p>

  <ul>
    <li> - 최대 10장까지 업로드 가능</li>
    <li> - 슬라이더 형식으로 자동 정렬</li>
    <li> - COVER 버튼으로 대표 이미지 설정</li>
  </ul>
</div>
`;

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [isCleared, setIsCleared] = useState(false);
  const [isCenter, setIsCenter] = useState(false);
  const [selectedCoverImage, setSelectedCoverImage] = useState<string | null>(editingStory?.image || null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'back' | null>(null);
  const [travelStyles, setTravelStyles] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [duration, setDuration] = useState(editingStory?.duration || currentDraft?.duration || '선택하세요');
  const [departureDate, setDepartureDate] = useState(editingStory?.departureDate || currentDraft?.departureDate || '');  // 여기
  const [expenses, setExpenses] = useState({
    transportation: '',
    accommodation: '',
    food: '',
    attraction: '',
    shopping: ''
  });


  // 경비 합계 계산
  const totalExpenses = 
    (parseInt(expenses.transportation) || 0) +
    (parseInt(expenses.accommodation) || 0) +
    (parseInt(expenses.food) || 0) +
    (parseInt(expenses.attraction) || 0) +
    (parseInt(expenses.shopping) || 0);

  const { upload } = useImageUpload();
  const editorRef = useRef<HTMLDivElement>(null);

const toggleCenter = () => { 
  if (isCenter) { 
     execCmd('justifyLeft');
   } else {
     execCmd('justifyCenter'); 
   }  setIsCenter(!isCenter); 
 };

  // 나가기 경고 표시 여부 판단 - 제목/목적지/본문 중 하나라도 입력되면 true
  const hasContent = useCallback(() => {
    const editor = editorRef.current;
    const content = editor?.innerHTML;

    return !!(
      title.trim() ||
      destination.trim() ||
      (content && content.trim() !== '' && content !== '여행 이야기를 자유롭게 작성해주세요...')
    );
  }, [title, destination]);

  // 상대 경로 이미지 URL을 절대 경로로 변환
  const normalizeImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // 태그 목록 로드 - API 실패 시 기본 태그 목록으로 fallback
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await getTags();
        setTravelStyles(response.data);
      } catch (error) {
        setTravelStyles([
          { id: 1, name: '힐링여행' },
          { id: 2, name: '액티비티' },
          { id: 3, name: '맛집탐방' },
          { id: 4, name: '문화탐방' },
          { id: 5, name: '쇼핑' },
          { id: 6, name: '자연' },
          { id: 7, name: '사진' },
          { id: 8, name: '야경' },
          { id: 9, name: '로컬체험' },
          { id: 10, name: '카페투어' },
          { id: 11, name: '축제' },
          { id: 12, name: '역사탐방' },
          { id: 13, name: '야외활동' },
          { id: 14, name: '미식투어' },
          { id: 15, name: '럭셔리' },
          { id: 16, name: '배낭여행' }
        ]);
      }
    };
    fetchTags();
  }, []);

    useEffect(() => {
    setTitle(editingStory?.title || currentDraft?.title || '');
    setDestination(editingStory?.destination || currentDraft?.destination || '');
}, [editingStory, currentDraft]);

  // 브라우저 뒤로가기 감지 - 내용 있으면 모달, 없으면 그냥 나가기
  useEffect(() => {
    window.history.pushState({ page: 'write' }, '', window.location.href);

    const handlePopState = () => {
      if (hasContent()) {
        window.history.pushState({ page: 'write' }, '', window.location.href);
        setConfirmAction('back');
        setShowConfirmModal(true);
      } else {
        goBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasContent, goBack]);

  useEffect(() => {
  const editor = editorRef.current;
  if (!editor) return;

  editor.innerHTML = defaultContent;
}, []);

// 수정 모드 진입 시 저장된 태그 문자열을 분리하여 선택 상태로 초기화
  useEffect(() => {
    if (editingStory?.tags) {
      const tagNames = editingStory.tags
        .split(',')
        .map((t: string) => t.trim());

      setSelectedTags(tagNames);
    }
  }, [editingStory]);

  // 수정 모드 진입 시 경비 초기화
  useEffect(() => {
    if (editingStory?.expenses) {
      setExpenses({
        transportation: editingStory.expenses.transportation?.toString() || '',
        accommodation: editingStory.expenses.accommodation?.toString() || '',
        food: editingStory.expenses.food?.toString() || '',
        attraction: editingStory.expenses.attraction?.toString() || '',
        shopping: editingStory.expenses.shopping?.toString() || ''
      });
    }
  }, [editingStory]);

  // 수정/임시저장 모드 진입 시 에디터 내용 초기화
  useEffect(() => {
    console.log('현재 draft:', currentDraft);
    if (editorRef.current && (editingStory || currentDraft)) {
      editorRef.current.innerHTML = editingStory?.description || currentDraft?.description || '';
    }
  }, [editingStory?.id, currentDraft?.id]);

  useEffect(() => {
  if (!currentDraft) {
    setTitle('');
    setDestination('');

    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }

    setIsCleared(false);
  }
}, [currentDraft]);

  // 페이지 이탈 시 브라우저 경고 (새로고침/탭 닫기)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasContent()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasContent]);


  // 수정/임시저장 모드 슬라이더 초기화 - 이미지 URL 정규화 및 이전/다음/커버/삭제 이벤트 바인딩
  useEffect(() => {
    if ((editingStory && editingStory.tags) || currentDraft) {
      setTimeout(() => {
        const sliders = document.querySelectorAll('.image-slider-wrapper');
        sliders.forEach(slider => {

          // 상대 경로 이미지 src를 절대 경로로 변환
          const images = slider.querySelectorAll('img');
          images.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http')) {
              img.setAttribute('src', normalizeImageUrl(src));
            }
          });

          const imagesContainer = slider.querySelector('.slider-images-container');
          const prevBtn = slider.querySelector('.slider-prev-btn');
          const nextBtn = slider.querySelector('.slider-next-btn');
          const indicator = slider.querySelector('.slider-indicator');
          const coverBtn = slider.querySelector('.slider-cover-btn');
          const deleteBtn = slider.querySelector('.slider-delete-btn');
          const buttonContainer = slider.querySelector('.slider-button-container');
          const deleteButtonContainer = slider.querySelector('.slider-delete-container');

          if (!imagesContainer) return;

          const allImages = Array.from(imagesContainer.querySelectorAll('img'));
          if (allImages.length === 0) return;

          let currentIndex = 0;

          // 첫 번째 이미지만 표시
          allImages.forEach((img) => {
            (img as HTMLElement).style.display = 'none';
          });
          (allImages[0] as HTMLElement).style.display = 'block';

          if (indicator) {
            indicator.textContent = `1/${allImages.length}`;
          }

          // 현재 이미지가 커버인지 확인 후 커버 버튼 스타일 업데이트
          const updateCoverButton = () => {
            const currentImg = allImages[currentIndex] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute('data-image-src') || currentImg.src;

            if (coverBtn) {
              if (currentSrc === selectedCoverImage) {
                (coverBtn as HTMLElement).style.background = '#FFD93D';
                (coverBtn as HTMLElement).style.color = '#000';
                if (buttonContainer) (buttonContainer as HTMLElement).style.opacity = '1';
              } else {
                (coverBtn as HTMLElement).style.background = '#000';
                (coverBtn as HTMLElement).style.color = '#fff';
              }
            }
          };

          // 이전 이미지 버튼 이벤트
          if (prevBtn) {
            const handlePrev = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              (allImages[currentIndex] as HTMLElement).style.display = 'none';
              currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
              (allImages[currentIndex] as HTMLElement).style.display = 'block';
              if (indicator) {
                indicator.textContent = `${currentIndex + 1}/${allImages.length}`;
              }
              updateCoverButton();
            };
            prevBtn.removeEventListener('click', handlePrev as EventListener);
            prevBtn.addEventListener('click', handlePrev as EventListener);
          }

          // 다음 이미지 버튼 이벤트
          if (nextBtn) {
            const handleNext = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              (allImages[currentIndex] as HTMLElement).style.display = 'none';
              currentIndex = (currentIndex + 1) % allImages.length;
              (allImages[currentIndex] as HTMLElement).style.display = 'block';
              if (indicator) {
                indicator.textContent = `${currentIndex + 1}/${allImages.length}`;
              }
              updateCoverButton();
            };
            nextBtn.removeEventListener('click', handleNext as EventListener);
            nextBtn.addEventListener('click', handleNext as EventListener);
          }

          // 커버 이미지 지정 버튼 이벤트
          if (coverBtn) {
            const handleCover = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();

              // 다른 슬라이더의 커버 버튼 초기화
              document.querySelectorAll('.slider-cover-btn').forEach(btn => {
                (btn as HTMLElement).style.background = '#000';
                (btn as HTMLElement).style.color = '#fff';
                const container = (btn as HTMLElement).parentElement;
                if (container) (container as HTMLElement).style.opacity = '0';
              });

              const currentImg = allImages[currentIndex] as HTMLImageElement;
              const currentSrc = currentImg.getAttribute('data-image-src') || currentImg.src;

              setSelectedCoverImage(currentSrc);
              (coverBtn as HTMLElement).style.background = '#FFD93D';
              (coverBtn as HTMLElement).style.color = '#000';
              if (buttonContainer) (buttonContainer as HTMLElement).style.opacity = '1';
            };
            coverBtn.removeEventListener('click', handleCover as EventListener);
            coverBtn.addEventListener('click', handleCover as EventListener);
          }

          // 이미지 삭제 버튼 이벤트
          if (deleteBtn) {
            const handleDelete = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();

              // 마지막 이미지면 슬라이더 전체 제거
              if (allImages.length === 1) {
                const src = (allImages[0] as HTMLImageElement).getAttribute('data-image-src') || (allImages[0] as HTMLImageElement).src;
                if (selectedCoverImage === src) {
                  setSelectedCoverImage(null);
                }
                slider.remove();
                return;
              }

              const currentImg = allImages[currentIndex] as HTMLImageElement;
              const currentSrc = currentImg.getAttribute('data-image-src') || currentImg.src;

              // 삭제 이미지가 커버면 커버 초기화
              if (selectedCoverImage === currentSrc) {
                setSelectedCoverImage(null);
              }

              currentImg.remove();

              // 삭제 후 currentIndex 보정
              const remainingImages = imagesContainer.querySelectorAll('img');
              if (currentIndex >= remainingImages.length) {
                currentIndex = remainingImages.length - 1;
              }

              remainingImages.forEach((img, idx) => {
                (img as HTMLElement).style.display = idx === currentIndex ? 'block' : 'none';
              });

              if (indicator) {
                indicator.textContent = `${currentIndex + 1}/${remainingImages.length}`;
              }

              // 이미지 1장 남으면 이전/다음 버튼 숨김
              if (remainingImages.length === 1) {
                if (prevBtn) (prevBtn as HTMLElement).style.display = 'none';
                if (nextBtn) (nextBtn as HTMLElement).style.display = 'none';
              }
            };
            deleteBtn.removeEventListener('click', handleDelete as EventListener);
            deleteBtn.addEventListener('click', handleDelete as EventListener);
          }

          // 호버 시 커버/삭제 버튼 표시
          slider.addEventListener('mouseenter', () => {
            if (coverBtn && (coverBtn as HTMLElement).style.background !== 'rgb(255, 217, 61)') {
              if (buttonContainer) (buttonContainer as HTMLElement).style.opacity = '1';
            }
            if (deleteButtonContainer) (deleteButtonContainer as HTMLElement).style.opacity = '1';
          });
          slider.addEventListener('mouseleave', () => {
            if (coverBtn && (coverBtn as HTMLElement).style.background !== 'rgb(255, 217, 61)') {
              if (buttonContainer) (buttonContainer as HTMLElement).style.opacity = '0';
            }
            if (deleteButtonContainer) (deleteButtonContainer as HTMLElement).style.opacity = '0';
          });

          updateCoverButton();
        });
      }, 100); // DOM 렌더링 완료 후 실행
    }
  }, [editingStory, currentDraft, selectedCoverImage]);

  // 이미지 업로드 및 슬라이더 삽입 - 최대 10장 제한
  const handleImageInsert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const editor = editorRef.current;
    if (!editor) return;
    
    const currentImages = editor?.querySelectorAll('.slider-images-container img').length || 0;

    if (currentImages >= 10) {
      alert('이미지는 최대 10장까지 업로드할 수 있습니다.');
      return;
    }

    const remainingSlots = 10 - currentImages;
    const fileArray = Array.from(files).slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(`이미지는 최대 10장까지 가능합니다. ${remainingSlots}장만 추가됩니다.`);
    }

    try {
      const imageUrls = await upload(fileArray);
      const normalizedUrls = imageUrls.map((url: string) => normalizeImageUrl(url));

      // 발행 시 이미지 URL 수집용 window 전역 배열에 추가
      (window as any).uploadedImagesForPublish =
        ((window as any).uploadedImagesForPublish || []).concat(normalizedUrls);

      const existingSlider = editor.querySelector('.image-slider-wrapper:last-of-type');

      if (existingSlider) {
        // 기존 슬라이더에 이미지 추가
        const imagesContainer = existingSlider.querySelector('.slider-images-container');
        if (!imagesContainer) return;

        const existingImages = imagesContainer.querySelectorAll('img');
        const startIndex = existingImages.length;

        normalizedUrls.forEach((url: string, index: number) => {
          const img = document.createElement('img');
          img.src = url;
          img.alt = `slide ${startIndex + index + 1}`;
          img.setAttribute('data-image-src', url);
          img.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: none;
          `;
          imagesContainer.appendChild(img);
        });

        // 인디케이터 업데이트
        const indicator = existingSlider.querySelector('.slider-indicator');
        const allImages = imagesContainer.querySelectorAll('img');
        if (indicator) {
          const currentVisibleIndex = Array.from(allImages).findIndex(img =>
            (img as HTMLElement).style.display === 'block'
          );
          indicator.textContent = `${currentVisibleIndex + 1}/${allImages.length}`;
        }

        // 이미지가 1장에서 2장 이상이 되면 이전/다음 버튼 동적 생성
        if (existingImages.length === 1 && allImages.length > 1) {
          const getCurrentIndex = () => {
            const images = imagesContainer.querySelectorAll('img');
            return Array.from(images).findIndex(img => (img as HTMLElement).style.display === 'block');
          };

          // 이전 버튼 생성 및 이벤트 바인딩
          const prevBtn = document.createElement('button');
          prevBtn.className = 'slider-prev-btn';
          prevBtn.innerHTML = '‹';
          prevBtn.setAttribute('contenteditable', 'false');

          prevBtn.addEventListener('mouseenter', () => {
            prevBtn.style.background = 'rgba(255, 255, 255, 0.5)';
          });
          prevBtn.addEventListener('mouseleave', () => {
            prevBtn.style.background = 'rgba(255, 255, 255, 0.25)';
          });

          prevBtn.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();

            const images = imagesContainer.querySelectorAll('img');
            let currentIdx = getCurrentIndex();

            (images[currentIdx] as HTMLElement).style.display = 'none';
            currentIdx = (currentIdx - 1 + images.length) % images.length;
            (images[currentIdx] as HTMLElement).style.display = 'block';

            const ind = existingSlider.querySelector('.slider-indicator') as HTMLElement;
            if (ind) {
              ind.textContent = `${currentIdx + 1}/${images.length}`;
            }

            // 커버 이미지 여부 확인 후 버튼 스타일 업데이트
            const coverBtn = existingSlider.querySelector('.slider-cover-btn') as HTMLElement;
            const buttonContainer = existingSlider.querySelector('.slider-button-container') as HTMLElement;
            const currentImg = images[currentIdx] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute('data-image-src');

            if (coverBtn && currentSrc === selectedCoverImage) {
              coverBtn.style.background = '#FFD93D';
              coverBtn.style.color = '#000';
              if (buttonContainer) buttonContainer.style.opacity = '1';
            } else if (coverBtn) {
              coverBtn.style.background = '#000';
              coverBtn.style.color = '#fff';
            }
          });

          existingSlider.appendChild(prevBtn);

          // 다음 버튼 생성 및 이벤트 바인딩
          const nextBtn = document.createElement('button');
          nextBtn.className = 'slider-next-btn';
          nextBtn.innerHTML = '›';
          nextBtn.setAttribute('contenteditable', 'false');

          nextBtn.addEventListener('mouseenter', () => {
            nextBtn.style.background = 'rgba(255, 255, 255, 0.5)';
          });
          nextBtn.addEventListener('mouseleave', () => {
            nextBtn.style.background = 'rgba(255, 255, 255, 0.25)';
          });

          nextBtn.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();

            const images = imagesContainer.querySelectorAll('img');
            let currentIdx = getCurrentIndex();

            (images[currentIdx] as HTMLElement).style.display = 'none';
            currentIdx = (currentIdx + 1) % images.length;
            (images[currentIdx] as HTMLElement).style.display = 'block';

            const ind = existingSlider.querySelector('.slider-indicator') as HTMLElement;
            if (ind) {
              ind.textContent = `${currentIdx + 1}/${images.length}`;
            }

            // 커버 이미지 여부 확인 후 버튼 스타일 업데이트
            const coverBtn = existingSlider.querySelector('.slider-cover-btn') as HTMLElement;
            const buttonContainer = existingSlider.querySelector('.slider-button-container') as HTMLElement;
            const currentImg = images[currentIdx] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute('data-image-src');

            if (coverBtn && currentSrc === selectedCoverImage) {
              coverBtn.style.background = '#FFD93D';
              coverBtn.style.color = '#000';
              if (buttonContainer) buttonContainer.style.opacity = '1';
            } else if (coverBtn) {
              coverBtn.style.background = '#000';
              coverBtn.style.color = '#fff';
            }
          });

          existingSlider.appendChild(nextBtn);
        }

// 기존 슬라이더의 커버 버튼 이벤트 재바인딩 (cloneNode로 기존 이벤트 제거 후 재등록)
        const existingCoverBtn = existingSlider.querySelector('.slider-cover-btn');
        const existingButtonContainer = existingSlider.querySelector('.slider-button-container');

        if (existingCoverBtn) {
          const newCoverBtn = existingCoverBtn.cloneNode(true) as HTMLElement;
          existingCoverBtn.parentNode?.replaceChild(newCoverBtn, existingCoverBtn);

          newCoverBtn.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();

            // 다른 슬라이더의 커버 버튼 초기화
            document.querySelectorAll('.slider-cover-btn').forEach(btn => {
              (btn as HTMLElement).style.background = '#000';
              (btn as HTMLElement).style.color = '#fff';
              const container = (btn as HTMLElement).parentElement;
              if (container) container.style.opacity = '0';
            });

            const getCurrentIndex = () => {
              const images = imagesContainer.querySelectorAll('img');
              return Array.from(images).findIndex(img => (img as HTMLElement).style.display === 'block');
            };

            const currentIdx = getCurrentIndex();
            const images = imagesContainer.querySelectorAll('img');
            const currentImg = images[currentIdx] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute('data-image-src');

            setSelectedCoverImage(currentSrc);
            newCoverBtn.style.background = '#FFD93D';
            newCoverBtn.style.color = '#000';
            if (existingButtonContainer) (existingButtonContainer as HTMLElement).style.opacity = '1';
          });
        }

      } else {
        // 새 슬라이더 생성
        const sliderId = `slider-${Date.now()}`;

        const sliderWrapper = document.createElement('div');
        sliderWrapper.className = 'image-slider-wrapper';
        sliderWrapper.setAttribute('data-slider-id', sliderId);
        sliderWrapper.setAttribute('contenteditable', 'false');

        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'slider-images-container';

        // 업로드된 이미지 목록을 슬라이더 컨테이너에 추가 (첫 번째만 표시)
        normalizedUrls.forEach((url: string, index: number) => {
          const img = document.createElement('img');
          img.src = url;
          img.alt = `slide ${index + 1}`;
          img.setAttribute('data-image-src', url);
          img.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: ${index === 0 ? 'block' : 'none'};
          `;
          imagesContainer.appendChild(img);
        });

        sliderWrapper.appendChild(imagesContainer);

        let currentIndex = 0;

        // 이미지가 2장 이상일 때만 이전/다음 버튼 생성
        if (normalizedUrls.length > 1) {
          // 이전 버튼 생성 및 이벤트 바인딩
          const prevBtn = document.createElement('button');
          prevBtn.className = 'slider-prev-btn';
          prevBtn.innerHTML = '‹';
          prevBtn.setAttribute('contenteditable', 'false');

          prevBtn.addEventListener('mouseenter', () => {
            prevBtn.style.background = 'rgba(0, 0, 0, 0.8)';
          });
          prevBtn.addEventListener('mouseleave', () => {
            prevBtn.style.background = 'rgba(0, 0, 0, 0.5)';
          });

          prevBtn.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();

            const images = imagesContainer.querySelectorAll('img');
            images[currentIndex].style.display = 'none';
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            images[currentIndex].style.display = 'block';

            const indicator = sliderWrapper.querySelector('.slider-indicator') as HTMLElement;
            if (indicator) {
              indicator.textContent = `${currentIndex + 1}/${images.length}`;
            }

            // 커버 이미지 여부 확인 후 버튼 스타일 업데이트
            const currentImg = images[currentIndex] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute('data-image-src');
            if (currentSrc === selectedCoverImage) {
              coverBtn.style.background = '#FFD93D';
              coverBtn.style.color = '#000';
              buttonContainer.style.opacity = '1';
            } else {
              coverBtn.style.background = '#000';
              coverBtn.style.color = '#fff';
              buttonContainer.style.opacity = '0';
            }
          });

          sliderWrapper.appendChild(prevBtn);
        }

        if (normalizedUrls.length > 1) {
          // 다음 버튼 생성 및 이벤트 바인딩
          const nextBtn = document.createElement('button');
          nextBtn.className = 'slider-next-btn';
          nextBtn.innerHTML = '›';
          nextBtn.setAttribute('contenteditable', 'false');

          nextBtn.addEventListener('mouseenter', () => {
            nextBtn.style.background = 'rgba(0, 0, 0, 0.8)';
          });
          nextBtn.addEventListener('mouseleave', () => {
            nextBtn.style.background = 'rgba(0, 0, 0, 0.5)';
          });

          nextBtn.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();

            const images = imagesContainer.querySelectorAll('img');
            images[currentIndex].style.display = 'none';
            currentIndex = (currentIndex + 1) % images.length;
            images[currentIndex].style.display = 'block';

            const indicator = sliderWrapper.querySelector('.slider-indicator') as HTMLElement;
            if (indicator) {
              indicator.textContent = `${currentIndex + 1}/${images.length}`;
            }

            // 커버 이미지 여부 확인 후 버튼 스타일 업데이트
            const currentImg = images[currentIndex] as HTMLImageElement;
            const currentSrc = currentImg.getAttribute('data-image-src');
            if (currentSrc === selectedCoverImage) {
              coverBtn.style.background = '#FFD93D';
              coverBtn.style.color = '#000';
              buttonContainer.style.opacity = '1';
            } else {
              coverBtn.style.background = '#000';
              coverBtn.style.color = '#fff';
              buttonContainer.style.opacity = '0';
            }
          });

          sliderWrapper.appendChild(nextBtn);
        }

        // 이미지 인덱스 표시 (예: 1/3)
        const indicator = document.createElement('div');
        indicator.className = 'slider-indicator';
        indicator.textContent = `1/${normalizedUrls.length}`;
        sliderWrapper.appendChild(indicator);

        // 커버 버튼 컨테이너 - 호버 시 표시
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'slider-button-container';
        buttonContainer.setAttribute('contenteditable', 'false');
        buttonContainer.style.cssText = `
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.2s;
        `;

        // 커버 이미지 지정 버튼
        const coverBtn = document.createElement('button');
        coverBtn.className = 'slider-cover-btn';
        coverBtn.textContent = 'COVER';
        coverBtn.setAttribute('contenteditable', 'false');

        coverBtn.addEventListener('click', (evt) => {
          evt.preventDefault();
          evt.stopPropagation();

          // 다른 슬라이더의 커버 버튼 초기화
          document.querySelectorAll('.slider-cover-btn, .image-cover-btn').forEach(btn => {
            (btn as HTMLElement).style.background = '#000';
            (btn as HTMLElement).style.color = '#fff';
            const container = (btn as HTMLElement).parentElement;
            if (container) {
              container.style.opacity = '0';
            }
          });

          const images = imagesContainer.querySelectorAll('img');
          const currentImg = images[currentIndex] as HTMLImageElement;
          const currentSrc = currentImg.getAttribute('data-image-src');

          setSelectedCoverImage(currentSrc);
          coverBtn.style.background = '#FFD93D';
          coverBtn.style.color = '#000';
          buttonContainer.style.opacity = '1';
        });

        buttonContainer.appendChild(coverBtn);
        sliderWrapper.appendChild(buttonContainer);

        // 삭제 버튼 컨테이너 - 호버 시 표시
        const deleteButtonContainer = document.createElement('div');
        deleteButtonContainer.className = 'slider-delete-container';
        deleteButtonContainer.setAttribute('contenteditable', 'false');
        deleteButtonContainer.style.cssText = `
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.2s;
        `;

        // 이미지 삭제 버튼 (휴지통 아이콘)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'slider-delete-btn';
        deleteBtn.setAttribute('contenteditable', 'false');
        deleteBtn.style.cssText = `
          width: 40px;
          height: 40px;
          border: none;
          background: rgba(0, 0, 0, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          border-radius: 4px;
        `;

        deleteBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2m3 0v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6h14z" 
                  stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 11v6M14 11v6" 
                  stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;

        // 호버 시 빨간 배경
        deleteBtn.addEventListener('mouseenter', () => {
          deleteBtn.style.background = 'rgba(220, 38, 38, 0.9)';
        });
        deleteBtn.addEventListener('mouseleave', () => {
          deleteBtn.style.background = 'rgba(0, 0, 0, 0.6)';
        });

        deleteBtn.addEventListener('click', (evt) => {
          evt.preventDefault();
          evt.stopPropagation();

          const images = imagesContainer.querySelectorAll('img');

          // 마지막 이미지면 슬라이더 전체 제거
          if (images.length === 1) {
            const src = (images[0] as HTMLImageElement).getAttribute('data-image-src');
            if (selectedCoverImage === src) {
              setSelectedCoverImage(null);
            }
            sliderWrapper.remove();
            return;
          }

          const currentImg = images[currentIndex] as HTMLImageElement;
          const currentSrc = currentImg.getAttribute('data-image-src');

          // 삭제 이미지가 커버면 커버 초기화
          if (selectedCoverImage === currentSrc) {
            setSelectedCoverImage(null);
          }

          currentImg.remove();

          // 삭제 후 currentIndex 보정
          const remainingImages = imagesContainer.querySelectorAll('img');
          if (currentIndex >= remainingImages.length) {
            currentIndex = remainingImages.length - 1;
          }

          remainingImages.forEach((img, idx: number) => {
            (img as HTMLElement).style.display = idx === currentIndex ? 'block' : 'none';
          });

          const indicator = sliderWrapper.querySelector('.slider-indicator') as HTMLElement;
          if (indicator) {
            indicator.textContent = `${currentIndex + 1}/${remainingImages.length}`;
          }

          // 이미지 1장 남으면 이전/다음 버튼 숨김
          if (remainingImages.length === 1) {
            const prevBtn = sliderWrapper.querySelector('.slider-prev-btn');
            const nextBtn = sliderWrapper.querySelector('.slider-next-btn');
            if (prevBtn) (prevBtn as HTMLElement).style.display = 'none';
            if (nextBtn) (nextBtn as HTMLElement).style.display = 'none';
          }
        });

        deleteButtonContainer.appendChild(deleteBtn);

        // 호버 시 커버/삭제 버튼 표시
        sliderWrapper.addEventListener('mouseenter', () => {
          if (coverBtn.style.background !== 'rgb(255, 217, 61)') {
            buttonContainer.style.opacity = '1';
          }
          deleteButtonContainer.style.opacity = '1';
        });
        sliderWrapper.addEventListener('mouseleave', () => {
          if (coverBtn.style.background !== 'rgb(255, 217, 61)') {
            buttonContainer.style.opacity = '0';
          }
          deleteButtonContainer.style.opacity = '0';
        });

        sliderWrapper.appendChild(deleteButtonContainer);

        editor.appendChild(sliderWrapper);

        // 슬라이더 뒤에 줄바꿈 추가
        const br = document.createElement('br');
        editor.appendChild(br);

        // 첫 업로드 시 첫 번째 이미지를 자동으로 커버로 설정
        if (!selectedCoverImage && normalizedUrls.length > 0) {
          setSelectedCoverImage(normalizedUrls[0]);
          coverBtn.style.background = '#FFD93D';
          coverBtn.style.color = '#000';
          buttonContainer.style.opacity = '1';
        }
      }

    } catch (error) {
      alert('이미지 업로드에 실패했습니다.');
    }

    e.target.value = '';
  };

  const execCmd = (command: string, value?: string) => {
  const editor = editorRef.current;
  if (!editor) return;

  editor.focus();
  document.execCommand(command, false, value ?? undefined);
};



  // 에디터 내용이 비었을 때 innerHTML 초기화 → placeholder 재표시
const handleEditorInput = () => {
  const editor = editorRef.current;
  if (!editor) return;
  if (
    editor.innerHTML === '<br>' ||
    editor.innerHTML === '<p><br></p>' ||
    editor.innerHTML === '<div><br></div>'
  ) {
    editor.innerHTML = '';
  }
  
};

  // 발행 버튼 클릭 - 유효성 검사 후 publishData를 window에 저장하고 onPublish 호출
  const handlePublishClick = () => {
    const titleTrimmed = title.trim();
    const destinationTrimmed = destination.trim();
    const editor = editorRef.current;
    const content = editor?.innerHTML.trim();

    if (!titleTrimmed) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!destinationTrimmed) {
      alert('목적지를 입력해주세요.');
      return;
    }

    if (!content || content === '여행 이야기를 자유롭게 작성해주세요.') {
      alert('여행 내용을 작성해주세요.');
      editor?.focus();
      return;
    }

    // 신규 작성 시 이미지 필수
    if (!selectedCoverImage && !editingStory) {
      alert('사진을 최소 1장 이상 삽입해주세요.');
      return;
    }

    // 선택된 태그 ID → 태그 이름 문자열로 변환
    const tagNames = selectedTags.join(',');

    const expensesJson = JSON.stringify({
      transportation: parseInt(expenses.transportation) || 0,
      accommodation: parseInt(expenses.accommodation) || 0,
      food: parseInt(expenses.food) || 0,
      attraction: parseInt(expenses.attraction) || 0,
      shopping: parseInt(expenses.shopping) || 0,
      total: totalExpenses
    });

    // 발행 데이터를 window에 저장 후 onPublish 호출 (useTravelStory에서 수집)
    (window as any).selectedCoverImageForPublish = selectedCoverImage;
    (window as any).publishData = {
      destination,
      duration,
      budget: totalExpenses.toString(),
      departureDate,
      tags: tagNames,
      expenses: expensesJson
    };

    if (typeof onPublish === 'function') {
      onPublish();
    } else {
      alert('발행 기능에 문제가 발생했습니다. 페이지를 새로고침 해주세요.');
    }
  };

  return (
    <div className="detail-page-container">

      <div style={{ color: "red", fontWeight: "bold" }}>
      현재 타입: {type}
    </div>

      <div className="write-page-content">

        <div className="write-header">
          {/* 닫기 버튼 - 내용 있으면 나가기 확인 모달 표시 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (hasContent()) {
                setConfirmAction('back');
                setShowConfirmModal(true);
              } else {
                goBack();
              }
            }}
            className="write-close-btn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              style={{ width: '24px', height: '24px', fill: '#000', transition: 'fill 0.2s', pointerEvents: 'none' }}
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* 작성/수정 모드 제목 */}
          <h1 className="write-header-title">
            {editingStory ? 'EDIT STORY' : 'WRITE NEW STORY'}
          </h1>

          <div className="write-header-actions">
            {/* 임시저장 버튼 + 저장된 개수 뱃지 */}
            <div className="write-draft-btn-wrapper">
              <button onClick={() => onSaveDraft(type)} className="write-draft-btn">
                SAVE DRAFT
              </button>
              <div onClick={onOpenDraftModal} className="write-draft-badge">
                {drafts.length}
              </div>
            </div>
            {/* 발행 버튼 */}
            <button onClick={handlePublishClick} className="write-publish-btn">
              PUBLISH
            </button>
          </div>
        </div>

        <div className="write-form-container">
          {/* 제목 입력 */}
          <div className="write-title-section">
            <label className="write-label">TITLE *</label>
            <input
              type="text"
              className="title-input"
              placeholder="여행 제목을 입력하세요."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={15}
            />
          </div>

          {/* 목적지 / 기간 / 출발일 3열 그리드 */}
          {type === "REVIEW" && (
            <div className="write-form-grid">
              <div>
                <label className="write-label">DESTINATION *</label>
                <input
                  className="form-input"
                  placeholder="예 : 경주"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
                </div>

                <div>
                  <label className="write-label">DURATION</label>
                  <CustomSelect
                    value={duration}
                    options={['선택하세요', '당일치기', '1박 2일', '2박 3일', '3박 4일', '4박 5일', '5박 6일', '1주일 이상']}
                    onChange={(val) => setDuration(val)}
                  />
                </div>

                <div>
                  <label className="write-label">DEPARTURE DATE</label>
                  <CustomDatePicker
                    value={departureDate}
                    onChange={(val) => setDepartureDate(val)}
                  />
                </div>

                {/* 경비 입력 */}
                <div className="write-expenses-section">
                  <label className="write-label">여행 경비</label>
                  <div className="write-expenses-container">
                    <div className="write-expenses-grid">
                      {[
                        { label: '교통비', key: 'transportation', placeholder: '0' },
                        { label: '숙박비', key: 'accommodation', placeholder: '0' },
                        { label: '식비', key: 'food', placeholder: '0' },
                        { label: '관광/입장료', key: 'attraction', placeholder: '0' },
                        { label: '쇼핑/기타', key: 'shopping', placeholder: '0' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key} className="write-expense-row">
                          <label className="write-expense-label">{label}</label>
                          <input
                            type="number"
                            value={expenses[key as keyof typeof expenses]}
                            onChange={(e) => setExpenses({ ...expenses, [key]: e.target.value })}
                            placeholder={placeholder}
                            className="write-expense-input"
                          />
                          <span className="write-expense-unit">원</span>
                        </div>
                      ))}
                    </div>
                    <div className="write-expenses-total">
                      <span>총 합계</span>
                      <span>{totalExpenses.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* 여행 스타일 태그 선택 - 토글 방식 */}
          <div className="write-tags-section">
            <label className="write-label">TRAVEL STYLE</label>
            <div className="write-tags-container">
              {travelStyles.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`style-tag ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag.name)
                        ? prev.filter(t => t !== tag.name)
                        : [...prev, tag.name]
                    );
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* 본문 에디터 - 툴바 + WYSIWYG */}
          <div className="write-editor-section">
            <label className="write-label">CONTENT *</label>
              
              <div className="write-toolbar">

              {/* 볼드 */}
              <button type="button" className="toolbar-btn" title="볼드"
                onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" stroke="currentColor" strokeWidth="1" fill="none"/>
                  <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" stroke="currentColor" strokeWidth="1" fill="none"/>
                </svg>
              </button>

              <div className="toolbar-divider" />


              {/* 가운데 정렬 */}
              <button type="button" className="toolbar-btn" title="가운데 정렬"
                onMouseDown={(e) => { e.preventDefault();  toggleCenter();}}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
                </svg>
              </button>

              <div className="toolbar-divider" />


              {/* 이미지 삽입 - 파일 선택 후 handleImageInsert 호출 */}
              <label className="toolbar-btn" title="이미지 삽입">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <input type="file" accept="image/*" multiple onChange={handleImageInsert} style={{ display: 'none' }} />
              </label>
            </div>
            

            {/* WYSIWYG 에디터 본문 */}
            <div
             ref={editorRef}
             className="blog-editor-wysiwyg"
             contentEditable
             suppressContentEditableWarning
             onInput={handleEditorInput}
             onFocus={() => {
               const editor = editorRef.current;
               if (!editor) return;

               if (!isCleared) {
                 editor.innerHTML = '';
                 setIsCleared(true);
               }
              }}
            />
          </div>
        </div>

        {/* 나가기 확인 모달 */}
        <ConfirmModal
          show={showConfirmModal}
          title="페이지 나가기"
          message={`지금 나가시겠습니까?\n변경사항이 저장되지 않을 수 있습니다.`}
          confirmText="나가기"
          cancelText="취소"
          onConfirm={() => { setShowConfirmModal(false); goBack(); }}
          onCancel={() => setShowConfirmModal(false)}
        />
      </div>
    </div>
  );
}


export default WritePage;