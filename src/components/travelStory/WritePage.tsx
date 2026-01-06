import { useState } from 'react';

interface WritePageProps {
  editingStory?: any;
  currentDraft?: any;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

function WritePage({ 
  editingStory, 
  currentDraft, 
  onBack, 
  onSaveDraft, 
  onPublish 
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
        alignItems: 'center'
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
        <button
          onClick={onBack}
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
            transition: 'all 0.2s'
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
          ← BACK
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
                color: '#999'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '15px' }}>+</div>
                <div style={{ 
                  fontSize: '12px',
                  fontFamily: "'Share Tech Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
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
        <div style={{ marginBottom: '30px' }}>
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
              title="Heading"
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
              title="Subheading"
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
              title="Bold"
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
                fontSize: '18px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Insert Image"
            >
              📷
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
              title="Horizontal Line"
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

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          borderTop: '2px dashed rgba(0,0,0,0.2)',
          paddingTop: '30px'
        }}>
          <button
            onClick={onSaveDraft}
            style={{
              flex: 1,
              padding: '15px',
              border: '3px solid #000',
              background: '#fff',
              color: '#000',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: "'Share Tech Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
              transition: 'all 0.2s'
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
          <button
            onClick={onPublish}
            style={{
              flex: 1,
              padding: '15px',
              border: '3px solid #000',
              background: '#000',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: "'Share Tech Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '1px',
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