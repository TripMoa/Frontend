import { useState, useEffect, useRef } from 'react';
import ConfirmModal from './ConfirmModal';

interface WritePageProps {
  goBack: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onOpenDraftModal: () => void;
  editingStory?: any;
  currentDraft?: any;
  drafts: any[];
}

function WritePage({ 
  goBack,
  onPublish, 
  onSaveDraft,
  onOpenDraftModal,
  editingStory, 
  currentDraft,
  drafts
}: WritePageProps) {
  const [selectedCoverImage, setSelectedCoverImage] = useState<string | null>(editingStory?.image || null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'back' | null>(null);
  const [activeHeading, setActiveHeading] = useState<'h2' | 'h3' | null>(null);
  const [activeList, setActiveList] = useState<'ol' | 'ul' | null>(null);

  // onPublish 함수 검증
  useEffect(() => {
    if (typeof onPublish !== 'function') {
      console.error('onPublish is not a function:', onPublish);
    }
  }, [onPublish]);

  // ⭐ 글을 작성했는지 체크하는 함수
  const hasContent = () => {
    // 수정 중이거나 임시저장 글인 경우, 항상 확인 필요
    if (editingStory || currentDraft) {
      return true;
    }
    
    const titleInput = document.querySelector('.title-input') as HTMLInputElement;
    const destinationInput = document.querySelector('.form-input') as HTMLInputElement;
    const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;
    
    const title = titleInput?.value.trim();
    const destination = destinationInput?.value.trim();
    const content = editor?.innerText.trim();
    
    // 제목, 목적지, 내용 중 하나라도 있으면 true
    return !!(title || destination || (content && content !== '여행 이야기를 자유롭게 작성해주세요...'));
  };

  const savedRangeRef = useRef<Range | null>(null);

  // 새로고침 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // ⭐ 글을 쓴 경우에만 새로고침 방지
      if (hasContent()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  
  useEffect(() => {
    if ((editingStory && editingStory.tags) || currentDraft) {
      setTimeout(() => {
        // 태그 처리
        if (editingStory && editingStory.tags) {
          document.querySelectorAll('.style-tag').forEach((btn) => {
            const button = btn as HTMLButtonElement;
            const tagText = button.textContent || '';
            if (editingStory.tags.includes(tagText)) {
              button.style.background = '#000';
              button.style.color = '#fff';
              button.style.boxShadow = '2px 2px 0px rgba(0,0,0,1)';
              button.style.transform = 'translate(-1px, -1px)';
            }
          });
        }

        // 슬라이더 이벤트 리스너 등록 (수정 & 임시저장 페이지에서)
        const sliders = document.querySelectorAll('.image-slider-wrapper');
        sliders.forEach(slider => {
          const imagesContainer = slider.querySelector('.slider-images-container');
          const prevBtn = slider.querySelector('.slider-prev-btn');
          const nextBtn = slider.querySelector('.slider-next-btn');
          const indicator = slider.querySelector('.slider-indicator');
          
          if (!imagesContainer) return;
          
          const images = Array.from(imagesContainer.querySelectorAll('img'));
          if (images.length === 0) return;
          
          let currentIndex = 0;
          
          // 초기 상태: 첫 번째 이미지만 표시
          images.forEach((img, idx) => {
            (img as HTMLElement).style.display = idx === 0 ? 'block' : 'none';
          });
          
          // 이전 버튼
          if (prevBtn) {
            const handlePrev = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              (images[currentIndex] as HTMLElement).style.display = 'none';
              currentIndex = (currentIndex - 1 + images.length) % images.length;
              (images[currentIndex] as HTMLElement).style.display = 'block';
              if (indicator) {
                indicator.textContent = `${currentIndex + 1}/${images.length}`;
              }
            };
            prevBtn.removeEventListener('click', handlePrev as EventListener);
            prevBtn.addEventListener('click', handlePrev as EventListener);
          }
          
          // 다음 버튼
          if (nextBtn) {
            const handleNext = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              (images[currentIndex] as HTMLElement).style.display = 'none';
              currentIndex = (currentIndex + 1) % images.length;
              (images[currentIndex] as HTMLElement).style.display = 'block';
              if (indicator) {
                indicator.textContent = `${currentIndex + 1}/${images.length}`;
              }
            };
            nextBtn.removeEventListener('click', handleNext as EventListener);
            nextBtn.addEventListener('click', handleNext as EventListener);
          }
        });
      }, 100);
    }
  }, [editingStory, currentDraft]);

  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // 최대 5장 제한 (localStorage 용량 문제)
    const fileArray = Array.from(files).slice(0, 5);
    
    if (files.length > 5) {
      alert('이미지는 최대 5장까지 선택할 수 있습니다.');
    }
    
    // 모든 파일을 base64로 변환
    const imagePromises = fileArray.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(imagePromises).then(imageSrcs => {
      const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;
      if (!editor) return;
      
      editor.focus();
      const sliderId = `slider-${Date.now()}`;
      
      // 슬라이더 wrapper 생성
      const sliderWrapper = document.createElement('div');
      sliderWrapper.className = 'image-slider-wrapper';
      sliderWrapper.setAttribute('data-slider-id', sliderId);
      sliderWrapper.setAttribute('contenteditable', 'false');
      sliderWrapper.style.cssText = `
        position: relative;
        width: 693px;
        max-width: 100%;
        margin: 20px auto;
        background: #f5f5f5;
        border: 3px solid #000;
        box-shadow: 4px 4px 0px rgba(0, 0, 0, 1);
      `;
      
      // 이미지 컨테이너
      const imagesContainer = document.createElement('div');
      imagesContainer.className = 'slider-images-container';
      imagesContainer.style.cssText = `
        position: relative;
        width: 100%;
        height: 619px;
        overflow: hidden;
      `;
      
      // 각 이미지 추가
      imageSrcs.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `slide ${index + 1}`;
        img.setAttribute('data-image-src', src);
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
      
      // 현재 인덱스 저장
      let currentIndex = 0;
      
      // 이전 버튼
      if (imageSrcs.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'slider-prev-btn';
        prevBtn.innerHTML = '‹';
        prevBtn.setAttribute('contenteditable', 'false');
        prevBtn.style.cssText = `
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          background: rgba(0, 0, 0, 0.5);
          color: #fff;
          border: 2px solid #fff;
          font-size: 28px;
          font-weight: 700;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        `;
        
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
          
          // 인디케이터 업데이트
          const indicator = sliderWrapper.querySelector('.slider-indicator') as HTMLElement;
          if (indicator) {
            indicator.textContent = `${currentIndex + 1}/${images.length}`;
          }
          
          // COVER 버튼 상태 업데이트
          const currentImg = images[currentIndex] as HTMLImageElement;
          const currentSrc = currentImg.getAttribute('data-image-src');
          if (currentSrc === selectedCoverImage) {
            // 현재 이미지가 커버이면 노란색으로 표시하고 항상 보이게
            coverBtn.style.background = '#FFD93D';
            coverBtn.style.color = '#000';
            buttonContainer.style.opacity = '1';
          } else {
            // 현재 이미지가 커버가 아니면 검정색으로 표시하고 숨김
            coverBtn.style.background = '#000';
            coverBtn.style.color = '#fff';
            buttonContainer.style.opacity = '0';
          }
        });
        
        sliderWrapper.appendChild(prevBtn);
      }
      
      // 다음 버튼
      if (imageSrcs.length > 1) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'slider-next-btn';
        nextBtn.innerHTML = '›';
        nextBtn.setAttribute('contenteditable', 'false');
        nextBtn.style.cssText = `
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          background: rgba(0, 0, 0, 0.5);
          color: #fff;
          border: 2px solid #fff;
          font-size: 28px;
          font-weight: 700;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        `;
        
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
          
          // 인디케이터 업데이트
          const indicator = sliderWrapper.querySelector('.slider-indicator') as HTMLElement;
          if (indicator) {
            indicator.textContent = `${currentIndex + 1}/${images.length}`;
          }
          
          // COVER 버튼 상태 업데이트
          const currentImg = images[currentIndex] as HTMLImageElement;
          const currentSrc = currentImg.getAttribute('data-image-src');
          if (currentSrc === selectedCoverImage) {
            // 현재 이미지가 커버이면 노란색으로 표시하고 항상 보이게
            coverBtn.style.background = '#FFD93D';
            coverBtn.style.color = '#000';
            buttonContainer.style.opacity = '1';
          } else {
            // 현재 이미지가 커버가 아니면 검정색으로 표시하고 숨김
            coverBtn.style.background = '#000';
            coverBtn.style.color = '#fff';
            buttonContainer.style.opacity = '0';
          }
        });
        
        sliderWrapper.appendChild(nextBtn);
      }
      
      // 인디케이터 (1/5)
      const indicator = document.createElement('div');
      indicator.className = 'slider-indicator';
      indicator.textContent = `1/${imageSrcs.length}`;
      indicator.style.cssText = `
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        padding: 4px 12px;
        border-radius: 12px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        z-index: 10;
      `;
      sliderWrapper.appendChild(indicator);
      
      // 버튼 컨테이너 (COVER만)
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
      
      // COVER 버튼
      const coverBtn = document.createElement('button');
      coverBtn.className = 'slider-cover-btn';
      coverBtn.textContent = 'COVER';
      coverBtn.setAttribute('contenteditable', 'false');
      coverBtn.style.cssText = `
        width: 70px;
        padding: 8px;
        border: 3px solid #000;
        background: #000;
        color: #fff;
        font-family: 'Share Tech Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        text-align: center;
        box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.5);
        transition: all 0.2s;
      `;
      
      coverBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        
        // 모든 커버 버튼 초기화 (검정 배경으로)
        document.querySelectorAll('.slider-cover-btn, .image-cover-btn').forEach(btn => {
          (btn as HTMLElement).style.background = '#000';
          (btn as HTMLElement).style.color = '#fff';
          const container = (btn as HTMLElement).parentElement;
          if (container) {
            container.style.opacity = '0';
          }
        });
        
        // 현재 보이는 이미지를 커버로 설정
        const images = imagesContainer.querySelectorAll('img');
        const currentImg = images[currentIndex] as HTMLImageElement;
        const currentSrc = currentImg.getAttribute('data-image-src');
        
        setSelectedCoverImage(currentSrc);
        coverBtn.style.background = '#FFD93D';
        coverBtn.style.color = '#000';
        buttonContainer.style.opacity = '1'; // 노란색일 때는 항상 보이게
      });
      
      buttonContainer.appendChild(coverBtn);
      
      sliderWrapper.appendChild(buttonContainer);
      
      // 휴지통 버튼 (오른쪽 상단)
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
      
      // 휴지통 SVG 아이콘
      deleteBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6h18M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2m3 0v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6h14z" 
                stroke="white" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"/>
          <path d="M10 11v6M14 11v6" 
                stroke="white" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"/>
        </svg>
      `;
      
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
        
        // 이미지가 1장만 남았으면 전체 슬라이더 삭제
        if (images.length === 1) {
          const src = (images[0] as HTMLImageElement).getAttribute('data-image-src');
          if (selectedCoverImage === src) {
            setSelectedCoverImage(null);
          }
          sliderWrapper.remove();
          return;
        }
        
        // 현재 이미지 삭제
        const currentImg = images[currentIndex] as HTMLImageElement;
        const currentSrc = currentImg.getAttribute('data-image-src');
        
        // 커버였다면 해제
        if (selectedCoverImage === currentSrc) {
          setSelectedCoverImage(null);
        }
        
        currentImg.remove();
        
        // 인덱스 조정
        const remainingImages = imagesContainer.querySelectorAll('img');
        if (currentIndex >= remainingImages.length) {
          currentIndex = remainingImages.length - 1;
        }
        
        // 새로운 현재 이미지 표시
        remainingImages.forEach((img, idx) => {
          (img as HTMLElement).style.display = idx === currentIndex ? 'block' : 'none';
        });
        
        // 인디케이터 업데이트
        const indicator = sliderWrapper.querySelector('.slider-indicator') as HTMLElement;
        if (indicator) {
          indicator.textContent = `${currentIndex + 1}/${remainingImages.length}`;
        }
        
        // 새로운 현재 이미지의 COVER 상태 확인
        const newCurrentImg = remainingImages[currentIndex] as HTMLImageElement;
        const newCurrentSrc = newCurrentImg.getAttribute('data-image-src');
        if (newCurrentSrc === selectedCoverImage) {
          coverBtn.style.background = '#FFD93D';
          coverBtn.style.color = '#000';
          buttonContainer.style.opacity = '1';
        } else {
          coverBtn.style.background = '#000';
          coverBtn.style.color = '#fff';
          buttonContainer.style.opacity = '0';
        }
        
        // 이미지가 1장만 남으면 화살표 버튼 숨기기
        if (remainingImages.length === 1) {
          const prevBtn = sliderWrapper.querySelector('.slider-prev-btn');
          const nextBtn = sliderWrapper.querySelector('.slider-next-btn');
          if (prevBtn) (prevBtn as HTMLElement).style.display = 'none';
          if (nextBtn) (nextBtn as HTMLElement).style.display = 'none';
        }
      });
      
      deleteButtonContainer.appendChild(deleteBtn);
      
      // 슬라이더에 마우스 올렸을 때 휴지통 버튼도 보이기
      sliderWrapper.addEventListener('mouseenter', () => {
        // 노란색(커버로 지정됨)이 아닐 때만 hover로 보이기
        if (coverBtn.style.background !== 'rgb(255, 217, 61)') {
          buttonContainer.style.opacity = '1';
        }
        deleteButtonContainer.style.opacity = '1';
      });
      sliderWrapper.addEventListener('mouseleave', () => {
        // 노란색(커버로 지정됨)이 아닐 때만 hover 해제 시 숨기기
        if (coverBtn.style.background !== 'rgb(255, 217, 61)') {
          buttonContainer.style.opacity = '0';
        }
        deleteButtonContainer.style.opacity = '0';
      });
      
      sliderWrapper.appendChild(deleteButtonContainer);
      
      // 에디터에 슬라이더 삽입
      const range = savedRangeRef.current;
      if (range) {
        range.deleteContents();
        range.insertNode(sliderWrapper);
        
        const br = document.createElement('br');
        range.setStartAfter(sliderWrapper);
        range.insertNode(br);
        
        range.setStartAfter(br);
        range.setEndAfter(br);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      } else {
        editor.appendChild(sliderWrapper);
        const br = document.createElement('br');
        editor.appendChild(br);
      }
      
      // 첫 번째 이미지를 커버로 설정
      if (!selectedCoverImage && imageSrcs.length > 0) {
        setSelectedCoverImage(imageSrcs[0]);
        coverBtn.style.background = '#FFD93D';
        coverBtn.style.color = '#000';
        buttonContainer.style.opacity = '1';
      }
    });
    
    // input 초기화
    e.target.value = '';
  };

  const execCommand = (command: string, value?: string) => {
    const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;
    
    // 먼저 에디터 포커스
    editor?.focus();
    
    // selection 확인 및 설정
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // selection이 없으면 에디터 끝에 생성
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    // 명령 실행
    document.execCommand(command, false, value);
    
    // 다시 포커스
    editor?.focus();
  };

  const toggleHeading = (tag: 'h2' | 'h3') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let node = range.startContainer as HTMLElement;

    if (node.nodeType === 3) {
      node = node.parentElement as HTMLElement;
    }

    const currentTag = node.tagName?.toLowerCase();

    if (currentTag === tag) {
      document.execCommand('formatBlock', false, 'p');
      setActiveHeading(null);
    } else {
      document.execCommand('formatBlock', false, tag);
      setActiveHeading(tag);
    }
  };

  const handleSaveDraftClick = () => {
    onSaveDraft();
  };

  const handlePublishClick = () => {
    const titleInput = document.querySelector('.title-input') as HTMLInputElement;
    const destinationInput = document.querySelector('.form-input') as HTMLInputElement;
    const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;

    const title = titleInput?.value.trim();
    const destination = destinationInput?.value.trim();
    const content = editor?.innerHTML.trim();

    if (!title) {
      alert('제목을 입력해주세요.');
      titleInput?.focus();
      return;
    }

    if (!destination) {
      alert('목적지를 입력해주세요.');
      destinationInput?.focus();
      return;
    }

    if (!content || content === '여행 이야기를 자유롭게 작성해주세요...') {
      alert('여행 내용을 작성해주세요.');
      editor?.focus();
      return;
    }

    if (!selectedCoverImage) {
      alert('사진을 최소 1장 이상 삽입해주세요.');
      return;
    }

    // 커버 이미지를 전역 변수에 저장 (handlePublish에서 사용)
    (window as any).selectedCoverImageForPublish = selectedCoverImage;

    // onPublish 함수 확인 후 호출
    if (typeof onPublish === 'function') {
      onPublish();
    } else {
      console.error('onPublish is not a function:', onPublish);
      alert('발행 기능에 문제가 발생했습니다. 페이지를 새로고침 해주세요.');
    }
  };

  return (
    <div className="detail-page-container">
      <div className="detail-page-content">
        {/* Header */}
        <div style={{
          background: '#fff',
          padding: '24px',
          marginBottom: '24px',
          border: '3px solid #000',
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          <h1 style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '24px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            {editingStory ? 'EDIT STORY' : 'WRITE NEW STORY'}
          </h1>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={handleSaveDraftClick}
                style={{
                  padding: '10px 20px',
                  border: '3px solid #000',
                  background: '#fff',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '12px',
                  fontFamily: "'Share Tech Mono', monospace",
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#000';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#000';
                }}
              >
                SAVE DRAFT
              </button>
              
              <div
                onClick={onOpenDraftModal}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#000',
                  color: '#fff',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace",
                  border: '2px solid #000',
                  minWidth: '28px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0px rgba(0, 0, 0, 1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#000';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#000';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {drafts.length}
              </div>
            </div>
            
            <button
              onClick={handlePublishClick}
              style={{
                padding: '10px 20px',
                border: '3px solid #000',
                background: '#000',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#000';
                e.currentTarget.style.color = '#fff';
              }}
            >
              PUBLISH
            </button>
          </div>

          {/* X Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // ⭐ 글을 쓴 경우에만 모달 표시
              if (hasContent()) {
                setConfirmAction('back');
                setShowConfirmModal(true);
              } else {
                goBack();
              }
            }}
            style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              width: '40px',
              height: '40px',
              border: '2px solid #000',
              background: '#fff',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
              zIndex: 100
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#000';
              const svg = e.currentTarget.querySelector('svg');
              if (svg) (svg as SVGElement).style.fill = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              const svg = e.currentTarget.querySelector('svg');
              if (svg) (svg as SVGElement).style.fill = '#000';
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              style={{ 
                width: '24px',
                height: '24px',
                fill: '#000',
                transition: 'fill 0.2s',
                pointerEvents: 'none'
              }}
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Form Container */}
        <div style={{
          background: '#fff',
          padding: '40px',
          border: '3px solid #000',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)'
        }}>
          {/* Title */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              marginBottom: '12px',
              color: 'rgba(0,0,0,0.6)',
              textTransform: 'uppercase',
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: '1px'
            }}>
              TITLE *
            </label>
            <input
              type="text"
              className="title-input"
              placeholder="여행 제목을 입력하세요..."
              defaultValue={editingStory?.title || currentDraft?.title || ''}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #000',
                fontSize: '16px',
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: 700,
                outline: 'none'
              }}
            />
          </div>

          {/* Form Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            marginBottom: '40px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '12px',
                color: 'rgba(0,0,0,0.6)',
                textTransform: 'uppercase',
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: '1px'
              }}>
                DESTINATION *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="예: 경주"
                defaultValue={editingStory?.destination || currentDraft?.destination || ''}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #000',
                  fontSize: '13px',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '12px',
                color: 'rgba(0,0,0,0.6)',
                textTransform: 'uppercase',
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: '1px'
              }}>
                DURATION
              </label>
              <select
                className="form-select"
                defaultValue={editingStory?.duration || currentDraft?.duration || '선택하세요'}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #000',
                  fontSize: '13px',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option>선택하세요</option>
                <option>당일치기</option>
                <option>1박 2일</option>
                <option>2박 3일</option>
                <option>3박 4일</option>
                <option>4박 5일</option>
                <option>5박 6일</option>
                <option>1주일 이상</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '12px',
                color: 'rgba(0,0,0,0.6)',
                textTransform: 'uppercase',
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: '1px'
              }}>
                DEPARTURE DATE
              </label>
              <input
                type="date"
                className="form-input"
                defaultValue={editingStory?.departureDate || currentDraft?.departureDate || ''}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #000',
                  fontSize: '13px',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '12px',
                color: 'rgba(0,0,0,0.6)',
                textTransform: 'uppercase',
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: '1px'
              }}>
                BUDGET (₩)
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="328000"
                defaultValue={editingStory?.budget || currentDraft?.budget || ''}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #000',
                  fontSize: '13px',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Travel Style */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              marginBottom: '12px',
              color: 'rgba(0,0,0,0.6)',
              textTransform: 'uppercase',
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: '1px'
            }}>
              TRAVEL STYLE
            </label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              {['힐링여행', '액티비티', '맛집투어', '문화탐방', '쇼핑', '사진명소', '가성비', '럭셔리'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="style-tag"
                  style={{
                    padding: '8px 16px',
                    border: '2px solid #000',
                    background: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: "'Share Tech Mono', monospace",
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    const isActive = btn.style.background === 'rgb(0, 0, 0)';
                    btn.style.background = isActive ? '#fff' : '#000';
                    btn.style.color = isActive ? '#000' : '#fff';
                    if (!isActive) {
                      btn.style.boxShadow = '2px 2px 0px rgba(0,0,0,1)';
                      btn.style.transform = 'translate(-1px, -1px)';
                    } else {
                      btn.style.boxShadow = 'none';
                      btn.style.transform = 'none';
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>


          {/* Content Editor */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              marginBottom: '12px',
              color: 'rgba(0,0,0,0.6)',
              textTransform: 'uppercase',
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: '1px'
            }}>
              CONTENT * 
            </label>

            {/* Toolbar */}
            <div style={{
              display: 'flex',
              gap: '0',
              background: '#f5f5f5',
              border: '2px solid #000',
              borderBottom: 'none'
            }}>
              <button
                type="button"
                onClick={() => toggleHeading('h2')}
                style={{
                  width: '50px',
                  height: '50px',
                  border: 'none',
                  borderRight: '2px solid #000',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace",
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  textDecoration: activeHeading === 'h2' ? 'underline' : 'none',
                  textDecorationThickness: '3px',
                  textUnderlineOffset: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                title="헤딩"
              >
                H
              </button>
              <button
                type="button"
                onClick={() => toggleHeading('h3')}
                style={{
                  width: '50px',
                  height: '50px',
                  border: 'none',
                  borderRight: '2px solid #000',
                  background: 'transparent',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace",
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  textDecoration: activeHeading === 'h3' ? 'underline' : 'none',
                  textDecorationThickness: '3px',
                  textUnderlineOffset: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                title="서브헤딩"
              >
                h
              </button>
              <button
                type="button"
                onClick={() => execCommand('bold')}
                style={{
                  width: '50px',
                  height: '50px',
                  border: 'none',
                  borderRight: '2px solid #000',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace",
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                title="볼드"
              >
                B
              </button>

              <button
                type="button"
                onClick={() => {
                  const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;
                  editor?.focus();
                  
                  const selection = window.getSelection();
                  if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    let node = range.startContainer as HTMLElement;
                    
                    // 텍스트 노드면 부모 요소로
                    if (node.nodeType === 3) {
                      node = node.parentElement as HTMLElement;
                    }
                    
                    // 현재 ol 안에 있는지 확인
                    let currentList = node.closest('ol');
                    
                    if (currentList && currentList.parentElement === editor) {
                      // 목록 해제: ol을 p로 변환
                      const listItems = Array.from(currentList.querySelectorAll('li'));
                      listItems.forEach(li => {
                        const p = document.createElement('p');
                        p.innerHTML = li.innerHTML;
                        currentList!.parentNode!.insertBefore(p, currentList);
                      });
                      currentList.remove();
                      setActiveList(null);
                    } else {
                      // 목록 적용
                      const ol = document.createElement('ol');
                      ol.style.marginLeft = '20px';
                      ol.style.marginTop = '10px';
                      ol.style.marginBottom = '10px';
                      
                      const li = document.createElement('li');
                      li.innerHTML = '<br>';
                      ol.appendChild(li);
                      
                      range.deleteContents();
                      range.insertNode(ol);
                      
                      // 커서를 li 안으로 이동
                      range.setStart(li, 0);
                      range.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(range);
                      
                      setActiveList('ol');
                    }
                  }
                  
                  editor?.focus();
                }}
                style={{
                  width: '50px',
                  height: '50px',
                  border: 'none',
                  borderRight: '2px solid #000',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                title="숫자 목록"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zM8 6h12M8 11h12M8 16h12"
                    stroke="#000"
                    strokeWidth="2"
                  />
                </svg>
                {activeList === 'ol' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '30px',
                    height: '3px',
                    background: '#000'
                  }} />
                )}
              </button>


             <button
              type="button"
              onClick={() => {
                const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;
                editor?.focus();
                
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  let node = range.startContainer as HTMLElement;
                  
                  // 텍스트 노드면 부모 요소로
                  if (node.nodeType === 3) {
                    node = node.parentElement as HTMLElement;
                  }
                  
                  // 현재 ul 안에 있는지 확인
                  let currentList = node.closest('ul');
                  
                  if (currentList && currentList.parentElement === editor) {
                    // 목록 해제: ul을 p로 변환
                    const listItems = Array.from(currentList.querySelectorAll('li'));
                    listItems.forEach(li => {
                      const p = document.createElement('p');
                      p.innerHTML = li.innerHTML;
                      currentList!.parentNode!.insertBefore(p, currentList);
                    });
                    currentList.remove();
                    setActiveList(null);
                  } else {
                    // 목록 적용
                    const ul = document.createElement('ul');
                    ul.style.marginLeft = '20px';
                    ul.style.marginTop = '10px';
                    ul.style.marginBottom = '10px';
                    
                    const li = document.createElement('li');
                    li.innerHTML = '<br>';
                    ul.appendChild(li);
                    
                    range.deleteContents();
                    range.insertNode(ul);
                    
                    // 커서를 li 안으로 이동
                    range.setStart(li, 0);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    setActiveList('ul');
                  }
                }
                
                editor?.focus();
              }}
              style={{
                width: '50px',
                height: '50px',
                border: 'none',
                borderRight: '2px solid #000',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="기호 목록"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="5" cy="6" r="1.5" fill="#000" />
                <circle cx="5" cy="12" r="1.5" fill="#000" />
                <circle cx="5" cy="18" r="1.5" fill="#000" />
                <line x1="9" y1="6" x2="21" y2="6" stroke="#000" strokeWidth="2" />
                <line x1="9" y1="12" x2="21" y2="12" stroke="#000" strokeWidth="2" />
                <line x1="9" y1="18" x2="21" y2="18" stroke="#000" strokeWidth="2" />
              </svg>
              {activeList === 'ul' && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '30px',
                  height: '3px',
                  background: '#000'
                }} />
              )}
            </button>


              <label
                style={{
                  width: '50px',
                  height: '50px',
                  borderRight: '2px solid #000',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                title="이미지 삽입 (커서 위치에 삽입됩니다)"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  style={{ 
                    width: '24px', 
                    height: '24px',
                    fill: '#000'
                  }}
                >
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageInsert}
                  style={{ display: 'none' }}
                />
              </label>
              
              <button
                type="button"
                onClick={() => execCommand('justifyCenter')}
                style={{
                  width: '50px',
                  height: '50px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                title="가운데 정렬"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  style={{ 
                    width: '20px', 
                    height: '20px',
                    fill: '#000'
                  }}
                >
                  <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
                </svg>
              </button>
            </div>

            {/* Editor */}
            <div
              className="blog-editor-wysiwyg"
              contentEditable="true"

              onKeyUp={() => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  savedRangeRef.current = sel.getRangeAt(0);
                }
              }}
              onMouseUp={() => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  savedRangeRef.current = sel.getRangeAt(0);
                }
              }}

              dangerouslySetInnerHTML={
                (editingStory || currentDraft) 
                  ? { __html: editingStory?.description || currentDraft?.content || '' } 
                  : undefined
              }
              style={{
                width: '100%',
                minHeight: '600px',
                padding: '30px',
                border: '2px solid #000',
                fontSize: '15px',
                lineHeight: '1.8',
                fontFamily: "'Share Tech Mono', monospace",
                outline: 'none',
                background: '#fff'
              }}
            ></div>
          </div>
        </div>

        <style>{`
          .blog-editor-wysiwyg:empty:before {
            content: "여행 이야기를 자유롭게 작성해주세요...";
            color: #999;
          }
          .blog-editor-wysiwyg h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 30px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 3px solid #000;
          }
          .blog-editor-wysiwyg h3 {
            font-size: 18px;
            font-weight: 700;
            margin: 25px 0 12px 0;
          }
          .blog-editor-wysiwyg p {
            margin: 15px 0;
          }
          .blog-editor-wysiwyg ol {
            margin: 15px 0;
            padding-left: 30px;
            list-style-type: decimal;
          }
          .blog-editor-wysiwyg ul {
            margin: 15px 0;
            padding-left: 30px;
            list-style-type: disc;
          }
          .blog-editor-wysiwyg li {
            margin: 8px 0;
            line-height: 1.8;
          }
          .blog-editor-wysiwyg img {
            width: 693px;
            height: 619px;
            max-width: 100%;
            object-fit: cover;
            display: block;
            margin: 0 auto;
          }
          .blog-editor-wysiwyg hr {
            border: none;
            border-top: 3px solid #000;
            margin: 30px 0;
          }
          .blog-editor-wysiwyg .inserted-image-wrapper {
            position: relative;
            text-align: center;
            margin: 20px auto;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            gap: 10px;
            max-width: 100%;
            overflow: visible;
          }
          .blog-editor-wysiwyg .image-slider-wrapper {
            position: relative;
            width: 693px;
            max-width: 100%;
            margin: 20px auto;
            background: #f5f5f5;
            border: 3px solid #000;
            box-shadow: 4px 4px 0px rgba(0, 0, 0, 1);
          }
          .blog-editor-wysiwyg .slider-images-container {
            position: relative;
            width: 100%;
            height: 619px;
            overflow: hidden;
          }
          .blog-editor-wysiwyg .slider-prev-btn,
          .blog-editor-wysiwyg .slider-next-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.5);
            color: #fff;
            border: 2px solid #fff;
            font-size: 28px;
            font-weight: 700;
            cursor: pointer;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }
          .blog-editor-wysiwyg .slider-prev-btn {
            left: 12px;
          }
          .blog-editor-wysiwyg .slider-next-btn {
            right: 12px;
          }
          .blog-editor-wysiwyg .slider-prev-btn:hover,
          .blog-editor-wysiwyg .slider-next-btn:hover {
            background: rgba(0, 0, 0, 0.8);
          }
          .blog-editor-wysiwyg .slider-indicator {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            padding: 4px 12px;
            border-radius: 12px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            z-index: 10;
          }
          .blog-editor-wysiwyg .image-button-container {
            user-select: none;
            -webkit-user-select: none;
          }
          .blog-editor-wysiwyg .image-cover-btn:hover,
          .blog-editor-wysiwyg .image-delete-btn:hover {
            transform: translate(-1px, -1px);
          }
        `}</style>

        {/* 확인 모달 */}
        <ConfirmModal
          show={showConfirmModal}
          title="페이지 나가기"
          message={`지금 나가시겠습니까?\n변경사항이 저장되지 않을 수 있습니다.`}
          confirmText="나가기"
          cancelText="취소"
          onConfirm={() => {
            setShowConfirmModal(false);
            goBack();
          }}
          onCancel={() => {
            setShowConfirmModal(false);
          }}
        />
      </div>
    </div>
  );
}

export default WritePage;