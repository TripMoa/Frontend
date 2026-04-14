import { useState, useEffect, useRef } from "react";
import { 
  Heart, Calendar, Users, Wallet, MapPin, X, Info 
} from "lucide-react";
import type { Post, ApplicationRequest, ApplicationResponse } from "../hooks/mate.types";
import { getCurrentUserId, calculateDuration } from "../hooks/mate.constants";
import { useMate } from "../hooks/useMate";
import "../styles/MateModals.css"; // 기존 모달 스타일 재사용

interface MateDetailModalProps {
  postId: number;
  onClose: () => void;
}

export default function MateDetailModal({ postId, onClose }: MateDetailModalProps) {
  const { toggleLike, fetchPostDetail } = useMate();
  const [post, setPost] = useState<Post | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const token = localStorage.getItem("accessToken");
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    const loadPost = async () => {
      try {
        setIsLoading(true);
        const postDetail = await fetchPostDetail(postId);
        if (postDetail) setPost(postDetail);
      } finally {
        setIsLoading(false);
      }
    };
    loadPost();
  }, [postId, fetchPostDetail]);

  const onLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post) return;
    // ... 기존 좋아요 로직 동일 ...
    const result = await toggleLike(post.id);
    if (result) setPost(prev => prev ? { ...prev, isLiked: result.liked, likesCount: result.count } : null);
  };

  const handleApplySubmit = async () => {
    if (!applyMessage.trim() || !post) return;
    try {
      const response = await fetch(`http://localhost:8080/api/mate/${postId}/apply/applicant`, {
        method: 'POST',
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ content: applyMessage }),
      });
      if (!response.ok) throw new Error('신청 실패');
      alert("신청이 완료되었습니다!");
      onClose(); // 성공 시 모달 닫기
    } catch (error) {
      alert("신청 중 오류가 발생했습니다.");
    }
  };

  if (isLoading || !post) return null;

  const isAuthor = post.author.id === currentUserId;
  const isLiked = post.isLiked || false;
  const hasApplied = post.hasApplied || false;

  return (
    <div className="modal-overlay active" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-window" style={{ maxWidth: "900px", width: "95%", height: "85vh", display: "flex", flexDirection: "column" }}>
        
        {/* 헤더 */}
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; MATE_DETAIL_VIEW</span>
          <div className="flex items-center gap-4">
            <button onClick={onLikeClick} className={`flex items-center gap-1.5 text-xs font-bold ${isLiked ? "text-red-500" : "text-white/50"}`}>
              <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
              {post.likesCount}
            </button>
            <button className="mh-close" onClick={onClose}>CLOSE [X]</button>
          </div>
        </div>

        {/* 바디 (스크롤 가능) */}
        <div className="modal-body" style={{ flex: 1, overflowY: "auto", background: "#f8f9fa", padding: "32px" }}>
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* 왼쪽 컬럼: 여행 정보 */}
            <div className="flex-1 space-y-6">
              {/* 여정 카드 */}
              <div className="bg-black text-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center text-center">
                  <div>
                    <p className="text-white/50 text-xs font-mono mb-1">DEPARTURE</p>
                    <p className="text-sm font-bold">{post.startDate}</p>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="relative border-t border-dashed border-white/30 my-2">
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-2 text-xl text-indigo-400">✈</span>
                    </div>
                    <p className="text-xl font-black tracking-tighter uppercase">{post.destination}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-mono mb-1">ARRIVAL</p>
                    <p className="text-sm font-bold">{post.endDate}</p>
                  </div>
                </div>
              </div>

              {/* 그리드 정보 */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Calendar size={18}/>, label: "기간", value: calculateDuration(post.startDate, post.endDate) },
                  { icon: <Wallet size={18}/>, label: "예산", value: `${post.budget.toLocaleString()}원` },
                  { icon: <Users size={18}/>, label: "인원", value: `${post.currentParticipant}/${post.maxParticipant}` },
                  { icon: <Info size={18}/>, label: "조회", value: post.viewsCount },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                    <div className="text-indigo-500">{item.icon}</div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{item.label}</p>
                      <p className="text-sm font-bold text-gray-800">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 소개 본문 */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 min-h-[200px]">
                <h3 className="text-xs font-black text-gray-300 uppercase mb-4 tracking-widest">// Introduction</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.author?.travelStyles?.map(tag => (
                    <span key={tag} className="text-[11px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 오른쪽 컬럼: 유저 & 신청 (고정 느낌) */}
            <div className="w-full md:w-[320px] space-y-4">
              {/* 작성자 카드 */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-300 uppercase mb-4 tracking-widest">Host Info</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl border-2 border-white shadow-inner">
                    {post.author.profileImage || "👤"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 leading-none mb-1">{post.author.nickname}</p>
                    <p className="text-xs text-gray-400">{post.author.email}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-xs font-medium text-gray-500">
                  <span>{post.author.age}세 · {post.author.gender}</span>
                  <span className="text-indigo-500">신뢰도 99%</span>
                </div>
              </div>

              {/* 신청 액션 영역 */}
              <div className="bg-white p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {isAuthor ? (
                  <p className="text-center py-2 text-sm font-bold text-gray-400">내 게시글입니다</p>
                ) : !showApplyForm ? (
                  <button
                    disabled={hasApplied || post.currentParticipant >= post.maxParticipant}
                    onClick={() => setShowApplyForm(true)}
                    className={`w-full py-4 rounded-xl font-black transition-all ${
                      hasApplied || post.currentParticipant >= post.maxParticipant
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                    }`}
                  >
                    {hasApplied ? "APPLIED" : post.currentParticipant >= post.maxParticipant ? "CLOSED" : "APPLY NOW"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 ring-indigo-500 outline-none resize-none"
                      rows={4}
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                      placeholder="함께하고 싶은 이유를 적어주세요!"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowApplyForm(false)} className="flex-1 py-3 text-xs font-bold text-gray-400">취소</button>
                      <button 
                        onClick={handleApplySubmit} 
                        disabled={!applyMessage.trim()}
                        className="flex-[2] py-3 bg-black text-white rounded-lg text-xs font-bold disabled:opacity-30"
                      >
                        신청서 보내기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}