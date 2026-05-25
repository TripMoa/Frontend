// src/features/travelStory/components/CommentSection.tsx
import { useEffect, useState } from "react";
import ReportModal from "../components/modals/ReportModal";
import * as commentAPI from "../../../api/comments.api";
import { getMyInfo } from "../../../api/auth.api";
import { useAuth } from "../../user/pages/AuthContext";
import { submitReport } from '../../../api/report.api';
import "../styles/CommentSection.css";
import Filter from "badwords-ko";
const filter = new Filter();

interface CommentSectionProps {
  storyId: number;
  storyAuthorId?: number;
  onCommentCountChange?: (count: number) => void;
}

function CommentSection({
  storyId,
  storyAuthorId,
  onCommentCountChange,
}: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reportTargetId, setReportTargetId] = useState<number | null>(null);
  const [openMoreId, setOpenMoreId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentUser(null);
      return;
    }
    loadCurrentUser();
  }, [isAuthenticated]);

  useEffect(() => {
    loadComments();
  }, [storyId]);

  // 댓글 수 변경 시 부모 컴포넌트에 전달
  useEffect(() => {
    if (onCommentCountChange) {
      onCommentCountChange(comments.length);
    }
  }, [comments.length, onCommentCountChange]);

  // 현재 로그인한 유저 정보 로드
  const loadCurrentUser = async () => {
    try {
      const response = await getMyInfo();
      setCurrentUser(response.data);
    } catch (err) {
      console.error("Failed to load user info:", err);
    }
  };

  // 특정 스토리의 댓글 목록 로드
  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await commentAPI.getComments(storyId);
      setComments(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "댓글을 불러오는데 실패했습니다.",
      );
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 작성 (금칙어 필터링 포함)
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setError("댓글을 작성하려면 로그인이 필요합니다.");
      return;
    }

    if (!newComment.trim()) return;

    if (filter.isProfane(newComment)) {
      setError("부적절한 단어가 포함되어 있습니다.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await commentAPI.createComment(storyId, {
        content: newComment,
      });
      setNewComment("");
      await loadComments();
    } catch (err: any) {
      setError(err.response?.data?.message || "댓글 작성에 실패했습니다.");
      console.error("Failed to create comment:", err);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 수정 저장
  const handleEditSave = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await commentAPI.updateComment(id, {
        content: editingContent,
      });
      setEditingId(null);
      setEditingContent("");
      await loadComments();
    } catch (err: any) {
      setError(err.response?.data?.message || "댓글 수정에 실패했습니다.");
      console.error("Failed to update comment:", err);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 삭제 확인 후 처리
  const handleDeleteConfirm = async () => {
    if (deleteTarget === null) return;

    try {
      setLoading(true);
      setError(null);
      await commentAPI.deleteComment(deleteTarget);
      setDeleteTarget(null);
      await loadComments();
    } catch (err: any) {
      setError(err.response?.data?.message || "댓글 삭제에 실패했습니다.");
      console.error("Failed to delete comment:", err);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 작성자 정보 반환 (author 객체 없을 경우 authorId로 fallback)
  const getAuthorInfo = (comment: any) => {
    if (comment.author) {
      return comment.author;
    }

    if (comment.authorId) {
      return {
        id: comment.authorId,
        // nickname 우선, 없으면 name
        name:
          currentUser?.id === comment.authorId
            ? currentUser.nickname || currentUser.name
            : "사용자",
        // profileImage 또는 avatar 우선
        avatar:
          currentUser?.id === comment.authorId
            ? currentUser.profileImage ||
              currentUser.avatar ||
              (currentUser.nickname || currentUser.name)?.charAt(0) ||
              "?"
            : "?",
      };
    }

    return { id: 0, name: "알 수 없음", avatar: "?" };
  };

  // 현재 로그인한 유저의 댓글 여부 확인
  const isMyComment = (comment: any) => {
    if (comment.author?.id) {
      return currentUser && comment.author.id === currentUser.id;
    }

    if (comment.authorId) {
      return currentUser && comment.authorId === currentUser.id;
    }

    return false;
  };


  return (
    <div className="comment-section">
      <h3 className="comment-section-title">COMMENTS ({comments.length})</h3>

      {error && <div className="comment-error">{error}</div>}

      {loading && <div className="comment-loading">Loading...</div>}

      <div className="comments-list">
        {comments.map((comment) => {
          const author = getAuthorInfo(comment);
          // nickname 우선, 없으면 name
          const displayName = author.nickname || author.name || "알 수 없음";

          return (
            <div key={comment.id} className="comment-item">
              {isMyComment(comment) && (
                <div className="comment-actions">
                  <span
                    className="comment-action-btn"
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditingContent(comment.content);
                    }}
                  >
                    EDIT
                  </span>
                  <span>|</span>
                  <span
                    className="comment-action-btn delete"
                    onClick={() => setDeleteTarget(comment.id)}
                  >
                    DELETE
                  </span>
                </div>
              )}

              {/* 남의 댓글일 때만 */}
              {isAuthenticated && !isMyComment(comment) && (
                <button
                  className="comment-report-btn"
                  onClick={() => setReportTargetId(comment.id)}
                  disabled={loading}
                >
                  {"신고하기"}
                </button>
              )}

              <div className="comment-author-info">
                {/* 프로필 사진 - 이미지 또는 텍스트 */}
                <div className="comment-avatar">
                  {(() => {
                    const a = comment.author as any;
                    if (a?.profileType === 'CUSTOM' && a?.profileImage) {
                      return <img src={a.profileImage} alt={displayName} />;
                    }
                    if (a?.avatarEmoji) {
                      return <span style={{ fontSize: '18px' }}>{a.avatarEmoji}</span>;
                    }
                    return displayName?.charAt(0)?.toUpperCase() || '?';
                  })()}
                </div>
                <div>
                  <div className="comment-author-name">
                    {displayName}
                    {comment.author?.id === storyAuthorId && (
                      <span className="comment-author-badge">작성자</span>
                    )}
                  </div>
                  <div className="comment-date">
                    {comment.date ||
                      new Date(comment.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {editingId === comment.id ? (
                <>
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    disabled={loading}
                    className="comment-edit-textarea"
                  />
                  <div className="comment-edit-actions">
                    <button
                      onClick={() => handleEditSave(comment.id)}
                      disabled={loading}
                      className="comment-btn save"
                    >
                      {loading ? "SAVING..." : "SAVE"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={loading}
                      className="comment-btn cancel"
                    >
                      CANCEL
                    </button>
                  </div>
                </>
              ) : (
                <div className="comment-content">{comment.content}</div>
              )}
            </div>
          );
        })}
      </div>

      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder={
          isAuthenticated
            ? "댓글을 작성해주세요..."
            : "로그인 후 댓글을 작성할 수 있습니다."
        }
        disabled={loading || !isAuthenticated}
        className="comment-textarea"
      />
      <div className="comment-submit-wrapper">
        <button
          onClick={handleSubmit}
          disabled={loading || !newComment.trim() || !isAuthenticated}
          className="comment-submit-btn"
        >
          {loading ? "POSTING..." : "POST COMMENT"}
        </button>
      </div>

      <ReportModal
        show={reportTargetId !== null}
        targetType="댓글"
        targetAuthor={
          comments.find((c) => c.id === reportTargetId)?.author?.nickname ||
          comments.find((c) => c.id === reportTargetId)?.author?.name
        }
        targetContent={comments.find((c) => c.id === reportTargetId)?.content}
        onClose={() => setReportTargetId(null)}
        onSubmit={(reason, detail) => {
          const comment = comments.find((c) => c.id === reportTargetId);
          if(!comment || !reportTargetId) return;

          submitReport({
            reportedUserId: comment.author.id,
            location: 'COMMENT',
            targetId: reportTargetId,
            reason,
            detail,
          });
        }}
      />

      {deleteTarget !== null && (
        <div
          className="comment-delete-modal-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="comment-delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="comment-modal-header">
              <span className="comment-modal-title">댓글 삭제</span>
            </div>

            <div className="comment-modal-body">
              <p className="comment-modal-message">
                댓글을 삭제하시겠습니까?
                <br />
                삭제된 댓글은 복구할 수 없습니다.
              </p>

              <div className="comment-modal-actions">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={loading}
                  className="comment-modal-btn cancel"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="comment-modal-btn delete"
                >
                  {loading ? "삭제 중..." : "삭제"}
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
