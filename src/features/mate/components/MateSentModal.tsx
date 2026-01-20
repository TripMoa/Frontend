import { Send } from "lucide-react";
import "../styles/MateModals.css";
import type { MyApplication } from "../hooks/mate.types";

interface MateSentModalProps {
  applications: MyApplication[];
  getApplicantStatus: (id: string) => "approved" | "rejected" | "pending";
  onClose: () => void;
}

export function MateSentModal({ 
  applications, 
  getApplicantStatus, 
  onClose,
}: MateSentModalProps){
  return (
    <div className="modal-overlay active" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-window sent-window" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; MY SENT APPLICATIONS</span>
          <button className="mh-close" onClick={onClose}>CLOSE [X]</button>
        </div>

        <div className="modal-body" style={{ background: "white", padding: "32px", paddingTop:"5px" }}>
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
                  <div key={app.id} className={`card ${status === "approved" ? "cardApproved" : status === "rejected" ? "cardRejected" : ""}`}>
                    <div className="bg-white p-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="text-lg font-bold text-black">{app.postDestination}</div>
                          <div className="text-sm text-black/60 font-mono">{app.postDates.start} ~ {app.postDates.end}</div>
                          <div className="text-xs text-black/40 mt-1">by {app.postAuthor.name}</div>
                        </div>
                        <span className={`px-3 py-1 text-sm font-bold ${status === "approved" ? "bgGreen" : status === "rejected" ? "bgRed" : "bgBlack"}`}>
                          {status === "approved" ? "APPROVED" : status === "rejected" ? "REJECTED" : "PENDING"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="p-3 text-sm mb-3 infoBox">{app.applicant.message || "메시지 없음"}</div>
                      <div className="flex items-center justify-between text-xs text-black/60 flex-wrap gap-2">
                        <span>신청일: {app.applicant.appliedDate}</span>
                        <span>예산: {app.applicant.budget}</span>
                      </div>
                      
                      {status === "approved" && (
                        <div className="mt-3 px-4 py-2 bg-purple-50 border-2 border-purple-300 rounded-lg text-center">
                          <span className="text-purple-700 text-sm font-bold">
                            💬 채팅에 참여할 수 있습니다.
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