import { MouseEvent } from "react";
import { Heart, X, Eye, RotateCcw, Trash2 } from "lucide-react";
import type { Post } from "../../hooks/mate/mate.types";
import { getAirportDisplay, CURRENT_USER } from "../../hooks/mate/mate.constants";
import "../../styles/mate/MatePostCard.css";

interface MatePostCardProps {
  post: Post;
  isLiked: boolean;
  isRemoved: boolean;
  isRemovedMode?: boolean;
  onCardClick: (post: Post) => void;
  onLike: (postId: string, e: MouseEvent<HTMLButtonElement>) => void;
  onRemove: (postId: string, e: MouseEvent<HTMLButtonElement>) => void;
  onRestore: (postId: string, e: MouseEvent<HTMLButtonElement>) => void;
  onDelete: (postId: string, e: MouseEvent<HTMLButtonElement>) => void;
}

export function MatePostCard({
  post,
  isLiked,
  isRemoved,
  isRemovedMode,
  onCardClick,
  onLike,
  onRemove,
  onRestore,
  onDelete,
}: MatePostCardProps): JSX.Element {
  const isAuthor = post.author.email === CURRENT_USER.email;

  return (
    <div className="bg-white flex overflow-hidden relative group transition-all mate-card">
      
      {/* PASSED 배지 */}
      {isRemovedMode && (
        <div className="absolute top-0 left-0 px-3 py-1 text-xs font-bold z-10 mate-badge">
          PASSED
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div
        onClick={() => onCardClick(post)}
        className="flex-1 p-6 cursor-pointer flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-left">
              <div className="text-xs text-black/50 uppercase font-bold mb-1">From</div>
              <div className="text-2xl font-bold text-black">
                {getAirportDisplay(post.from)}
              </div>
            </div>

            <div className="text-2xl text-black/60 mx-2">✈</div>

            <div className="text-left">
              <div className="text-xs text-black/50 uppercase font-bold mb-1">To</div>
              <div className="text-2xl font-bold text-black">{post.destination}</div>
            </div>
          </div>
        </div>

        {/* 출발/도착/좌석 등 */}
        <div className="flex items-center gap-6 mb-4">
          <div>
            <div className="text-[10px] text-black/50 uppercase font-bold">Departure</div>
            <div className="text-sm font-bold text-black">
              {post.dates.start.slice(5)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-black/50 uppercase font-bold">Arrival</div>
            <div className="text-sm font-bold text-black">{post.dates.end.slice(5)}</div>
          </div>

          <div>
            <div className="text-[10px] text-black/50 uppercase font-bold">Seat</div>
            <div className="text-sm font-bold text-black">
              {post.participants.current}/{post.participants.max}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-black/50 uppercase font-bold">Ticket No.</div>
            <div className="text-sm font-bold text-black">
              {post.id.toString().padStart(6, "0")}
            </div>
          </div>
        </div>

        {/* 태그 */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {post.ageGroup && (
            <span className="text-xs px-2 py-1 font-bold mate-badge">
              {post.ageGroup}
            </span>
          )}

          {post.gender && (
            <span className="text-xs px-2 py-1 font-bold mate-badge">
              {post.gender}
            </span>
          )}

          {post.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs px-2 py-1 font-bold mate-badge">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* 중앙 구분선 */}
      <div className="w-px border-l-2 border-dashed border-black/30 my-4"></div>

      {/* 사이드바 */}
      <div className="flex-shrink-0 w-32 bg-white p-4 relative">

        {/* 데코 원 */}
        <div className="absolute -right-3 top-0 bottom-0 flex flex-col justify-around">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-[#f4f4f4] mate-circle"
            ></div>
          ))}
        </div>

        {/* 조회/좋아요: 기본 표시 */}
        <div className="space-y-3 group-hover:opacity-0 transition-opacity">
          <div className="text-center">
            <div className="text-[10px] text-black/50 uppercase font-bold mb-1">
              Budget
            </div>
            <div className="text-xl font-bold text-black font-mono">
              {post.budget}
            </div>
          </div>

          <div className="border-t-2 border-black/20"></div>

          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-black/50" />
            <div className="text-[10px] text-black/50 uppercase font-bold">
              Views
            </div>
          </div>
          <div className="text-sm font-bold text-black font-mono">{post.views}</div>

          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-black/50" />
            <div className="text-[10px] text-black/50 uppercase font-bold">
              Likes
            </div>
          </div>

          <div className="text-sm font-bold text-black font-mono flex items-center gap-1">
            {post.likes}
            {isLiked && (
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            )}
          </div>
        </div>

        {/* hover: 액션 버튼 */}
        <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">

          {isAuthor ? (
            <>
              <button
                onClick={(e) => onDelete?.(post.id, e)}
                className="w-14 h-14 bg-white transition-colors flex items-center justify-center mate-action-button group/del"
              >
                <Trash2 className="w-6 h-6 text-[#999] group-hover/del:text-[#ff4d4d] group-hover/del:scale-110 transition-all" />
              </button>
              <div className="text-xs font-bold text-[#ff4d4d]">DELETE</div>
            </>
          ) : (
            <>
              {isRemoved ? (
                <>
                  <button
                    onClick={(e) => onRestore(post.id, e)}
                    className="w-14 h-14 transition-colors flex items-center justify-center mate-action-button mate-bg-black-hoverable"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                  <div className="text-xs font-bold text-black">UNPASS</div>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => onRemove(post.id, e)}
                    className="w-14 h-14 bg-white hover:bg-[#eee] transition-colors flex items-center justify-center mate-action-button"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="text-xs font-bold text-black">PASS</div>
                </>
              )}

              <div className="border-t-2 border-black/20 w-full my-2"></div>

              <button
                onClick={(e) => onLike(post.id, e)}
                className={`w-14 h-14 transition-colors flex items-center justify-center mate-action-button ${
                  isLiked ? "mate-bg-red" : "mate-bg-black-hoverable"
                }`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
              </button>
              <div className="text-xs font-bold text-black">
                {isLiked ? "UNLIKE" : "LIKE"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
