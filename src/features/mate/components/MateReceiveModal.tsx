import { Send, Check, XCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import "../styles/MateModals.css";
import type { ApplicationResponse, SelectedApplicant } from "../hooks/mate.types";

interface ReceivedModalProps {
  applications: ApplicationResponse[];
  getApplicantStatus: (id: string) => "approved" | "rejected" | "pending";
  onApprove: (id: string, postId: number, applicantId: number, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onReject: (id: string, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onClose: () => void;
}

export function MateReceivedModal({ 
  applications = [], 
  getApplicantStatus, 
  onApprove, 
  onReject,
  onClose,
}: ReceivedModalProps){
  const [selectedApplicant, setSelectedApplicant] = useState<SelectedApplicant | null>(null);

  const safeApplications = applications || [];

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
    const rawStatus = getApplicantStatus(selectedApplicant.id);
    const status = String(rawStatus);
    
    return (
      <div className="modal-overlay active" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-window detail-window" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span className="mh-title">&gt;&gt; APPLICANT DETAIL</span>
            <button className="mh-close" onClick={onClose}>CLOSE [X]</button>
          </div>

          <div className="modal-body" style={{ background: "white", padding: "32px", paddingTop: "0px" }}>
            {/* 뒤로가기 버튼 */}
            <button 
              onClick={() => setSelectedApplicant(null)}
              className="flex items-center gap-2 mb-4 border-2 border-black bg-white hover:bg-[#eee] font-bold text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO LIST
            </button>

            {/* Trip Info */}
            <div className="p-4 mb-6 infoBoxLarge bgBlack">
              <div className="text-xs text-white/50 uppercase font-bold mb-1">Applying for</div>
              <div className="text-2xl font-bold">{selectedApplicant.postDestination}</div>
            </div>

            {/* Applicant Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 text-5xl flex items-center justify-center infoBox bgBlack">
                {selectedApplicant.applicant.avatar}
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-black mb-1">{selectedApplicant.applicant.name}</div>
                <div className="text-sm text-black/60 font-mono mb-2">{selectedApplicant.applicant.email}</div>
                <div className="flex gap-2">
                  <span className="bg-white px-3 py-1 text-xs font-bold infoBox">{selectedApplicant.applicant.age}세</span>
                  <span className="bg-white px-3 py-1 text-xs font-bold infoBox">{selectedApplicant.applicant.gender}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 mb-6">
              <div className="bg-[#f5f5f5] p-4 infoBox">
                <div className="text-xs text-black/50 uppercase font-bold mb-2">Travel Style</div>
                <div className="flex flex-wrap gap-2">
                  {selectedApplicant.applicant.travelStyle?.map((s) => (
                    <span key={s} className="px-2 py-1 text-xs font-bold badge">{s}</span>
                  ))}
                </div>
              </div>
              
              {selectedApplicant.applicant.preferredActivities && selectedApplicant.applicant.preferredActivities.length > 0 && (
                <div className="bg-[#f5f5f5] p-4 infoBox">
                  <div className="text-xs text-black/50 uppercase font-bold mb-2">Preferred Activities</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplicant.applicant.preferredActivities.map((a) => (
                      <span key={a} className="px-2 py-1 text-xs font-bold badge">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedApplicant.applicant.budget && (
                <div className="bg-[#f5f5f5] p-4 infoBox">
                  <div className="text-xs text-black/50 uppercase font-bold mb-2">Budget</div>
                  <div className="font-bold font-mono text-lg">{selectedApplicant.applicant.budget}</div>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="mb-6">
              <div className="text-xs text-black/50 uppercase font-bold mb-2">Message</div>
              <div className="bg-[#eee] p-4 text-sm leading-relaxed infoBoxLarge">{selectedApplicant.applicant.message}</div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              {status === "pending" ? (
                <>
                  <button onClick={() => onReject(selectedApplicant.id)}
                    className="flex-1 py-3 font-bold uppercase transition-colors button bg-white text-black hover:bg-[#eee]">
                    REJECT
                  </button>
                  <button onClick={() => onApprove(selectedApplicant.id, selectedApplicant.postId, selectedApplicant.applicantId)}
                    className="flex-1 py-3 font-bold uppercase transition-colors flex items-center justify-center gap-2 button bgBlack text-white">
                    <Check className="w-4 h-4" /> APPROVE
                  </button>
                </>
              ):(
                <div className={`flex-1 py-4 text-center font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${status === "approved" ? "bgGreen" : "bgRed"}`}>
                  {status.toUpperCase()}
                </div>
              )}
            </div>

            {/* {status === "approved" && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-dashed border-green-500 rounded-lg animate-fade-in">
                <p className="text-sm text-green-700 font-bold text-center mb-3">
                  매칭이 완료되었습니다! 이제 채팅으로 세부 일정을 조율해보세요.
                </p>
                <button 
                  onClick={() => window.location.href = '/chat'} // 채팅 페이지 경로에 맞게 수정
                  className="w-full py-3 bg-[#8B5CF6] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#7C3AED] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                >
                  <Send className="w-4 h-4" />
                  채팅하기
                </button>
              </div>
            )} */}
          </div>
        </div>
      </div>
    );
  }

  // 신청자 목록 보기
  return (
    <div className="modal-overlay active" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-window received-window" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; RECEIVED APPLICATIONS</span>
          <button className="mh-close" onClick={onClose}>CLOSE [X]</button>
        </div>

        <div className="modal-body" style={{ 
          background: "white", 
          padding: "32px", 
         }}>
          {Object.keys(groupedByPost).length === 0 ? (
            <div className="text-center py-12">
              <Send className="w-16 h-16 mx-auto mb-4 text-black/30" />
              <p className="font-bold text-black/60">NO APPLICATIONS</p>
              <p className="text-sm text-black/40 mt-2">// 아직 받은 신청이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedByPost).map(([postId, data]) => {
                const hasApprovedApplicants = data.applicants.some(app => getApplicantStatus(app.id)?.toLowerCase() === "approved");
                
                return (
                  <div key={postId} className="card">
                    <div className="bg-[#eee] p-5">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex-1">
                          <div className="text-lg font-bold text-black">{data.destination}</div>
                          <div className="text-sm text-black/60 font-mono mt-1">{data.startDate} ~ {data.endDate}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 text-sm font-bold badge">{data.applicants.length} applicants</span>
                          
                          {hasApprovedApplicants && (
                            <span className="px-3 py-1 text-xs font-bold bg-purple-200 border-2 border-black">
                              💬 채팅 가능
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      {data.applicants.map((app) => {
                        const status = getApplicantStatus(app.id)?.toLowerCase();
                        return (
                          <div key={app.id}
                            onClick={() => setSelectedApplicant({ 
                              id: String(app.id),
                              postId: app.matePostId,
                              applicantId: app.applicantId,
                              postDestination: app.postDestination,
                              applicant: {
                                name: app.applicantName,
                                email: app.applicantEmail,
                                avatar: app.avatar ?? "👤",
                                age: app.age,
                                gender: app.gender,
                                message: app.content,
                                travelStyles: [],
                                appliedDate: "",
                              }
                            })}
                            className={`border-2 border-black p-5 cursor-pointer transition-colors ${status === "pending" ? "bg-[#eee] hover:bg-[#ddd]" : status === "approved" ? "bg-green-100" : "bg-red-100"}`}>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 text-2xl flex items-center justify-center infoBox bgBlack">
                                  {app.avatar}
                                </div>
                                <div>
                                  <div className="font-bold text-black flex items-center gap-2 flex-wrap">
                                    {app.name}
                                    {status !== "pending" && (
                                      <span className={`text-xs px-2 py-0.5 text-white ${status === "approved" ? "bgGreen" : "bgRed"}`}>
                                        {status === "approved" ? "APPROVED" : "REJECTED"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-black/60 font-mono mt-1">{app.email}</div>
                                  <div className="flex gap-2 mt-2">
                                    <span className="text-xs bg-white px-2 py-0.5 font-bold infoBox">{app.age}세</span>
                                    <span className="text-xs bg-white px-2 py-0.5 font-bold infoBox">{app.gender}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); onApprove(String(app.id), app.matePostId, app.applicantId, e); }}
                                  className={`px-4 py-2 border-2 border-black text-sm font-bold transition-colors ${status === "approved" ? "bgGreen" : "bgBlack"}`}>
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onReject(app.id, e); }}
                                  className={`px-4 py-2 border-2 border-black text-sm font-bold transition-colors ${status === "rejected" ? "bgRed" : "bg-white text-black hover:bg-[#ddd]"}`}>
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-4 text-sm text-black/70 line-clamp-2">{app.message}</p>
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