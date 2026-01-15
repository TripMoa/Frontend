import { useEffect, useState } from 'react';

interface Comment {
  id: number;
  author: string;
  authorAvatar: string;
  content: string;
  date: string;
}

interface CommentSectionProps {
  storyId: number;
}

function CommentSection({ storyId }: CommentSectionProps) {
  const STORAGE_KEY = `comments_${storyId}`;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false); // ✅ 로드 완료 플래그

  /* ================= 로컬스토리지 로드 ================= */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setComments(JSON.parse(saved));
    }
    setLoaded(true); // ✅ 로드 끝
  }, [STORAGE_KEY]);

  /* ================= 로컬스토리지 저장 ================= */
  useEffect(() => {
    if (!loaded) return; // ✅ 로드 전에는 저장 금지
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  }, [comments, STORAGE_KEY, loaded]);

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now(),
      author: '나',
      authorAvatar: '나',
      content: newComment,
      date: new Date()
        .toLocaleDateString('ko-KR')
        .replace(/\. /g, '.')
        .slice(0, -1)
    };

    // 처음 댓글이 위, 새 댓글은 아래
    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleEditSave = (id: number) => {
    setComments(
      comments.map((c) =>
        c.id === id ? { ...c, content: editingContent } : c
      )
    );
    setEditingId(null);
    setEditingContent('');
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget === null) return;
    setComments(comments.filter((c) => c.id !== deleteTarget));
    setDeleteTarget(null);
  };

  return (
    <div
      style={{
        background: '#fff',
        border: '3px solid #000',
        padding: '30px',
        marginTop: '40px',
        boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)'
      }}
    >
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 700,
          fontFamily: "'Share Tech Mono', monospace",
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '3px solid #000'
        }}
      >
        COMMENTS ({comments.length})
      </h3>

      {/* 댓글 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
        {comments.map((comment) => (
          <div
            key={comment.id}
            style={{
              padding: '20px',
              border: '2px solid #000',
              background: '#f9f9f9',
              position: 'relative'
            }}
          >
            {/* 수정 | 삭제 */}
            {comment.author === '나' && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  fontSize: '11px',
                  fontFamily: "'Share Tech Mono', monospace",
                  color: '#999',
                  display: 'flex',
                  gap: '6px'
                }}
              >
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditingContent(comment.content);
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#000')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
                >
                  EDIT
                </span>
                <span>|</span>
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDeleteTarget(comment.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#d00000')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
                >
                  DELETE
                </span>
              </div>
            )}

            {/* 작성자 */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  background: '#000',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                {comment.authorAvatar}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{comment.author}</div>
                <div style={{ fontSize: '11px', color: '#999' }}>{comment.date}</div>
              </div>
            </div>

            {/* 내용 / 수정 */}
            {editingId === comment.id ? (
              <>
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    border: '2px solid #000',
                    padding: '10px',
                    fontFamily: "'Share Tech Mono', monospace",
                    marginBottom: '10px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => handleEditSave(comment.id)}
                    style={{
                      border: '2px solid #000',
                      background: '#000',
                      color: '#fff',
                      padding: '6px 12px',
                      fontWeight: 700,
                      fontSize: '11px',
                      fontFamily: "'Share Tech Mono', monospace"
                    }}
                  >
                    SAVE
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      border: '2px solid #000',
                      background: '#fff',
                      padding: '6px 12px',
                      fontWeight: 700,
                      fontSize: '11px',
                      fontFamily: "'Share Tech Mono', monospace"
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: "'Share Tech Mono', monospace",
                  color: '#333',
                  paddingLeft: '48px'
                }}
              >
                {comment.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 댓글 작성 */}
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="댓글을 작성해주세요..."
        style={{
          width: '100%',
          minHeight: '120px',
          padding: '15px',
          border: '2px solid #000',
          fontFamily: "'Share Tech Mono', monospace",
          marginBottom: '12px'
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSubmit}
          style={{
            padding: '12px 24px',
            border: '3px solid #000',
            background: '#000',
            color: '#fff',
            fontWeight: 700,
            fontSize: '12px',
            fontFamily: "'Share Tech Mono', monospace"
          }}
        >
          POST COMMENT
        </button>
      </div>

      {/* ================= 삭제 확인 모달 (통일된 디자인) ================= */}
      {deleteTarget !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              border: '3px solid #000',
              boxShadow: '15px 15px 0px #000',
              width: '360px'
            }}
          >
            {/* 헤더 */}
            <div
              style={{
                background: '#000',
                color: '#fff',
                padding: '12px 20px'
              }}
            >
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '16px',
                  fontWeight: 900,
                  letterSpacing: '1px'
                }}
              >
                댓글 삭제
              </span>
            </div>

            {/* 본문 */}
            <div style={{ padding: '24px' }}>
              <p
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '14px',
                  lineHeight: '1.6',
                  marginBottom: '24px'
                }}
              >
                댓글을 삭제하시겠습니까?<br />
                삭제된 댓글은 복구할 수 없습니다.
              </p>

              {/* 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setDeleteTarget(null)}
                  style={{
                    border: '2px solid #000',
                    background: '#fff',
                    padding: '8px 16px',
                    fontWeight: 900,
                    fontSize: '12px',
                    fontFamily: "'Share Tech Mono', monospace",
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  style={{
                    border: '2px solid #d00000',
                    background: '#fff',
                    color: '#d00000',
                    padding: '8px 16px',
                    fontWeight: 900,
                    fontSize: '12px',
                    fontFamily: "'Share Tech Mono', monospace",
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#d00000';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#d00000';
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommentSection;