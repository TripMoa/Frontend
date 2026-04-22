import type { MouseEvent } from "react";
import { Heart, X, Eye, RotateCcw, Trash2 } from "lucide-react";
import type { Post } from "../hooks/mate.types";
import { 
  getCurrentUserId,
  TRANSPORT_REVERSE_MAP,
  GENDER_PREFERENCE_REVERSE_MAP,
  AGE_GROUP_REVERSE_MAP
} from "../hooks/mate.constants";
import "../styles/MatePostCard.css";
import { getAccessToken } from "../../../api/api";
import { useAuth } from "../../user/pages/AuthContext";

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
  const currentUserId = getCurrentUserId();
  const isAuthor = post.author.id === currentUserId;
  const { isAuthenticated } = useAuth();

  // 날짜 포맷팅 (YYYY-MM-DD -> MM-DD)
  const formatDate = (dateString: string) => {
    return dateString.slice(5);
  };

  // 한글 표시용 변환
  const transportDisplay = post.transport ? TRANSPORT_REVERSE_MAP[post.transport] || post.transport : "";
  const genderDisplay = post.genderPreference ? GENDER_PREFERENCE_REVERSE_MAP[post.genderPreference] || post.genderPreference : "";
  const ageGroupDisplay = post.ageGroup ? AGE_GROUP_REVERSE_MAP[post.ageGroup] || post.ageGroup : "";

  return (
    <div className="bg-white flex overflow-hidden relative group transition-all mate-card">
      
      {/* PASSED 배지 */}
      {isRemovedMode && (
        <div className="absolute top-0 left-0 px-3 py-1 text-xs font-bold z-10 mate-badge">
          PASSED
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div
        onClick={() => onCardClick(post)}
        className="flex-1 p-6 cursor-pointer flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
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
              {formatDate(post.startDate)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-black/50 uppercase font-bold">Arrival</div>
            <div className="text-sm font-bold text-black">{formatDate(post.endDate)}</div>
          </div>

          <div>
            <div className="text-[10px] text-black/50 uppercase font-bold">Seat</div>
            <div className="text-sm font-bold text-black">
              {post.currentParticipant}/{post.maxParticipant}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-black/50 uppercase font-bold">Ticket No.</div>
            <div className="text-sm font-bold text-black">
              {post.id.toString().padStart(6, "0")}
            </div>
          </div>

          {transportDisplay && (
            <div>
              <div className="text-[10px] text-black/50 uppercase font-bold">Transport</div>
              <div className="text-sm font-bold text-black">
                {transportDisplay}
              </div>
            </div>
          )}
        </div>

        {/* 태그 */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {ageGroupDisplay && (
            <span className="text-xs px-2 py-1 font-bold mate-badge">
              {ageGroupDisplay}
            </span>
          )}

          {genderDisplay && (
            <span className="text-xs px-2 py-1 font-bold mate-badge">
              {genderDisplay}
            </span>
          )}

          {/* 작성자의 여행 스타일 표시 */}
          {post.author.travelStyles?.slice(0, 3).map((style) => (
            <span key={style} className="text-xs px-2 py-1 font-bold mate-badge">
              #{style}
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
              {post.budget.toLocaleString()}
            </div>
          </div>

          <div className="border-t-2 border-black/20"></div>

          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-black/50" />
            <div className="text-[10px] text-black/50 uppercase font-bold">
              Views
            </div>
          </div>
          <div className="text-sm font-bold text-black font-mono">{post.viewsCount}</div>

          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-black/50" />
            <div className="text-[10px] text-black/50 uppercase font-bold">
              Likes
            </div>
          </div>

          <div className="text-sm font-bold text-black font-mono flex items-center gap-1">
            {post.likesCount}
            {isLiked && (
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            )}
          </div>
        </div>

        {/* hover: 액션 버튼 */}
        <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">

          {isExpiredMode ? (
            <>
              <div className="text-xs font-bold text-black/40 text-center">
                모집이 종료된<br />게시글입니다
              </div>
            </>
          )          
          : !isAuthenticated ? (
            <>
              <div className="text-xs font-bold text-black/40 text-center">
                회원 전용<br />서비스 입니다
              </div>
            </>
          )
          : isAuthor ? (
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