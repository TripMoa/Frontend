import type { MouseEvent } from "react";
import type { Post } from "../hooks/mate.types";
import {
  TRANSPORT_REVERSE_MAP,
  GENDER_PREFERENCE_REVERSE_MAP,
  AGE_GROUP_REVERSE_MAP
} from "../hooks/mate.constants";
import { useAuth } from "../../user/pages/AuthContext";
import { getApplicantAvatar } from "../../../shared/hooks/avatar";
import { AvatarDisplay } from "../../../shared/components/AvatarDisplay";

interface MatePostCardProps {
  post: Post;
  isLiked: boolean;
  isRemoved: boolean;
  isRemovedMode?: boolean;
  isExpiredMode?: boolean;
  onCardClick: (post: Post) => void;
  onLike: (postId: number, e: MouseEvent<HTMLButtonElement>) => void;
  onRemove: (postId: number, e: MouseEvent<HTMLButtonElement>) => void;
  onRestore: (postId: number, e: MouseEvent<HTMLButtonElement>) => void;
  onDelete: (postId: number, e: MouseEvent<HTMLButtonElement>) => void;
}

export function MatePostCard({
  post,
  isLiked,
  isRemoved,
  isRemovedMode,
  isExpiredMode,
  onCardClick,
  onLike,
  onRemove,
  onRestore,
  onDelete,
}: MatePostCardProps){
  const { userId } = useAuth();
  const isAuthor = post.author.id === userId;
  const { isAuthenticated } = useAuth();

  const formatDate = (dateString: string) => {
    return dateString.slice(5).replace("-", ".");
  };

  const transportDisplay = post.transport ? TRANSPORT_REVERSE_MAP[post.transport] || post.transport : "";
  const genderDisplay = post.genderPreference ? GENDER_PREFERENCE_REVERSE_MAP[post.genderPreference] || post.genderPreference : "";
  const ageGroupDisplay = post.ageGroup ? AGE_GROUP_REVERSE_MAP[post.ageGroup] || post.ageGroup : "";
  const styles = post.author.travelStyles ?? [];

  const isFull = post.currentParticipant >= post.maxParticipant;
  const isMuted = isRemovedMode || isExpiredMode;
  const headline = post.content?.split("\n").find((line) => line.trim())?.trim() || `${post.destination} 동행 구해요`;

  const badge = isRemovedMode ? <span className="mate-badge mate-badge--dark">PASSED</span>
    : isExpiredMode ? <span className="mate-badge mate-badge--mute">EXPIRED</span>
    : isAuthor ? <span className="mate-badge mate-badge--yellow">내 글</span>
    : isFull ? <span className="mate-badge mate-badge--danger">정원 마감</span>
    : null;

  return (
    <article
      className={`mate-tk ${isMuted ? "is-muted" : ""}`}
      onClick={() => onCardClick(post)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onCardClick(post);
        }
      }}
      tabIndex={0}
      aria-label={`${post.destination} 동행 글 보기`}
    >
      <div className="mate-tk__l">
        <span>TO</span>
        <b className="mate-tk__dest">{post.destination}</b>
        <div className="mate-tk__host">
          <span className="mate-av mate-av--sm" aria-hidden="true">
            <AvatarDisplay avatar={getApplicantAvatar(post.author.profileImage, post.author.avatarEmoji)} />
          </span>
          <span>{post.author.nickname}</span>
        </div>
      </div>

      <div className="mate-tk__m">
        <div className="mate-tk__head">
          <h3 className="mate-tk__title">{headline}</h3>
          {badge}
        </div>

        <div className="mate-tk__f">
          <div><small>DEPARTURE</small><b>{formatDate(post.startDate)}</b></div>
          <div><small>ARRIVAL</small><b>{formatDate(post.endDate)}</b></div>
          <div><small>SEAT</small><b>{post.currentParticipant}/{post.maxParticipant}</b></div>
          <div><small>TICKET NO.</small><b>TM-{post.id.toString().padStart(6, "0")}</b></div>
          {transportDisplay && <div><small>TRANSPORT</small><b>{transportDisplay}</b></div>}
          <div><small>BUDGET</small><b>{post.budget.toLocaleString()}</b></div>
        </div>

        <div className="mate-tk__tags">
          {ageGroupDisplay && <span className="mate-tag mate-tag--y">{ageGroupDisplay}</span>}
          {genderDisplay && <span className="mate-tag mate-tag--y">{genderDisplay}</span>}
          {styles.slice(0, 3).map((s) => (
            <span key={s} className="mate-tag mate-tag--y">{s}</span>
          ))}
          {styles.length > 0 && (
            <span className="mate-tk__style">작성자 스타일: {styles.join(" · ")}</span>
          )}
        </div>
      </div>

      <div className="mate-tk__r">
        <div className="mate-tk__stats">
          <span>조회 {post.viewsCount}</span>
          <span>♥ {post.likesCount}</span>
        </div>

        {isExpiredMode ? (
          <p className="mate-tk__msg">모집이 종료된<br />게시글입니다</p>
        ) : !isAuthenticated ? (
          <p className="mate-tk__msg">로그인 후 신청할 수 있어요</p>
        ) : isAuthor ? (
          <button
            type="button"
            className="mate-bt mate-bt--neg"
            onClick={(e) => onDelete?.(post.id, e)}
          >
            DELETE
          </button>
        ) : (
          <>
            {isRemoved ? (
              <button type="button" className="mate-bt mate-bt--r" onClick={(e) => onRestore(post.id, e)}>
                UNPASS
              </button>
            ) : (
              <button type="button" className="mate-bt mate-bt--r" onClick={(e) => onRemove(post.id, e)}>
                PASS
              </button>
            )}
            <button
              type="button"
              className="mate-bt mate-bt--sm"
              onClick={(e) => onLike(post.id, e)}
              aria-pressed={isLiked}
            >
              {isLiked ? "♥ 찜 취소" : "♡ LIKE"}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
