import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Post, ApplicationRequest } from "../hooks/mate.types";
import { calculateDuration, getAgeGroupLabel, getGenderPreferenceLabel, getTransportLabel } from "../hooks/mate.constants";
import { useMate } from "../hooks/useMate";
import { useAuth } from "../../user/pages/AuthContext";
import { isPostExpired } from "../hooks/mate.util";
import { useAccessGuard } from "../../../shared/hooks";
import { ActionPromptModal } from "../../../shared/components";
import "../styles/Mate.css";
import "../styles/MateDetail.css";
import { getApplicantAvatar } from "../../../shared/hooks/avatar";
import { AvatarDisplay } from "../../../shared/components/AvatarDisplay";
import { getAccessToken } from "../../../api/api";
import { applyMatePost } from "../../../api/mate.api";

export default function MateDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  
  const { toggleLike, fetchPostDetail } = useMate();

  const [post, setPost] = useState<Post | null>(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const hasLoadedRef = useRef(false);

  const { userId, profile } = useAuth();
  const isAuthor = post?.author?.id === userId;
  const token = getAccessToken();

  const {
    showLoginModal,
    showAdultModal,
    closeLoginModal,
    closeAdultModal,
    moveToLogin,
    moveToMypageForVerification,
    requireLogin,
    requireAdultVerified,
  } = useAccessGuard(profile);

  const handleLikeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (requireLogin()) onLikeClick(e);
  };  

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

    const prevLiked = post.liked;
    const prevCount = post.likesCount;

    setPost(prev => prev ? {
      ...prev,
      liked: !prev.liked,
      likesCount: prev.liked ? prev.likesCount - 1 : prev.likesCount + 1
    } : null);

    const result = await toggleLike(post.id);

    if (result) {
      setPost(prev => prev ? {
        ...prev,
        liked: result.liked,
        likesCount: result.count
      } : null);
    } else {
      setPost(prev => prev ? {
        ...prev,
        liked: prevLiked,
        likesCount: prevCount
      } : null);
    }
  };

  const handleApplySubmit = async () => {
    if (!postId || !applyMessage.trim() || !post) return;
    if (!requireAdultVerified()) return;

    try {
      const requestBody: ApplicationRequest = {
        content: applyMessage,
      };

      await applyMatePost(Number(postId), requestBody);

      setPost(prev => prev ? {
        ...prev,
        hasApplied: true,
      } : null);

      setApplyMessage("");
      
    } catch (error) {
      alert(error instanceof Error ? error.message : "신청 중 오류가 발생했습니다.");
    }
  };

  const pageHead = (
    <div className="mate-ph">
      <div className="mate-ph__text">
        <button type="button" onClick={() => navigate("/mate")} className="mate-bt mate-bt--ghost mate-bt--sm mate-ph__back">
          ‹ 목록으로
        </button>
        <h2 className="mate-ph__title">모집글 상세</h2>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <section className="page-section tm-grid-bg">
        <div className="mate-p2">
          {pageHead}
          <div className="mate-section">
            <div className="tm-loading"><span className="tm-spinner" />게시글을 불러오는 중...</div>
          </div>
        </div>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="page-section tm-grid-bg">
        <div className="mate-p2">
          {pageHead}
          <div className="mate-section">
            <div className="mate-empty">
              <span className="mate-empty__icon" aria-hidden="true">🧳</span>
              <b>게시글을 찾을 수 없어요</b>
              삭제됐거나 주소가 잘못됐을 수 있어요
            </div>
          </div>
        </div>
      </section>
    );
  }

  const isLiked = post.liked || false;
  const hasApplied = post.hasApplied || false;
  const isExpire = isPostExpired(post);
  const isFull = post.currentParticipant >= post.maxParticipant;
  const styles = post.author?.travelStyles ?? [];
  const authorGender = post.author.gender ? getGenderPreferenceLabel(post.author.gender.toLowerCase()) : "";

  const applyArea = hasApplied ? (
    <div className="mate-notice mate-notice--ok">✓ 신청이 완료되었습니다! 작성자가 승인하면 채팅에 참여할 수 있어요.</div>
  ) : isAuthor ? (
    <div className="mate-notice">내가 쓴 글에는 신청할 수 없어요. 받은 신청은 RECEIVED에서 관리해요.</div>
  ) : isExpire ? (
    <div className="mate-notice">모집이 종료된 게시글이에요.</div>
  ) : isFull ? (
    <div className="mate-notice">모집 인원이 다 찼어요.</div>
  ) : (
    <>
      <div className="mate-field">
        <label className="mate-lb mate-lb--req" htmlFor="mate-apply-message">신청 메시지</label>
        <textarea
          id="mate-apply-message"
          className="tm-textarea"
          rows={4}
          value={applyMessage}
          onChange={(e) => setApplyMessage(e.target.value)}
          placeholder="작성자에게 나를 소개하고 같이 가고 싶은 이유를 적어주세요"
        />
      </div>
      <div className="mate-form-actions">
        <button
          type="button"
          disabled={!applyMessage.trim()}
          className="mate-bt mate-bt--r"
          onClick={handleApplySubmit}
        >
          신청하기
        </button>
      </div>
    </>
  );

  return (
    <>
    <section className="page-section tm-grid-bg">
    <div className="mate-p2 mate-detail">
      {pageHead}

      <div className="mate-art">
        <div className="mate-art__main">
          <div className="mate-art__to">
            <small>TO</small>
            <h1 className="mate-art__title">{post.destination}</h1>
          </div>
          <div className="mate-art__meta">
            <span>TICKET NO. {post.id.toString().padStart(6, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>조회 {post.viewsCount}</span>
            <span aria-hidden="true">·</span>
            <span>좋아요 {post.likesCount}</span>
          </div>

          <div className="mate-info">
            <div><small>DEPARTURE</small><b>{post.startDate}</b></div>
            <div><small>ARRIVAL</small><b>{post.endDate}</b></div>
            <div><small>DURATION</small><b>{calculateDuration(post.startDate, post.endDate)}</b></div>
            <div><small>SEAT</small><b>{post.currentParticipant}/{post.maxParticipant}</b></div>
            <div><small>TRANSPORT</small><b>{getTransportLabel(post.transport)}</b></div>
            <div><small>BUDGET</small><b>{post.budget.toLocaleString()}</b></div>
          </div>

          <div className="mate-prefs">
            {isExpire ? (
              <span className="mate-tag">마감</span>
            ) : isFull ? (
              <span className="mate-tag mate-tag--r">정원 마감</span>
            ) : (
              <span className="mate-tag mate-tag--m">모집중</span>
            )}
            <span className="mate-tag mate-tag--b">{getAgeGroupLabel(post.ageGroup)}</span>
            <span className="mate-tag mate-tag--p">{getGenderPreferenceLabel(post.genderPreference)}</span>
          </div>

          <div className="mate-art__body">{post.content}</div>

          <section className="mate-form-sec">
            <h3 className="mate-form-sec__title">신청하기</h3>
            {applyArea}
          </section>
        </div>

        <aside className="mate-art__side">
          <div className="mate-card">
            <div className="mate-profile">
              <span className="mate-av mate-av--lg" aria-hidden="true">
                <AvatarDisplay avatar={getApplicantAvatar(post.author.profileImage, post.author.avatarEmoji)} />
              </span>
              <div className="mate-grow">
                <div className="mate-profile__name">{post.author.nickname}</div>
                <div className="mate-li__hint">
                  작성자{authorGender && ` · ${authorGender}`}{post.author.age ? ` · ${post.author.age}세` : ""}
                </div>
              </div>
            </div>
            {styles.length > 0 && (
              <div className="mate-prefs mate-profile__tags">
                {styles.map((tag) => (
                  <span key={tag} className="mate-tag mate-tag--m">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="mate-card">
            <div className="mate-kv"><span className="mate-kv__k">모집 인원</span><span className="mate-kv__v">{post.currentParticipant} / {post.maxParticipant}명</span></div>
            <div className="mate-kv"><span className="mate-kv__k">예산</span><span className="mate-kv__v">₩{post.budget.toLocaleString()}</span></div>
            <div className="mate-kv"><span className="mate-kv__k">이동수단</span><span className="mate-kv__v">{getTransportLabel(post.transport)}</span></div>
          </div>

          <div className="mate-btns">
            <button
              type="button"
              onClick={handleLikeClick}
              className={`mate-bt ${isLiked ? "mate-bt--r" : ""}`}
              aria-pressed={isLiked}
            >
              {isLiked ? "♥ 찜 취소" : "♡ 찜하기"}
            </button>
            <button type="button" className="mate-bt" onClick={() => navigate("/mate")}>‹ 목록으로</button>
          </div>
        </aside>
      </div>
    </div>
    </section>

    <ActionPromptModal
      open={showLoginModal}
      title=">> LOGIN REQUIRED"
      headline="Members Only"
      description="이 기능은 로그인 후 이용할 수 있습니다"
      cancelText="둘러보기"
      confirmText="로그인하기"
      onClose={closeLoginModal}
      onConfirm={moveToLogin}
    />
    <ActionPromptModal
      open={showAdultModal}
      title=">> PROFILE INCOMPLETE"
      headline="Complete Your Profile"
      description="성인 인증이 필요한 서비스입니다."
      cancelText="닫기"
      confirmText="프로필 설정하기"
      onClose={closeAdultModal}
      onConfirm={moveToMypageForVerification}
    />
    </>
  );
}
