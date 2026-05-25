import React, { useEffect, useRef, useState } from "react";
import CommentSection from "../components/CommentSection";
import { toggleLike as toggleLikeAPI } from "../../../api/stories.api";
import { submitReport } from '../../../api/report.api';
import ReportModal from "../components/modals/ReportModal";
import "../styles/travelStory.css";
import "../styles/DetailPage.css";

import { useAuth } from "../../user/pages/AuthContext";
import { useAccessGuard } from "../../../shared/hooks/useAccessGuard";
import { ActionPromptModal } from "../../../shared/components/ActionPromptModal";

// description HTML을 dangerouslySetInnerHTML로 렌더링 (불필요한 리렌더링 방지를 위해 memo 적용)
const StoryDescription = React.memo(({ html }: { html: string }) => (
  <div
    className="detail-description"
    dangerouslySetInnerHTML={{ __html: html }}
  />
));

interface DetailPageProps {
  story: any;
  goBack: () => void;
  likedStories: number[];
  toggleLike: (id: number) => void;
  followedStories: number[];
  toggleFollow: (id: number) => void;
  setFollowedStories: (ids: number[] | ((prev: number[]) => number[])) => void;
  incrementViews: (id: number) => void;
  currentUserId?: number;
  onEdit?: (story: any) => void;
  onDelete?: (id: number) => void;
}

function DetailPage({
  story,
  goBack,
  likedStories,
  followedStories,
  toggleFollow,
  incrementViews,
  currentUserId,
  onEdit,
  onDelete,
}: DetailPageProps) {
  const { isAuthenticated } = useAuth();
  const { requireLogin, showLoginModal, closeLoginModal, moveToLogin } =
    useAccessGuard();

  // 조회수 중복 증가 방지용 플래그
  const hasIncrementedViews = useRef(false);
  // props의 isFollowed가 없으면 followedStories 배열로 fallback
  const isFollowed =
    story.isFollowed !== undefined
      ? story.isFollowed
      : followedStories.includes(story.id);
  const [commentCount, setCommentCount] = useState(0);
  const [liked, setLiked] = useState<boolean>(
    likedStories.includes(story.id) || (story.isLiked ?? false)
  );
  const [likes, setLikes] = useState<number>(story.likes ?? 0);
  const [showItineraryMenu, setShowItineraryMenu] = useState(false);
  const itineraryMenuRef = useRef<HTMLDivElement>(null);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // nickname 우선, 없으면 name으로 표시
  const rawAuthor = story?.author || {};
  const displayName =
    rawAuthor.nickname?.trim() || rawAuthor.name?.trim() || "알 수 없음";
  const author = { ...rawAuthor, displayName };

  // 상대경로 이미지 URL을 절대경로로 변환
  const normalizeImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // tags가 문자열이면 쉼표로 분리, 배열이면 그대로 사용
  const getTravelStyles = () => {
    if (!story.tags) return [];
    if (Array.isArray(story.tags)) return story.tags;
    if (typeof story.tags === "string") {
      return story.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter((t: string) => t);
    }
    return [];
  };

  const tags = getTravelStyles();

  // createdAt을 한국어 날짜 형식으로 변환
  const displayDate =
    story.date ||
    (story.createdAt
      ? new Date(story.createdAt)
          .toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
          })
          .replace(/\. /g, ". ")
          .replace(/\.$/, "")
      : "");

  // 일정 저장 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        itineraryMenuRef.current &&
        !itineraryMenuRef.current.contains(e.target as Node)
      ) {
        setShowItineraryMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 최초 마운트 시 조회수 1회만 증가
  useEffect(() => {
    if (!hasIncrementedViews.current && isAuthenticated) {
      incrementViews(story.id);
      hasIncrementedViews.current = true;
    }
  }, [story.id, incrementViews, isAuthenticated]);

  // 좋아요 상태 동기화 - likedStories 업데이트 시 반영
  useEffect(() => {
    setLiked(likedStories.includes(story.id) || (story.isLiked ?? false));
  }, [likedStories, story.id]);

  const renderAvatar = () => {
  if (author.profileType === 'CUSTOM' && author.profileImage) {
    return (
      <img src={author.profileImage} alt={author.displayName}
        className="detail-avatar"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  if (author.avatarEmoji) {
    return (
      <div className="detail-avatar-placeholder"
        style={{ background: author.avatarColor || '#000', fontSize: '28px' }}>
        {author.avatarEmoji}
      </div>
    );
  }
  return (
    <div className="detail-avatar-placeholder">
      {author.displayName?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
};

  // 좋아요 토글 - API 호출 후 로컬 상태 반영
  const handleToggleLike = async () => {
    if (!requireLogin()) return;
    try {
      const response = await toggleLikeAPI(story.id);
      const likedResult = response.data;
      setLiked(likedResult);
      setLikes((prev) => (likedResult ? prev + 1 : prev - 1));
    } catch (e) {
      console.error("좋아요 실패", e);
    }
  };

  // description 렌더링 후 이미지 슬라이더 초기화 (상대경로 URL 변환 및 prev/next 버튼 이벤트 등록)
  useEffect(() => {
    setTimeout(() => {
      const sliders = document.querySelectorAll(".image-slider-wrapper");
      sliders.forEach((slider) => {
        const images = slider.querySelectorAll("img");
        images.forEach((img) => {
          const src = img.getAttribute("src");
          if (src && !src.startsWith("http")) {
            img.setAttribute("src", normalizeImageUrl(src));
          }
        });

        const imagesContainer = slider.querySelector(
          ".slider-images-container",
        );
        const prevBtn = slider.querySelector(".slider-prev-btn");
        const nextBtn = slider.querySelector(".slider-next-btn");
        const indicator = slider.querySelector(".slider-indicator");
        if (!imagesContainer) return;
        const allImages = Array.from(imagesContainer.querySelectorAll("img"));
        if (allImages.length === 0) return;
        let currentIndex = 0;

        // 첫 번째 이미지만 표시, 나머지 숨김
        allImages.forEach((img, idx: number) => {
          const imgElement = img as HTMLElement;
          imgElement.style.position = "absolute";
          imgElement.style.top = "0";
          imgElement.style.left = "0";
          imgElement.style.width = "100%";
          imgElement.style.height = "100%";
          imgElement.style.objectFit = "cover";
          imgElement.style.display = idx === 0 ? "block" : "none";
        });

        if (indicator) {
          indicator.textContent = `1/${allImages.length}`;
        }

        if (prevBtn) {
          const handlePrev = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            allImages[currentIndex].style.display = "none";
            currentIndex =
              (currentIndex - 1 + allImages.length) % allImages.length;
            allImages[currentIndex].style.display = "block";
            if (indicator)
              indicator.textContent = `${currentIndex + 1}/${allImages.length}`;
          };
          prevBtn.removeEventListener("click", handlePrev as EventListener);
          prevBtn.addEventListener("click", handlePrev as EventListener);
        }

        if (nextBtn) {
          const handleNext = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            allImages[currentIndex].style.display = "none";
            currentIndex = (currentIndex + 1) % allImages.length;
            allImages[currentIndex].style.display = "block";
            if (indicator)
              indicator.textContent = `${currentIndex + 1}/${allImages.length}`;
          };
          nextBtn.removeEventListener("click", handleNext as EventListener);
          nextBtn.addEventListener("click", handleNext as EventListener);
        }
      });
    }, 100);
  }, [story.id]);

  return (
  <div className="detail-page-container">
    <div className="detail-page-content">
      <div className="detail-header">
        <button onClick={goBack} className="detail-close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            style={{ width: "24px", height: "24px", fill: "#000" }}>
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <div className="detail-header-left">
          <div className="detail-title-row">
            <h1 className="detail-title">{story.title}</h1>
            {story.type === 'REVIEW' && (
              <div className="detail-title-meta">
                {story.destination && (
                  <><span className="detail-divider">·</span>
                  <span className="detail-location">{story.destination}</span></>
                )}
                {story.duration && (
                  <><span className="detail-divider">·</span>
                  <span className="detail-duration">{story.duration}</span></>
                )}
              </div>
            )}
          </div>

          {tags.length > 0 && (
            <div className="detail-tags">
              {tags.map((tag: string, index: number) => (
                <span key={index} className="detail-tag">{tag}</span>
              ))}
            </div>
          )}

          {story.type === 'REVIEW' && story.budget && (
            <div className="detail-info-chips">
              <div className="detail-chip">
                {parseInt(story.budget).toLocaleString()}원
              </div>
            </div>
          )}
        </div> {/* detail-header-left 닫기 */}

        {/* 프로필 사진 */}
        <div className="detail-author-info">
          {renderAvatar()}
          <div className="detail-author-text">
            <div className="detail-author-name">{author.displayName}</div>
          </div>
        </div>

        {currentUserId && author.id !== currentUserId && (
          <div className="detail-report-btn-wrapper">
            <button className="detail-report-btn"
              onClick={(e) => { e.stopPropagation(); setShowReportMenu(!showReportMenu); }}>
              •••
            </button>
            {showReportMenu && (
              <div className="comment-more-dropdown">
                <div className="comment-more-option danger"
                  onClick={() => {
                    if (!requireLogin()) return; 
                    setShowReportMenu(false);
                    setShowReportModal(true);
                  }}>
                  신고하기
                </div>
              </div>
            )}
          </div>
        )}
      </div> {/* detail-header 닫기 */}

      <StoryDescription html={story.description} />

      {story.type === 'REVIEW' && (
        <div className="detail-expenses">
          <h2 className="detail-expenses-title">여행 경비 총정리</h2>
          {[
            ["교통비", story.expenses?.transportation || 0],
            ["숙박비", story.expenses?.accommodation || 0],
            ["식비", story.expenses?.food || 0],
            ["관광/입장료", story.expenses?.attraction || 0],
            ["쇼핑/기타", story.expenses?.shopping || 0],
          ].map(([label, price]) => (
            <div key={label} className="detail-expense-row">
              <span>{label}</span>
              <span>{((price as number) || 0).toLocaleString()}원</span>
            </div>
          ))}
          <div className="detail-expenses-total">
            <span>총 합계</span>
            <span>{(story.expenses?.total || 0).toLocaleString()}원</span>
          </div>
        </div>
      )}

      <div className="detail-actions">
        <div className="detail-action-tooltip-wrapper">
          <button onClick={handleToggleLike}
            className={`detail-action-btn ${liked ? "active" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
              style={{ width: "20px", height: "20px",
                fill: liked ? "#fff" : "none",
                stroke: liked ? "#fff" : "#000", strokeWidth: "2" }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{likes}</span>
          </button>
          <div className="detail-action-tooltip">LIKES</div>
        </div>

        {story.type === 'REVIEW' && (
          <div className="detail-action-tooltip-wrapper" ref={itineraryMenuRef}>
            <button
              onClick={() => { if (!requireLogin()) return; setShowItineraryMenu(!showItineraryMenu); }}
              className={`detail-action-btn ${isFollowed ? "active" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                style={{ width: "20px", height: "20px", fill: "none",
                  stroke: isFollowed ? "#fff" : "#000", strokeWidth: "3" }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div className="detail-action-tooltip">USE THIS ITINERARY</div>
            {showItineraryMenu && (
              <div className="itinerary-menu">
                <button className="itinerary-menu-item"
                  onClick={() => { toggleFollow(story.id); setShowItineraryMenu(false); }}>
                  {isFollowed ? "목록에서 제거" : "SAVED ITINERARIES에 저장"}
                </button>
                <button className="itinerary-menu-item"
                  onClick={() => { alert("준비 중입니다."); setShowItineraryMenu(false); }}>
                  USE THIS ITINERARY
                </button>
              </div>
            )}
          </div>
        )}

        <div className="detail-date-info">
          <div className="detail-views-text">{story.views} VIEWS</div>
          <div className="detail-created-date">{displayDate}</div>
        </div>
      </div>
    </div> {/* detail-page-content 닫기 */}

    <CommentSection
      storyId={story.id}
      storyAuthorId={author.id}
      onCommentCountChange={setCommentCount}
    />

    <ReportModal
      show={showReportModal}
      targetType="게시글"
      targetAuthor={author.displayName}
      targetContent={story.title}
      onClose={() => setShowReportModal(false)}
      onSubmit={(reason, detail) => {
        submitReport({
          reportedUserId: author.id,
          location: 'STORY',
          targetId: story.id,
          reason,
          detail,
        });
      }}
    />

    <ActionPromptModal
      open={showLoginModal}
      title="로그인이 필요합니다"
      headline="로그인 후 이용할 수 있어요"
      description="이 기능은 로그인한 사용자만 이용할 수 있습니다."
      cancelText="취소"
      confirmText="로그인"
      onClose={closeLoginModal}
      onConfirm={moveToLogin}
    />
  </div> // detail-page-container 닫기
);
}

export default DetailPage;
