import { MouseEvent } from "react";
import { Heart, X, Eye, RotateCcw, Trash2 } from "lucide-react";
import type { Post } from "./mate.types";
import { getAirportDisplay, CURRENT_USER } from "./mate.constants";
import styles from "../../styles/mate/MatePostCard.module.css";

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
  onDelete 
}: MatePostCardProps): JSX.Element {

  const isAuthor = post.author.email === CURRENT_USER.email;

  return (
    <div className={`bg-white flex overflow-hidden relative group transition-all ${styles.card}`}>
      {/* Passed Badge */}
      {isRemovedMode && (
        <div className={`absolute top-0 left-0 px-3 py-1 text-xs font-bold z-10 ${styles.badge}`}>
          PASSED
        </div>
      )}

      {/* Main Content */}
      <div onClick={() => onCardClick(post)} className="flex-1 p-6 cursor-pointer flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-left">
              <div className="text-xs text-black/50 uppercase font-bold mb-1">From</div>
              <div className="text-2xl font-bold text-black">{getAirportDisplay(post.from)}</div>
            </div>
            <div className="text-2xl text-black/60 mx-2">✈</div>
            <div className="text-left">
              <div className="text-xs text-black/50 uppercase font-bold mb-1">To</div>
              <div className="text-2xl font-bold text-black">{post.destination}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-4">
          <div>
            <div className="text-[10px] text-black/50 uppercase font-bold">Departure</div>
            <div className="text-sm font-bold text-black">{post.dates.start.slice(5)}</div>
          </div>
          <div>
            <div className="text-[10px] text-black/50 uppercase font-bold">Arrival</div>
            <div className="text-sm font-bold text-black">{post.dates.end.slice(5)}</div>
          </div>
          <div>
            <div className="text-[10px] text-black/50 uppercase font-bold">Seat</div>
            <div className="text-sm font-bold text-black">{post.participants.current}/{post.participants.max}</div>
          </div>
          <div>
            <div className="text-[10px] text-black/50 uppercase font-bold">Ticket No.</div>
            <div className="text-sm font-bold text-black">{post.id.toString().padStart(6, "0")}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {post.ageGroup && <span className={`text-xs px-2 py-1 font-bold ${styles.badge}`}>{post.ageGroup}</span>}
          {post.gender && <span className={`text-xs px-2 py-1 font-bold ${styles.badge}`}>{post.gender}</span>}
          {post.tags.slice(0, 2).map((tag) => (
            <span key={tag} className={`text-xs px-2 py-1 font-bold ${styles.badge}`}>#{tag}</span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px border-l-2 border-dashed border-black/30 my-4"></div>

      {/* Sidebar */}
      <div className="flex-shrink-0 w-32 bg-white p-4 relative">
        {/* Decorative Circles */}
        <div className="absolute -right-3 top-0 bottom-0 flex flex-col justify-around">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-6 h-6 rounded-full bg-[#f4f4f4] ${styles.circle}`}></div>
          ))}
        </div>

        {/* Stats */}
        <div className="space-y-3 group-hover:opacity-0 transition-opacity">
          <div className="text-center">
            <div className="text-[10px] text-black/50 uppercase font-bold mb-1">Budget</div>
            <div className="text-xl font-bold text-black font-mono">{post.budget}</div>
          </div>
          <div className="border-t-2 border-black/20"></div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-black/50" />
            <div className="text-[10px] text-black/50 uppercase font-bold">Views</div>
          </div>
          <div className="text-sm font-bold text-black font-mono">{post.views}</div>
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-black/50" />
            <div className="text-[10px] text-black/50 uppercase font-bold">Likes</div>
          </div>
          <div className="text-sm font-bold text-black font-mono flex items-center gap-1">
            {post.likes}
            {isLiked && <Heart className="w-3 h-3 text-red-500 fill-red-500" />}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
          
          {isAuthor ? (
            /* 1. 작성자 본인인 경우: 삭제 버튼만 표시 */
            <>
              <button 
                onClick={(e) => onDelete?.(post.id, e)} 
                className={`w-14 h-14 bg-white transition-colors flex items-center justify-center ${styles.actionButton} group/del`}
                title="삭제하기"
              >
                <Trash2 className="w-6 h-6 text-[#999] group-hover/del:text-[#ff4d4d] group-hover/del:scale-110 transition-all" />
              </button>
              <div className="text-xs font-bold text-[#ff4d4d]">DELETE</div>
            </>
          ) : (
            /* 2. 작성자가 아닌 경우: 기존 PASS/LIKE 버튼 표시 */
            <>
              {/* Pass / Unpass Toggle */}
              {isRemoved ? (
                <>
                  <button 
                    onClick={(e) => onRestore(post.id, e)} 
                    className={`w-14 h-14 transition-colors flex items-center justify-center ${styles.actionButton} ${styles.bgBlackHoverable}`}
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                  <div className="text-xs font-bold text-black">UNPASS</div>
                </>
              ) : (
                <>
                  <button 
                    onClick={(e) => onRemove(post.id, e)} 
                    className={`w-14 h-14 bg-white hover:bg-[#eee] transition-colors flex items-center justify-center ${styles.actionButton}`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="text-xs font-bold text-black">PASS</div>
                </>
              )}

              <div className="border-t-2 border-black/20 w-full my-2"></div>

              <button 
                onClick={(e) => onLike(post.id, e)} 
                className={`w-14 h-14 transition-colors flex items-center justify-center ${styles.actionButton} ${isLiked ? styles.bgRed : styles.bgBlackHoverable}`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
              </button>
              <div className="text-xs font-bold text-black">{isLiked ? "UNLIKE" : "LIKE"}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
