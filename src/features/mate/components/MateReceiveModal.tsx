import { Send, Check, XCircle, ArrowLeft, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import "../styles/MateModals.css";
import type { ApplicationResponse, SelectedApplicant } from "../hooks/mate.types";
import { getApplicantAvatar, isPostExpired } from "../hooks/mate.util.ts";

interface ReceivedModalProps {
  applications: ApplicationResponse[];
  getApplicantStatus: (id: string) => "approved" | "rejected" | "pending";
  onApprove: (id: string, postId: number, applicantId: number, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onReject: (id: string, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onClose: () => void;
  onDeleteReceived?: (applyId: string) => void;
}

function AvatarDisplay({ profileImage, avatarEmoji, className }: {
  profileImage: string | null;
  avatarEmoji: string | null;
  className?: string;
}) {
  const avatar = getApplicantAvatar(profileImage, avatarEmoji);
  
  if (avatar.type === "image") {
    return <img src={avatar.src} className={`object-cover rounded-2xl ${className}`} />;
  }
  return <span>{avatar.value}</span>;
}

export function MateReceivedModal({ 
  applications = [], 
  getApplicantStatus, 
  onApprove, 
  onReject,
  onClose,
  onDeleteReceived,
}: ReceivedModalProps){
  const [selectedApplicant, setSelectedApplicant] = useState<SelectedApplicant | null>(null);

  const groupedByPost = applications.reduce((acc, app) => {
    if (!acc[app.matePostId]) {
      acc[app.matePostId] = { 
        destination: app.postDestination, 
        startDate: app.startDate,
        endDate: app.endDate, 
        applicants: [] 
      };
    }
    acc[app.matePostId].applicants.push(app);
    return acc;
  }, {} as Record<string, any>);

  // 신청자 상세 보기
  if (selectedApplicant) {
    const status = (
      applications.find(a => String(a.id) === String(selectedApplicant.id))?.status?.toLowerCase()
      ?? "pending"
    ) as "approved" | "rejected" | "pending";
    
    return (
      <div className="modal-overlay active" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-window detail-window" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal-header" style={{ marginBottom: "0px" }}>
            <span className="mh-title">&gt;&gt; APPLICANT DETAIL</span>
            <button className="mh-close" onClick={onClose}>CLOSE [X]</button>
          </div>

          <div className="modal-body" style={{ background: "#f9f9f9", padding: "24px" }}>
            <button 
              onClick={() => setSelectedApplicant(null)}
              className="flex items-center gap-2 mb-5 px-3 py-1.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO LIST
            </button>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden">
              {/* Trip Info Section */}
              <div className="mb-6 pb-6 border-b border-gray-100 text-center">
                <span className="text-[11px] text-indigo-500 font-bold tracking-widest uppercase mb-1 block">Applying for</span>
                <h2 className="text-2xl font-black text-gray-900">{selectedApplicant.postDestination}</h2>
              </div>

              {/* Applicant Profile */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 text-5xl flex items-center justify-center bg-gray-50 border border-gray-200 rounded-2xl mb-4 shadow-inner">
                  <AvatarDisplay profileImage={selectedApplicant.applicant.profileImage} avatarEmoji={selectedApplicant.applicant.avatarEmoji} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedApplicant.applicant.name}</h3>
                <p className="text-sm text-gray-400 font-mono mb-3">{selectedApplicant.applicant.email}</p>
                <div className="flex gap-2">
                  <span className="bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 rounded-full">{selectedApplicant.applicant.age}세</span>
                  <span className="bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 rounded-full">{selectedApplicant.applicant.gender}</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="text-[11px] text-gray-400 uppercase font-bold mb-2">Travel Style</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplicant.applicant.travelStyles?.map((s) => (
                      <span key={s} className="px-2.5 py-1 text-[11px] font-bold bg-white border border-gray-200 rounded-md text-gray-700">{s}</span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="text-[11px] text-gray-400 uppercase font-bold mb-2">Message</div>
                  <div className="text-sm text-gray-700 leading-relaxed italic">"{selectedApplicant.applicant.message}"</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {status === "pending" ? (
                  <>
                    <button
                      onClick={() => onReject(selectedApplicant.id)}
                      className="flex-1 py-3.5 font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                    >
                      REJECT
                    </button>
                    <button
                      onClick={() => onApprove(selectedApplicant.id, selectedApplicant.postId, selectedApplicant.applicantId)}
                      className="flex-[2] py-3.5 font-bold flex items-center justify-center gap-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                      style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}
                    >
                      <Check className="w-5 h-5" /> APPROVE
                    </button>
                  </>
                ) : status === "approved" ? (
                  <>
                    <button
                      disabled
                      className="flex-[2] py-3.5 font-bold flex items-center justify-center gap-2 rounded-xl cursor-not-allowed opacity-80"
                      style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white" }}
                    >
                      <Check className="w-5 h-5" /> APPROVED
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    className="w-full py-3.5 font-bold text-red-400 bg-red-50 border-2 border-red-200 rounded-xl cursor-not-allowed"
                  >
                    REJECTED
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 신청자 목록 보기
  return (
    <div className="modal-overlay active" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-window received-window" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ marginBottom: "0px"}}>
          <span className="mh-title">&gt;&gt; RECEIVED APPLICATIONS</span>
          <button className="mh-close" onClick={onClose}>CLOSE [X]</button>
        </div>

        <div className="modal-body" style={{ background: "#f9f9f9", padding: "24px" }}>
          {Object.keys(groupedByPost).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-xl">
              <Send className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">받은 신청이 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(groupedByPost).map(([postId, data]) => {
                const hasApproved = data.applicants.some((app: any) => getApplicantStatus(app.id) === "approved");

                return (
                  <div key={postId} className="group flex flex-col">
                    {/* Post Title Section */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div>
                        <h3 className="text-lg font-black text-gray-900">{data.destination}</h3>
                        <p className="text-xs text-gray-400 font-mono">{data.startDate} — {data.endDate}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 text-xs font-bold bg-white border border-gray-200 rounded-full text-gray-500">
                          {data.applicants.length} Applicants
                        </span>
                        {hasApproved && (
                          <span className="px-3 py-1 text-xs font-bold bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> 채팅 가능
                          </span>
                        )}
                        {isPostExpired(data) && onDeleteReceived && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("이 신청을 삭제하시겠습니까?")) {
                                  onDeleteReceived(String(data.id));
                                }
                              }}
                              title="신청 삭제"
                              style={{
                                padding: "6px",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "#9ca3af",
                                transition: "color 0.15s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Applicants List inside the post */}
                    <div className="flex flex-col gap-3">
                      {data.applicants.map((app: any) => {
                        const status = getApplicantStatus(app.id);
                        return (
                          <div 
                            key={app.id}
                            onClick={() => setSelectedApplicant({ 
                              id: String(app.id),
                              postId: app.matePostId,
                              applicantId: app.applicantId,
                              postDestination: app.postDestination,
                              applicant: {
                                name: app.applicantName,
                                email: app.applicantEmail,
                                profileImage: app.profileImage,
                                avatarEmoji: app.avatar,
                                age: app.age,
                                gender: app.gender,
                                message: app.content,
                                travelStyles: app.travelStyles ?? [],
                                appliedDate: "",
                              }
                            })}
                            className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group/item"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 text-2xl flex items-center justify-center bg-gray-50 rounded-lg group-hover/item:bg-indigo-50 transition-colors">
                                <AvatarDisplay profileImage={app.profileImage} avatarEmoji={app.avatar} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900">{app.applicantName}</span>
                                  {status !== "pending" && (
                                    <div className="flex gap-1.5 items-center">
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                                        status === "approved" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                                      }`}>
                                        {status}
                                      </span>
                                      {status === "approved" && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-indigo-100 text-indigo-600 flex items-center gap-1">
                                          <span className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
                                          채팅가능
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 font-mono leading-none mt-1">{app.applicantEmail}</p>
                              </div>
                            </div>
                            
                            {/* 대기 중(pending)일 때만 액션 버튼 노출 */}
                            {status === "pending" && (
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={(e) => onReject(app.id, e)}
                                  className="p-2 rounded-lg border border-gray-200 text-gray-400 bg-white hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={(e) => onApprove(String(app.id), app.matePostId, app.applicantId, e)}
                                  className="p-2 rounded-lg border border-gray-200 text-gray-400 bg-white hover:bg-green-50 hover:text-green-500 hover:border-green-200 transition-all"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                              </div>
                            )}
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