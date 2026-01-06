import { useState } from 'react';

interface Comment {
  id: number;
  author: string;
  authorAvatar: string;
  content: string;
  date: string;
}

function CommentSection() {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      author: '김여행',
      authorAvatar: '김',
      content: '정보 감사합니다! 저도 다음 달에 가보려고 해요 ^^',
      date: '2023.12.28'
    },
    {
      id: 2,
      author: '박바다',
      authorAvatar: '박',
      content: '사진이 너무 예쁘네요! 혹시 카메라 뭐 쓰시나요?',
      date: '2023.12.29'
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now(),
      author: '나',
      authorAvatar: '나',
      content: newComment,
      date: new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1)
    };
    
    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleReportClick = (commentId: number) => {
    setReportingCommentId(commentId);
    setShowReportModal(true);
    setSelectedReportReason('');
  };

  const handleReportSubmit = () => {
    if (!selectedReportReason) {
      alert('신고 사유를 선택해주세요.');
      return;
    }
    alert('신고가 접수되었습니다.');
    setShowReportModal(false);
    setReportingCommentId(null);
    setSelectedReportReason('');
  };

  const reportReasons = [
    '스팸입니다.',
    '음란물입니다.',
    '욕설/혐오표현이 있습니다.',
    '불쾌한 표현이 있습니다.'
  ];

  return (
    <>
      <div style={{
        background: '#fff',
        padding: '40px',
        border: '3px solid #000',
        boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
        marginTop: '30px'
      }}>
        {/* 댓글 헤더 */}
        <h3 style={{
          fontSize: '18px',
          fontWeight: 700,
          fontFamily: "'Share Tech Mono', monospace",
          textTransform: 'uppercase',
          marginBottom: '25px',
          paddingBottom: '15px',
          borderBottom: '2px solid #000'
        }}>
          COMMENTS ({comments.length})
        </h3>

        {/* 댓글 목록 */}
        <div style={{ marginBottom: '30px' }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: '20px',
                marginBottom: '15px',
                border: '2px solid #000',
                background: '#fafafa',
                position: 'relative'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#000',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '14px'
                }}>
                  {comment.authorAvatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: "'Share Tech Mono', monospace",
                    marginBottom: '4px'
                  }}>
                    {comment.author}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#999',
                    fontFamily: "'Share Tech Mono', monospace"
                  }}>
                    {comment.date}
                  </div>
                </div>
                {/* 신고하기 버튼 */}
                <button
                  onClick={() => handleReportClick(comment.id)}
                  style={{
                    padding: '6px 12px',
                    border: '2px solid #000',
                    background: '#fff',
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: "'Share Tech Mono', monospace",
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    letterSpacing: '0.5px'
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
                  신고하기
                </button>
              </div>
              <div style={{
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: "'Share Tech Mono', monospace"
              }}>
                {comment.content}
              </div>
            </div>
          ))}
        </div>

{/* 댓글 작성 */}
<div style={{
  borderTop: '2px dashed rgba(0,0,0,0.2)',
  paddingTop: '25px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end'  /* 오른쪽 정렬 */
}}>
  <textarea
    value={newComment}
    onChange={(e) => setNewComment(e.target.value)}
    placeholder="댓글을 입력하세요..."
    style={{
      width: '100%',
      minHeight: '100px',
      padding: '15px',
      border: '2px solid #000',
      fontSize: '14px',
      fontFamily: "'Share Tech Mono', monospace",
      resize: 'vertical',
      outline: 'none',
      marginBottom: '15px'
    }}
  />
  <button
    onClick={handleAddComment}
    style={{
      padding: '10px 20px',  /* 12px 30px에서 축소 */
      border: '3px solid #000',
      background: '#000',
      color: '#fff',
      fontSize: '11px',  /* 12px에서 11px로 축소 */
      fontWeight: 700,
      fontFamily: "'Share Tech Mono', monospace",
      textTransform: 'uppercase',
      cursor: 'pointer',
      boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
      transition: 'all 0.2s',
      letterSpacing: '1px'
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
    POST COMMENT
  </button>
</div>
      </div>

      {/* 신고 모달 */}
      {showReportModal && (
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
            zIndex: 10000
          }}
          onClick={() => setShowReportModal(false)}
        >
          <div 
            style={{
              background: '#fff',
              border: '3px solid #000',
              minWidth: '500px',
              maxWidth: '600px',
              boxShadow: '8px 8px 0px rgba(0, 0, 0, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{
              background: '#000',
              color: '#fff',
              padding: '20px 30px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: 0
              }}>
                댓글 신고
              </h2>
              <button 
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '32px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: 0
                }}
              >
                ×
              </button>
            </div>

            {/* 모달 바디 */}
            <div style={{
              padding: '30px'
            }}>
              <div style={{
                fontSize: '14px',
                fontFamily: "'Share Tech Mono', monospace",
                marginBottom: '25px',
                color: '#333',
                lineHeight: 1.6
              }}>
                <strong>신고하기 전에 참고!</strong>
                <br /><br />
                개인정보 언급 및 명예훼손, 저작권/상표권 침해, 청소년 유해물 등은 별도 문의하시기 바랍니다.
                <br />
                허위신고나 중복신고 시 서비스 이용에 제약이 있을 수 있습니다.
              </div>

              <div style={{
                background: '#f5f5f5',
                border: '2px solid #000',
                padding: '20px'
              }}>
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: "'Share Tech Mono', monospace",
                  textTransform: 'uppercase',
                  marginBottom: '15px',
                  color: '#000'
                }}>
                  사유선택
                </h3>
                {reportReasons.map((reason, index) => (
                  <label 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontFamily: "'Share Tech Mono', monospace"
                    }}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={selectedReportReason === reason}
                      onChange={(e) => setSelectedReportReason(e.target.value)}
                      style={{
                        marginRight: '10px',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                    {reason}
                  </label>
                ))}
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '25px'
              }}>
                <button
                  onClick={() => setShowReportModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '3px solid #000',
                    background: '#fff',
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: "'Share Tech Mono', monospace",
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    letterSpacing: '1px'
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
                  취소
                </button>
                <button
                  onClick={handleReportSubmit}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '3px solid #000',
                    background: '#000',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: "'Share Tech Mono', monospace",
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
                    transition: 'all 0.2s',
                    letterSpacing: '1px'
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
                  신고하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CommentSection;