import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Heart, Calendar, Users, Wallet, Eye
} from "lucide-react";
import type { Post, ApplicationRequest } from "../hooks/mate.types";
import { getCurrentUserId, calculateDuration, getAgeGroupLabel, getGenderPreferenceLabel, getTransportLabel } from "../hooks/mate.constants";
import { useMate } from "../hooks/useMate";
import { isPostExpired } from "../hooks/mate.util";
import { useAuthGuard } from "../hooks/useAuthGuard";
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

  const { withLoginCheck } = useAuthGuard();

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
      isLiked: !prev.liked,
      likesCount: prev.liked ? prev.likesCount - 1 : prev.likesCount + 1
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

      setPost(prev => prev ? {
        ...prev,
        hasApplied: true, // 신청 완료 상태로 변경
        currentParticipant: prev.currentParticipant + 1 // 필요시 참여 인원 수도 즉시 반영
      } : null);

      setShowApplyForm(false);
      setApplyMessage("");
      alert("신청이 완료되었습니다!");
      
    } catch (error) {
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

  const isLiked = post.liked || false;
  const hasApplied = post.hasApplied || false;
  const isExpire = isPostExpired(post);

  return (
    <div className="mate-detail">
      <div className="max-w-4xl mx-auto px-6 py-16">
        
        {/* 1. 상단 내비게이션 & 메타 정보 (조회수, 좋아요 가로 배치) */}
        <div className="flex justify-between items-end header-border">
          <div>
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 mb-6 font-bold hover:underline group"
            >
              <ArrowLeft size={20} strokeWidth={3} className="transition-transform group-hover:-translate-x-1" />
              <span className="uppercase tracking-tighter text-lg font-black">Back to List</span>
            </button>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none text-black">
              {post.destination}
            </h1>
          </div>

          <div className="flex gap-3 mb-1">
            {/* 조회수 박스 */}
            <div className="stat-box">
              <Eye size={18} strokeWidth={3} className="text-black" />
              <span>{post.viewsCount}</span>
            </div>

            {/* 좋아요 버튼 (활성화 시 빨간색) */}
            <button
              onClick={onLikeClick}
              className={`stat-box btn-like ${isLiked ? "active" : ""}`}
            >
              <Heart 
                size={18} 
                strokeWidth={3} 
                fill={isLiked ? "white" : "none"} 
              />
              <span>{post.likesCount}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* 왼쪽 컬럼 */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 2. 여행 필수 정보 섹션 */}
            <section className="info-grid">
              <div className="info-item border-r-4 border-black">
                <Calendar size={24} strokeWidth={3} className="mb-2 text-black" />
                <p className="info-label">Duration</p>
                <p className="text-lg font-black">{calculateDuration(post.startDate, post.endDate)}</p>
                <p className="text-[10px] font-bold text-gray-400">{post.startDate} ~ {post.endDate}</p>
              </div>
              <div className="info-item border-r-4 border-black">
                <Users size={24} strokeWidth={3} className="mb-2 text-black" />
                <p className="info-label">Members</p>
                <p className="text-lg font-black">{post.currentParticipant}/{post.maxParticipant}</p>
                <p className="text-[10px] font-bold text-gray-400">PEOPLES</p>
              </div>
              <div className="info-item">
                <Wallet size={24} strokeWidth={3} className="mb-2 text-black" />
                <p className="info-label">Budget</p>
                <p className="text-lg font-black">{post.budget.toLocaleString()}₩</p>
                <p className="text-[10px] font-bold text-gray-400">KRW</p>
              </div>
            </section>

            {/* 3. 메이트 선호도 섹션 */}
            <section className="preference-card">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-black text-white text-xs font-black px-2 py-1 uppercase italic">
                  Mate Preference
                </span>
                <div className="h-[2px] flex-grow bg-black/10"></div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="preference-item bg-blue-50">
                  <span className="text-[10px] font-black text-blue-600 uppercase">Trans</span>
                  <span className="text-sm font-black">{getTransportLabel(post.transport)}</span>
                </div>
                
                <div className="preference-item bg-pink-50">
                  <span className="text-[10px] font-black text-pink-600 uppercase">Gender</span>
                  <span className="text-sm font-black">{getGenderPreferenceLabel(post.genderPreference)}</span>
                </div>
                
                <div className="preference-item bg-green-50">
                  <span className="text-[10px] font-black text-green-600 uppercase">Age</span>
                  <span className="text-sm font-black">{getAgeGroupLabel(post.ageGroup)}</span>
                </div>
              </div>
            </section>

            {/* 4. 여행 소개글 (여기는 시원하게 유지) */}
            <section className="neo-card min-h-[400px]">
              <h3 className="text-2xl font-black mb-6 uppercase italic underline decoration-yellow-400 decoration-4 underline-offset-4">
                Travel Intro
              </h3>
              <div className="leading-relaxed whitespace-pre-wrap text-xl font-medium text-black/90">
                {post.content}
              </div>
            </section>
          </div>

          {/* 오른쪽 컬럼: 사이드바 (작성자 프로필 & 신청하기) */}
          <div className="space-y-10 lg:sticky lg:top-10">
            
            {/* 4. 작성자 상세 프로필 카드 */}
            <div className="author-card">
              <p className="inline-block text-[10px] font-black bg-black text-white px-3 py-1 mb-8 uppercase tracking-widest">
                Host Info
              </p>
              
              <div className="flex items-center gap-5 mb-10 border-black pb-8"
              style={{borderBottomWidth: "thin", borderBottomColor: "gray"}}>
                <div className="author-avatar">
                  {post.author.profileImage ? (
                    <img 
                      src={post.author.profileImage} 
                      alt="profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{post.author.avatarEmoji || "👤"}</span>
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="font-black text-3xl uppercase tracking-tighter leading-none mb-2 break-words">
                    {post.author.nickname}
                  </p>
                  <p className="text-xs font-bold border-black inline-block break-all">
                    {post.author.email}
                  </p>
                </div>
              </div>

              {/* 성별, 나이 정보 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="meta-tag">
                  <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Gender</p>
                  <p className="text-base font-black uppercase">{getGenderPreferenceLabel(post.author.gender.toLowerCase())}</p>
                </div>
                <div className="meta-tag">
                  <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Age</p>
                  <p className="text-base font-black">{post.author.age}세</p>
                </div>
              </div>

              {/* 여행 스타일 태그 */}
              {post.author?.travelStyles && post.author.travelStyles.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-500 mb-4">Travel Styles</p>
                  <div className="flex flex-wrap gap-2">
                    {post.author.travelStyles.map((tag) => (
                      <span key={tag} className="travel-style-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. 신청하기 섹션 */}
            <div className="apply-card">
              {isExpire ? (
                <>
                  <div className="text-center py-4 font-black uppercase italic text-xl border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    모집 종료
                  </div>
                </>
              ) : isAuthor ? (
                <>
                  <div className="text-center py-4 font-black uppercase italic text-xl border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    My Post
                  </div>
                </>
              ) : !showApplyForm ? (
                <button
                  disabled={hasApplied || post.currentParticipant >= post.maxParticipant}
                  onClick={() => withLoginCheck(() => setShowApplyForm(true))}
                  className="apply-button"
                >
                  {hasApplied ? "Applied" : post.currentParticipant >= post.maxParticipant ? "Full" : "Apply Now"}
                </button>
              ) : (
                <div className="space-y-5">
                  <textarea
                    className="w-full h-40 p-4 border-4 border-black font-bold resize-none focus:outline-none text-base bg-white placeholder:text-gray-400"
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    placeholder="신청 메시지를 입력하세요..."
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      className="py-3 border-4 border-black bg-white font-black uppercase hover:bg-gray-100 transition-all"
                      onClick={() => {
                        setShowApplyForm(false);
                        setApplyMessage("");
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      disabled={!applyMessage.trim()}
                      className="py-3 border-4 border-black bg-black text-white font-black uppercase disabled:opacity-50 transition-all"
                      onClick={handleApplySubmit}
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="py-12"></div>
      </div>
    </div>
  );
}