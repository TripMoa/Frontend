import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Heart, Calendar, Users, Wallet, MapPin
} from "lucide-react";
import type { Post, ApplicationRequest, ApplicationResponse } from "../hooks/mate.types";
import { getCurrentUserId, calculateDuration } from "../hooks/mate.constants";
import { useMate } from "../hooks/useMate";
import "../styles/MateDetail.css";

export default function MateDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  
  const { toggleLike, fetchPostDetail } = useMate();

  const [post, setPost] = useState<Post | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const hasLoadedRef = useRef(false);

  const currentUserId = getCurrentUserId();
  const isAuthor = post?.author.id === currentUserId;
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const loadPost = async () => {
      if (!postId || hasLoadedRef.current) {
        return;
      }

      try {
        hasLoadedRef.current = true;
        setIsLoading(true);

        const postDetail = await fetchPostDetail(Number(postId));
        if (postDetail) {
          setPost(postDetail);
        } else {
          hasLoadedRef.current = false;
        }
      } catch (err) {
        hasLoadedRef.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [postId, fetchPostDetail]);

  useEffect(() => {
    return () => {
      hasLoadedRef.current = false;
    };
  }, [postId]);

  const onLikeClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!postId || !post) return;

    const prevLiked = post.isLiked;
    const prevCount = post.likesCount;

    setPost(prev => prev ? {
      ...prev,
      isLiked: !prev.isLiked,
      likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1
    } : null);

    const result = await toggleLike(post.id);

    if (result) {
      setPost(prev => prev ? {
        ...prev,
        isLiked: result.liked,
        likesCount: result.count
      } : null);
    } else {
      setPost(prev => prev ? {
        ...prev,
        isLiked: prevLiked,
        likesCount: prevCount
      } : null);
    }
  };

  const handleApplySubmit = async () => {
    if (!postId || !applyMessage.trim() || !post) return;

    try {
      const requestBody: ApplicationRequest = {
        content: applyMessage,
      };

      const response = await fetch(`http://localhost:8080/api/mate/${postId}/apply/applicant`, {
        method: 'POST',
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '신청에 실패했습니다.');
      }

      const applicationResponse: ApplicationResponse = await response.json();
      console.log('신청 완료:', applicationResponse);

      setShowApplyForm(false);
      setApplyMessage("");
      alert("신청이 완료되었습니다!");
      
      navigate(`/mate/${postId}`, { replace: true });
    } catch (error) {
      console.error('신청 오류:', error);
      alert(error instanceof Error ? error.message : "신청 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="mate-detail flex flex-col items-center justify-center h-[60vh]">
        <div className="text-xl font-bold">게시글을 불러오는 중...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mate-detail flex flex-col items-center justify-center h-[60vh]">
        <p className="text-xl font-bold text-black/70 mb-4">게시글을 찾을 수 없습니다</p>
        <button onClick={() => navigate("/mate")} className="btn-outline">
          <ArrowLeft size={18} />
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const isLiked = post.isLiked || false;
  const hasApplied = post.hasApplied || false;

  return (
    <div className="mate-detail max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="btn-outline">
          <ArrowLeft size={18} />
          뒤로가기
        </button>

        <button
          onClick={onLikeClick}
          className={`btn-outline ${isLiked ? "btn-like" : ""}`}
        >
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          {post.likesCount}
        </button>
      </div>

      <div className="global-wrap">
        <div className="left-col">
          <div className="route-card">
            <div className="flex items-center justify-between">
              <div className="route-point">
                <p className="route-date">{post.startDate}</p>
              </div>
              <div className="route-arrow">✈</div>
              <div className="route-point">
                <p className="route-code">{post.destination}</p>
                <p className="route-date">{post.endDate}</p>
              </div>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-card">
              <Calendar size={20} />
              <p className="info-value">{calculateDuration(post.startDate, post.endDate)}</p>
              <p className="info-label">여행 기간</p>
            </div>

            <div className="info-card">
              <Wallet size={20} />
              <p className="info-value">{post.budget.toLocaleString()}원</p>
              <p className="info-label">예산</p>
            </div>

            <div className="info-card">
              <Users size={20} />
              <p className="info-value">{post.currentParticipant}/{post.maxParticipant}</p>
              <p className="info-label">참여 인원</p>
            </div>

            <div className="info-card">
              <MapPin size={20} />
              <p className="info-value">{post.viewsCount}</p>
              <p className="info-label">조회수</p>
            </div>
          </div>

          <div className="desc-box">
            <p className="desc-title">여행 소개</p>
            <p className="desc-text">{post.content}</p>

            {post.author?.travelStyles && post.author.travelStyles.length > 0 && (
              <div className="tag-wrap">
                {post.author.travelStyles.map((tag) => (
                  <span className="tag" key={tag}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="right-col">
          <div className="author-card">
            <p className="author-label">작성자</p>

            <div className="flex gap-3">
              <div className="author-avatar">
                {post.author.profileImage || post.author.avatarEmoji || "👤"}
              </div>

              <div>
                <p className="author-name">{post.author.nickname}</p>
                <p className="author-email">{post.author.email}</p>
                <p className="author-meta">
                  {post.author.age ? `${post.author.age}세` : ""}
                  {post.author.age && post.author.gender ? " · " : ""}
                  {post.author.gender || ""}
                </p>
              </div>
            </div>
          </div>

          <div className="apply-card">
            {isAuthor ? (
              <div className="text-center py-4 text-black/60">내가 작성한 게시글입니다</div>
            ) : !showApplyForm ? (
              <button
                disabled={hasApplied || post.currentParticipant >= post.maxParticipant}
                onClick={() => setShowApplyForm(true)}
                className={`apply-btn w-full ${
                  hasApplied || post.currentParticipant >= post.maxParticipant ? "disabled" : ""
                }`}
              >
                {hasApplied
                  ? "이미 신청함"
                  : post.currentParticipant >= post.maxParticipant
                  ? "모집 완료"
                  : "신청하기"}
              </button>
            ) : (
              <div className="apply-form">
                <textarea
                  className="apply-input"
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="신청 메시지를 입력하세요..."
                />

                <div className="apply-actions">
                  <button
                    className="apply-cancel"
                    onClick={() => {
                      setShowApplyForm(false);
                      setApplyMessage("");
                    }}
                  >
                    취소
                  </button>

                  <button
                    disabled={!applyMessage.trim()}
                    className="apply-submit"
                    onClick={handleApplySubmit}
                  >
                    보내기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}