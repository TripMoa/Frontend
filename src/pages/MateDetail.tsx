// pages/MateDetail.tsx (무한 루프 수정)

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Heart, Calendar, Users, Wallet, MapPin
} from "lucide-react";
import type { Post } from "../components/mate/mate.types";
import { getAirportDisplay } from "../components/mate/mate.constants";
import { useMate } from "../hooks/useMate";
import "../styles/mate/MateDetail.css";

export default function MateDetail(): JSX.Element {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const { allPosts, likedPostIds, handleLike: mateLike } = useMate();

  const [post, setPost] = useState<Post | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);

  /** -------------------------------
   *   POST LOAD (초기 1회만)
   *  ------------------------------ */
  useEffect(() => {
    if (!postId) return;

    const found = allPosts.find((p) => p.id === postId);
    if (found) {
      setPost(found);

      const apps = JSON.parse(localStorage.getItem("myApplications") || "[]");
      setHasApplied(apps.some((app: any) => app.postId === postId));
    }

    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]); // ← allPosts 제거해서 무한 루프 방지!

  /** allPosts 변경 시 post 상태만 업데이트 (좋아요 반영) */
  useEffect(() => {
    if (!postId || !post) return;
    
    const updated = allPosts.find((p) => p.id === postId);
    if (updated && updated.likes !== post.likes) {
      setPost(updated);
    }
  }, [allPosts, postId, post]);

  /** 좋아요 클릭 */
  const onLikeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!postId) return;
    mateLike(postId, e); // useMate가 allPosts 업데이트 → 위 useEffect가 자동으로 처리
  };

  /** 신청 메시지 제출 */
  const handleApplySubmit = () => {
    if (!postId || !applyMessage.trim() || !post) return;

    const list = JSON.parse(localStorage.getItem("myApplications") || "[]");

    list.push({
      id: `APP_${Date.now()}`,
      postId,
      message: applyMessage,
      appliedDate: new Date().toISOString(),
      status: "pending",
      applicant: {
        name: "나",
        email: "user@example.com",
        age: 25,
        gender: "성별무관",
        avatar: "👤",
      },
    });

    localStorage.setItem("myApplications", JSON.stringify(list));

    setHasApplied(true);
    setShowApplyForm(false);
    setApplyMessage("");
  };

  /** Loading UI */
  if (isLoading || !post) {
    return (
      <div className="mate-detail flex items-center justify-center h-[60vh]">
        <div className="loading-spinner" />
      </div>
    );
  }

  const isLiked = likedPostIds.includes(post.id);

  return (
    <div className="mate-detail max-w-6xl mx-auto px-4 py-8">

      {/* Back + Like */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="btn-outline"
        >
          <ArrowLeft size={18} />
          뒤로가기
        </button>

        <button
          onClick={onLikeClick}
          className={`btn-outline ${isLiked ? "btn-like" : ""}`}
        >
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          {post.likes}
        </button>
      </div>

      {/* WRAPPER */}
      <div className="global-wrap">

        {/* LEFT */}
        <div className="left-col">

          {/* ROUTE CARD */}
          <div className="route-card">
            <div className="flex items-center justify-between">
              <div className="route-point">
                <p className="route-code">{getAirportDisplay(post.from)}</p>
                <p className="route-date">{post.dates.start}</p>
              </div>

              <div className="route-arrow">✈</div>

              <div className="route-point">
                <p className="route-code">{post.destination}</p>
                <p className="route-date">{post.dates.end}</p>
              </div>
            </div>
          </div>

          {/* INFO GRID */}
          <div className="info-grid">
            <div className="info-card">
              <Calendar size={20} />
              <p className="info-value">{post.duration}</p>
              <p className="info-label">여행 기간</p>
            </div>

            <div className="info-card">
              <Wallet size={20} />
              <p className="info-value">{post.budget}</p>
              <p className="info-label">예산</p>
            </div>

            <div className="info-card">
              <Users size={20} />
              <p className="info-value">
                {post.participants.current}/{post.participants.max}
              </p>
              <p className="info-label">참여 인원</p>
            </div>

            <div className="info-card">
              <MapPin size={20} />
              <p className="info-value">{post.views}</p>
              <p className="info-label">조회수</p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="desc-box">
            <p className="desc-title">여행 소개</p>
            <p className="desc-text">{post.description}</p>

            <div className="tag-wrap">
              {post.tags.map((tag) => (
                <span className="tag" key={tag}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="right-col">

          {/* AUTHOR */}
          <div className="author-card">
            <p className="author-label">작성자</p>

            <div className="flex gap-3">
              <div className="author-avatar">{post.author.avatar}</div>

              <div>
                <p className="author-name">{post.author.name}</p>
                <p className="author-email">{post.author.email}</p>
                <p className="author-meta">
                  {post.author.age}세 · {post.author.gender}
                </p>
              </div>
            </div>
          </div>

          {/* APPLY */}
          <div className="apply-card">

            {!showApplyForm ? (
              <button
                disabled={
                  hasApplied || post.participants.current >= post.participants.max
                }
                onClick={() => setShowApplyForm(true)}
                className={`apply-btn w-full ${
                  hasApplied || post.participants.current >= post.participants.max
                    ? "disabled"
                    : ""
                }`}
              >
                {hasApplied
                  ? "이미 신청함"
                  : post.participants.current >= post.participants.max
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