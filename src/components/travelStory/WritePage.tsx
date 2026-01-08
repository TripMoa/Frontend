import { useState } from 'react';

interface WritePageProps {
  editingStory?: any;
  currentDraft?: any;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  drafts: any[];
  onShowDraftModal: () => void;
}

function WritePage({ 
  editingStory, 
  currentDraft, 
  onBack, 
  onSaveDraft, 
  onPublish,
  drafts,
  onShowDraftModal
}: WritePageProps) {
  const [coverImage, setCoverImage] = useState<string | null>(editingStory?.image || null);

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = event.target?.result as string;
        const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;
        if (editor) {
          const imgHtml = `<img src="${img}" alt="uploaded" style="max-width: 100%; margin: 20px auto; display: block; border: 3px solid #000;" />`;
          document.execCommand('insertHTML', false, imgHtml);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;
    editor?.focus();
  };

  const handleSaveDraftClick = () => {
    onSaveDraft(); // 임시저장 실행
  };

  const handlePublishClick = () => {
    // 필수 필드 검증
    const titleInput = document.querySelector('.title-input') as HTMLInputElement;
    const destinationInput = document.querySelector('.form-input') as HTMLInputElement;
    const editor = document.querySelector('.blog-editor-wysiwyg') as HTMLDivElement;

    const title = titleInput?.value.trim();
    const destination = destinationInput?.value.trim();
    const content = editor?.innerText.trim();

    // 필수 필드가 비어있는지 확인
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

    // 모든 검증 통과시 발행
    onPublish();
  };

  return (
    <div className="write-page-container">
{/* Header - Mate Style */}
<div style={{
  background: '#fff',
  padding: '24px',
  marginBottom: '24px',
  border: '3px solid #000',
  boxShadow: '8px 8px 0px rgba(0, 0, 0, 1)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'relative'  // X 버튼 위치 잡기 위해
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
    {/* SAVE DRAFT 버튼 (클릭시 임시저장 + 숫자 배지) */}
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
      
      {/* 숫자 배지 - SAVE DRAFT 버튼 오른쪽 */}
      <div
        onClick={onShowDraftModal}
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

  {/* X Button - 헤더 박스 오른쪽 위 */}
  <button
    onClick={onBack}
    style={{
      position: 'absolute',
      top: '-15px',
      right: '-15px',
      border: 'none',
      background: '#fff',
      cursor: 'pointer',
      padding: '4px',
      lineHeight: 1,
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
      zIndex: 10
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
        transition: 'fill 0.2s'
      }}
    >
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  </button>
</div>

      {/* Form Container - Mate Style */}
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

{/* Cover Image */}
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
    COVER IMAGE
  </label>
  <label style={{
    display: 'block',
    width: '100%',
    height: '350px',
    border: '3px dashed #000',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    background: '#fafafa'
  }}>
    {coverImage ? (
      <img 
        src={coverImage} 
        alt="cover" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover' 
        }} 
      />
    ) : (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#999',
        gap: '15px'
      }}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          style={{ 
            width: '64px', 
            height: '64px',
            fill: '#999'
          }}
        >
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
        <div style={{ 
          fontSize: '12px',
          fontFamily: "'Share Tech Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 700
        }}>
          ADD COVER IMAGE
        </div>
      </div>
    )}
    <input
      type="file"
      accept="image/*"
      onChange={handleCoverImageUpload}
      style={{ display: 'none' }}
    />
  </label>
</div>

        {/* Form Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {/* Destination */}
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

          {/* Duration */}
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
              defaultValue={editingStory?.duration || currentDraft?.duration || ''}
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

          {/* Departure Date */}
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

          {/* Budget */}
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
      onClick={() => execCommand('formatBlock', '<h2>')}
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
      title="헤딩"
    >
      H
    </button>
    <button
      type="button"
      onClick={() => execCommand('formatBlock', '<h3>')}
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
        transition: 'background 0.2s'
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
      title="이미지 삽입"
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
        onChange={handleImageInsert}
        style={{ display: 'none' }}
      />
    </label>
    <button
      type="button"
      onClick={() => execCommand('insertHorizontalRule')}
      style={{
        width: '50px',
        height: '50px',
        border: 'none',
        background: 'transparent',
        fontSize: '18px',
        fontFamily: "'Share Tech Mono', monospace",
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      title="구분선"
    >
      —
    </button>
  </div>

  {/* Editor */}
  <div
    className="blog-editor-wysiwyg"
    contentEditable="true"
    dangerouslySetInnerHTML={
      (editingStory || currentDraft) 
        ? { __html: editingStory?.description || currentDraft?.content || '' } 
        : undefined
    }
    style={{
      width: '100%',
      minHeight: '400px',
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
        .blog-editor-wysiwyg img {
          max-width: 100%;
          margin: 20px auto;
          display: block;
          border: 3px solid #000;
        }
        .blog-editor-wysiwyg hr {
          border: none;
          border-top: 3px solid #000;
          margin: 30px 0;
        }
      `}</style>
    </div>
  );
}

export default WritePage;