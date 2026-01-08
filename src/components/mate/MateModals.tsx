import { X, Plus, Eye, Heart, Send, Check, XCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/mate/datepicker.css";
import type { Post, MyApplication, ReceivedApplication, SelectedApplicant } from "./mate.types";
import { getAirportDisplay, TRANSPORT_OPTIONS, TRAVEL_TYPE_OPTIONS, AGE_GROUP_OPTIONS, GENDER_OPTIONS } from "./mate.constants";
import styles from "../../styles/mate/MateModals.module.css";

// ============================================================
// MateDetailModal - 게시물 상세 모달
// ============================================================
interface DetailModalProps {
  post: Post;
  isLiked: boolean;
  showApplyMessage: boolean;
  applyMessage: string;
  onClose: () => void;
  onApply: () => void;
  onSendApplication: (post: Post) => void;
  onApplyMessageChange: (message: string) => void;
  onCancelApply: () => void;
}

export function MateDetailModal({
  post,
  isLiked,
  showApplyMessage,
  applyMessage,
  onClose,
  onApply,
  onSendApplication,
  onApplyMessageChange,
  onCancelApply,
}: DetailModalProps): JSX.Element {
  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 ${styles.overlay}`} onClick={onClose}>
      <div className={`bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-6 flex items-center justify-between sticky top-0 z-10 ${styles.header} ${styles.bgBlack}`}>
          <h2 className="text-xl font-bold font-mono uppercase">
            TRIP DETAILS // ID: TM{post.id.toString().padStart(4, "0")}
          </h2>
          <button onClick={onClose} className="hover:bg-white hover:text-black p-2 transition-colors border-2 border-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {/* Route Info */}
          <div className={`bg-[#eee] p-6 mb-6 ${styles.infoBoxLarge}`}>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-xs text-black/50 uppercase font-bold mb-2">Departure</div>
                <div className="text-4xl font-bold text-black">{getAirportDisplay(post.from)}</div>
                <div className="text-sm text-black/60 mt-1">{post.dates.start}</div>
              </div>
              <div className="text-4xl text-black/40">✈</div>
              <div className="text-center">
                <div className="text-xs text-black/50 uppercase font-bold mb-2">Arrival</div>
                <div className="text-4xl font-bold text-black">{post.destination}</div>
                <div className="text-sm text-black/60 mt-1">{post.dates.end}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 mb-6">
            <div className={`flex items-center gap-2 bg-[#eee] px-4 py-2 ${styles.infoBox}`}>
              <Eye className="w-4 h-4" />
              <span className="font-mono font-bold">{post.views}</span>
              <span className="text-xs text-black/60">views</span>
            </div>
            <div className={`flex items-center gap-2 bg-[#eee] px-4 py-2 ${styles.infoBox}`}>
              <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              <span className="font-mono font-bold">{post.likes}</span>
              <span className="text-xs text-black/60">likes</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`bg-[#f5f5f5] p-4 ${styles.infoBox}`}>
              <div className="text-xs text-black/50 uppercase font-bold mb-1">Duration</div>
              <div className="font-bold">{post.duration}</div>
            </div>
            <div className={`bg-[#f5f5f5] p-4 ${styles.infoBox}`}>
              <div className="text-xs text-black/50 uppercase font-bold mb-1">Budget</div>
              <div className="font-bold font-mono">{post.budget}</div>
            </div>
            <div className={`bg-[#f5f5f5] p-4 ${styles.infoBox}`}>
              <div className="text-xs text-black/50 uppercase font-bold mb-1">Participants</div>
              <div className="font-bold">{post.participants.current} / {post.participants.max}</div>
            </div>
            <div className={`bg-[#f5f5f5] p-4 ${styles.infoBox}`}>
              <div className="text-xs text-black/50 uppercase font-bold mb-1">Preference</div>
              <div className="font-bold">{post.gender} · {post.ageGroup}</div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="text-xs text-black/50 uppercase font-bold mb-2">Travel Style</div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className={`px-3 py-1.5 text-sm font-bold ${styles.badge}`}>#{tag}</span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <div className="text-xs text-black/50 uppercase font-bold mb-2">Description</div>
            <div className={`bg-[#f5f5f5] p-4 text-sm leading-relaxed ${styles.infoBox}`}>{post.description}</div>
          </div>

          <div className="border-t-2 border-dashed border-black/30 my-6"></div>

          {/* Author */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 text-4xl flex items-center justify-center ${styles.infoBox} ${styles.bgBlack}`}>
              {post.author.avatar}
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-black mb-1">{post.author.name}</div>
              <div className="text-sm text-black/60 font-mono mb-2">{post.author.email}</div>
              <div className="flex gap-2">
                <span className={`inline-block bg-white px-3 py-1 text-xs font-bold font-mono ${styles.infoBox}`}>
                  {post.author.age}세
                </span>
                <span className={`inline-block bg-white px-3 py-1 text-xs font-bold font-mono ${styles.infoBox}`}>
                  {post.author.gender}
                </span>
              </div>
            </div>
          </div>

          {/* Apply Section */}
          {!showApplyMessage ? (
            <div className="space-y-3">
              {/* 신청하기 버튼 */}
              <button
                onClick={onApply}
                className={`w-full py-4 font-bold text-lg uppercase tracking-wide transition-colors flex items-center justify-center gap-2 ${styles.button} ${styles.bgBlackHoverable}`}
              >
                <Plus className="w-5 h-5" />
                APPLY TO JOIN
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-black/50 uppercase font-bold">Your Message</div>
              <textarea
                value={applyMessage}
                onChange={(e) => onApplyMessageChange(e.target.value)}
                placeholder="자기소개와 함께 여행에 참여하고 싶은 이유를 적어주세요..."
                className={`w-full h-32 p-4 bg-[#eee] resize-none focus:outline-none focus:bg-white text-sm font-mono ${styles.infoBoxLarge}`}
              />
              <div className="flex gap-4">
                <button
                  onClick={onCancelApply}
                  className={`flex-1 py-3 bg-white text-black font-bold uppercase tracking-wide hover:bg-[#eee] transition-colors ${styles.button}`}
                >
                  CANCEL
                </button>
                <button
                  onClick={() => onSendApplication(post)}
                  className={`flex-1 py-3 font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 ${styles.button} ${styles.bgBlackHoverable}`}
                >
                  <Send className="w-4 h-4" />
                  SEND APPLICATION
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MateWriteModal - 게시물 작성 모달
// ============================================================
interface WriteModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  selectedTransport: string[];
  setSelectedTransport: (value: string[]) => void;
  selectedTravelTypes: string[];
  setSelectedTravelTypes: (value: string[]) => void;
  selectedAgeGroups: string[];
  setSelectedAgeGroups: (value: string[]) => void;
  selectedGender: string;
  setSelectedGender: (value: string) => void;
}

export function MateWriteModal({
  onClose,
  onSubmit,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedTransport,
  setSelectedTransport,
  selectedTravelTypes,
  setSelectedTravelTypes,
  selectedAgeGroups,
  setSelectedAgeGroups,
  selectedGender,
  setSelectedGender,
}: WriteModalProps): JSX.Element {
  const toggleTransport = (t: string) => {
    setSelectedTransport(selectedTransport.includes(t) ? selectedTransport.filter(x => x !== t) : [...selectedTransport, t]);
  };
  const toggleTravelType = (t: string) => {
    setSelectedTravelTypes(selectedTravelTypes.includes(t) ? selectedTravelTypes.filter(x => x !== t) : [...selectedTravelTypes, t]);
  };
  const toggleAgeGroup = (a: string) => {
    setSelectedAgeGroups(selectedAgeGroups.includes(a) ? selectedAgeGroups.filter(x => x !== a) : [...selectedAgeGroups, a]);
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 ${styles.overlay}`} onClick={onClose}>
      <div className={`bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 flex items-center justify-between sticky top-0 z-10 ${styles.header} ${styles.bgBlack}`}>
          <h2 className="text-xl font-bold font-mono uppercase">NEW TRIP POST</h2>
          <button onClick={onClose} className="hover:bg-white hover:text-black p-2 transition-colors border-2 border-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-6">
          {/* Destination */}
          <div>
            <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Destination *</label>
            <input name="destination" type="text" required placeholder="여행지를 입력하세요"
              className="w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-mono" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Start Date *</label>
              <DatePicker selected={startDate} onChange={setStartDate} dateFormat="yyyy-MM-dd" placeholderText="출발일"
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" required />
            </div>
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">End Date *</label>
              <DatePicker selected={endDate} onChange={setEndDate} dateFormat="yyyy-MM-dd" placeholderText="도착일"
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" required />
            </div>
          </div>

          {/* Budget & Participants */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Budget</label>
              <input name="budget" type="text" placeholder="$1,000"
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" />
            </div>
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Max Participants</label>
              <input name="participants" type="text" placeholder="1/4"
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" />
            </div>
          </div>

          {/* Transport */}
          <div>
            <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Transport</label>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_OPTIONS.map((t) => (
                <button key={t} type="button" onClick={() => toggleTransport(t)}
                  className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${selectedTransport.includes(t) ? styles.bgBlack : "bg-white hover:bg-[#eee]"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Type */}
          <div>
            <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Travel Style</label>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_TYPE_OPTIONS.map((t) => (
                <button key={t} type="button" onClick={() => toggleTravelType(t)}
                  className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${selectedTravelTypes.includes(t) ? styles.bgBlack : "bg-white hover:bg-[#eee]"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Preferred Gender</label>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.filter(g => g !== "전체").map((g) => (
                  <button key={g} type="button" onClick={() => setSelectedGender(g)}
                    className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${selectedGender === g ? styles.bgBlack : "bg-white hover:bg-[#eee]"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Preferred Age</label>
              <div className="flex flex-wrap gap-2">
                {AGE_GROUP_OPTIONS.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAgeGroup(a)}
                    className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${selectedAgeGroups.includes(a) ? styles.bgBlack : "bg-white hover:bg-[#eee]"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Description</label>
            <textarea name="description" placeholder="여행 계획과 함께하고 싶은 메이트 조건을 적어주세요..."
              className="w-full h-32 p-3 border-2 border-black focus:outline-none resize-none font-mono" />
          </div>

          {/* Submit */}
          <button type="submit"
            className={`w-full py-4 font-bold text-lg uppercase tracking-wide transition-colors ${styles.button} ${styles.bgBlackHoverable}`}>
            POST TRIP
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MateMySentModal - 내가 보낸 신청 목록
// ============================================================
interface MySentModalProps {
  applications: MyApplication[];
  getApplicantStatus: (id: string) => "approved" | "rejected" | "pending";
  onClose: () => void;
}

export function MateMySentModal({ 
  applications, 
  getApplicantStatus, 
  onClose,
}: MySentModalProps): JSX.Element {
  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 ${styles.overlay}`} onClick={onClose}>
      <div className={`bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 flex items-center justify-between sticky top-0 z-10 ${styles.header} ${styles.bgBlack}`}>
          <h2 className="text-xl font-bold font-mono uppercase">MY SENT APPLICATIONS</h2>
          <button onClick={onClose} className="hover:bg-white hover:text-black p-2 transition-colors border-2 border-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <Send className="w-16 h-16 mx-auto mb-4 text-black/30" />
              <p className="font-bold text-black/60">NO APPLICATIONS YET</p>
              <p className="text-sm text-black/40 mt-2">// 아직 신청한 여행이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const status = getApplicantStatus(app.id);
                return (
                  <div key={app.id} className={`${styles.card} ${status === "approved" ? styles.cardApproved : status === "rejected" ? styles.cardRejected : ""}`}>
                    <div className={`bg-[#eee] p-4 ${styles.header}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="text-lg font-bold text-black">{app.postDestination}</div>
                          <div className="text-sm text-black/60 font-mono">{app.postDates.start} ~ {app.postDates.end}</div>
                          <div className="text-xs text-black/40 mt-1">by {app.postAuthor.name}</div>
                        </div>
                        <span className={`px-3 py-1 text-sm font-bold ${status === "approved" ? styles.bgGreen : status === "rejected" ? styles.bgRed : styles.bgBlack}`}>
                          {status === "approved" ? "APPROVED" : status === "rejected" ? "REJECTED" : "PENDING"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className={`bg-[#f4f4f4] p-3 text-sm mb-3 ${styles.infoBox}`}>{app.applicant.message || "메시지 없음"}</div>
                      <div className="flex items-center justify-between text-xs text-black/60 flex-wrap gap-2">
                        <span>신청일: {app.applicant.appliedDate}</span>
                        <span>예산: {app.applicant.budget}</span>
                      </div>
                      
                      {/* 승인 시 채팅 페이지 안내 */}
                      {status === "approved" && (
                        <div className="mt-3 px-4 py-2 bg-purple-50 border-2 border-purple-300 rounded-lg text-center">
                          <span className="text-purple-700 text-sm font-bold">
                            💬 채팅 목록에서 단체방에 참여하세요
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MateReceivedModal - 받은 신청 목록
// ============================================================
interface ReceivedModalProps {
  applications: ReceivedApplication[];
  getApplicantStatus: (id: string) => "approved" | "rejected" | "pending";
  onApprove: (id: string, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onReject: (id: string, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onSelectApplicant: (applicant: SelectedApplicant) => void;
  onClose: () => void;
}

export function MateReceivedModal({ 
  applications, 
  getApplicantStatus, 
  onApprove, 
  onReject, 
  onSelectApplicant, 
  onClose,
}: ReceivedModalProps): JSX.Element {
  // ✅ ReceivedApplication에서 직접 postDestination과 postDates 사용
  const groupedByPost = applications.reduce((acc, app) => {
    if (!acc[app.postId]) {
      acc[app.postId] = { 
        destination: app.postDestination, 
        dates: app.postDates, 
        applicants: [] 
      };
    }
    acc[app.postId].applicants.push(app);
    return acc;
  }, {} as Record<string, { destination: string; dates: { start: string; end: string }; applicants: ReceivedApplication[] }>);

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 ${styles.overlay}`} onClick={onClose}>
      <div className={`bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 flex items-center justify-between sticky top-0 z-10 ${styles.header} ${styles.bgBlack}`}>
          <h2 className="text-xl font-bold font-mono uppercase">RECEIVED APPLICATIONS</h2>
          <button onClick={onClose} className="hover:bg-white hover:text-black p-2 transition-colors border-2 border-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {Object.keys(groupedByPost).length === 0 ? (
            <div className="text-center py-12">
              <Send className="w-16 h-16 mx-auto mb-4 text-black/30" />
              <p className="font-bold text-black/60">NO APPLICATIONS</p>
              <p className="text-sm text-black/40 mt-2">// 아직 받은 신청이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedByPost).map(([postId, data]) => {
                // 승인된 신청자가 있는지 확인
                const hasApprovedApplicants = data.applicants.some(app => getApplicantStatus(app.id) === "approved");
                
                return (
                  <div key={postId} className={styles.card}>
                    <div className={`bg-[#eee] p-4 ${styles.header}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex-1">
                          <div className="text-lg font-bold text-black">{data.destination}</div>
                          <div className="text-sm text-black/60 font-mono">{data.dates.start} ~ {data.dates.end}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-sm font-bold ${styles.badge}`}>{data.applicants.length} applicants</span>
                          
                          {hasApprovedApplicants && (
                            <span className="px-3 py-1 text-xs font-bold bg-purple-200 border-2 border-black">
                              💬 채팅 가능
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {data.applicants.map((app) => {
                        const status = getApplicantStatus(app.id);
                        return (
                          <div key={app.id}
                            onClick={() => onSelectApplicant({ 
                              id: app.id,  // ✅ ID 추가
                              postId: app.postId, 
                              postDestination: app.postDestination, 
                              applicant: app.applicant 
                            })}
                            className={`border-2 border-black p-4 cursor-pointer transition-colors ${status === "pending" ? "bg-[#eee] hover:bg-[#ddd]" : status === "approved" ? "bg-green-100" : "bg-red-100"}`}>
                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 text-2xl flex items-center justify-center ${styles.infoBox} ${styles.bgBlack}`}>
                                  {app.applicant.avatar}
                                </div>
                                <div>
                                  <div className="font-bold text-black flex items-center gap-2 flex-wrap">
                                    {app.applicant.name}
                                    {status !== "pending" && (
                                      <span className={`text-xs px-2 py-0.5 text-white ${status === "approved" ? styles.bgGreen : styles.bgRed}`}>
                                        {status === "approved" ? "APPROVED" : "REJECTED"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-black/60 font-mono">{app.applicant.email}</div>
                                  <div className="flex gap-2 mt-1">
                                    <span className={`text-xs bg-white px-2 py-0.5 font-bold ${styles.infoBox}`}>{app.applicant.age}세</span>
                                    <span className={`text-xs bg-white px-2 py-0.5 font-bold ${styles.infoBox}`}>{app.applicant.gender}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); onApprove(app.id, e); }}
                                  className={`px-4 py-2 border-2 border-black text-sm font-bold transition-colors ${status === "approved" ? styles.bgGreen : styles.bgBlack}`}>
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onReject(app.id, e); }}
                                  className={`px-4 py-2 border-2 border-black text-sm font-bold transition-colors ${status === "rejected" ? styles.bgRed : "bg-white text-black hover:bg-[#ddd]"}`}>
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-3 text-sm text-black/70 line-clamp-2">{app.applicant.message}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MateApplicantDetailModal - 신청자 상세 모달
// ============================================================
interface ApplicantDetailModalProps {
  applicant: SelectedApplicant;
  getApplicantStatus: (id: string) => "approved" | "rejected" | "pending";
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClose: () => void;
}

export function MateApplicantDetailModal({ 
  applicant, 
  getApplicantStatus, 
  onApprove, 
  onReject, 
  onClose 
}: ApplicantDetailModalProps): JSX.Element {
  // ✅ applicant.id 사용 (SelectedApplicant에 id 포함되어 있음)
  const status = getApplicantStatus(applicant.id);

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-[60] ${styles.overlay}`} onClick={onClose}>
      <div className={`bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 flex items-center justify-between ${styles.header} ${styles.bgBlack}`}>
          <h2 className="text-xl font-bold font-mono uppercase">APPLICANT DETAIL</h2>
          <button onClick={onClose} className="hover:bg-white hover:text-black p-2 transition-colors border-2 border-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Trip Info */}
          <div className={`p-4 mb-6 ${styles.infoBoxLarge} ${styles.bgBlack}`}>
            <div className="text-xs text-white/50 uppercase font-bold mb-1">Applying for</div>
            <div className="text-2xl font-bold">{applicant.postDestination}</div>
          </div>

          {/* Applicant Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-20 h-20 text-5xl flex items-center justify-center ${styles.infoBox} ${styles.bgBlack}`}>
              {applicant.applicant.avatar}
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-black mb-1">{applicant.applicant.name}</div>
              <div className="text-sm text-black/60 font-mono mb-2">{applicant.applicant.email}</div>
              <div className="flex gap-2">
                <span className={`bg-white px-3 py-1 text-xs font-bold ${styles.infoBox}`}>{applicant.applicant.age}세</span>
                <span className={`bg-white px-3 py-1 text-xs font-bold ${styles.infoBox}`}>{applicant.applicant.gender}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-6">
            <div className={`bg-[#f5f5f5] p-4 ${styles.infoBox}`}>
              <div className="text-xs text-black/50 uppercase font-bold mb-2">Travel Style</div>
              <div className="flex flex-wrap gap-2">
                {applicant.applicant.travelStyle?.map((s) => (
                  <span key={s} className={`px-2 py-1 text-xs font-bold ${styles.badge}`}>{s}</span>
                ))}
              </div>
            </div>
            
            {applicant.applicant.preferredActivities && applicant.applicant.preferredActivities.length > 0 && (
              <div className={`bg-[#f5f5f5] p-4 ${styles.infoBox}`}>
                <div className="text-xs text-black/50 uppercase font-bold mb-2">Preferred Activities</div>
                <div className="flex flex-wrap gap-2">
                  {applicant.applicant.preferredActivities.map((a) => (
                    <span key={a} className={`px-2 py-1 text-xs font-bold ${styles.badge}`}>{a}</span>
                  ))}
                </div>
              </div>
            )}
            
            {applicant.applicant.budget && (
              <div className={`bg-[#f5f5f5] p-4 ${styles.infoBox}`}>
                <div className="text-xs text-black/50 uppercase font-bold mb-2">Budget</div>
                <div className="font-bold font-mono text-lg">{applicant.applicant.budget}</div>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="mb-6">
            <div className="text-xs text-black/50 uppercase font-bold mb-2">Message</div>
            <div className={`bg-[#eee] p-4 text-sm leading-relaxed ${styles.infoBoxLarge}`}>{applicant.applicant.message}</div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button onClick={() => onReject(applicant.id)}
              className={`flex-1 py-3 font-bold uppercase tracking-wide transition-colors ${styles.button} ${status === "rejected" ? styles.bgRed : "bg-white text-black hover:bg-[#eee]"}`}>
              {status === "rejected" ? "REJECTED" : "REJECT"}
            </button>
            <button onClick={() => onApprove(applicant.id)}
              className={`flex-1 py-3 font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 ${styles.button} ${status === "approved" ? styles.bgGreen : styles.bgBlack}`}>
              {status === "approved" ? "APPROVED" : <><Check className="w-4 h-4" />APPROVE</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}