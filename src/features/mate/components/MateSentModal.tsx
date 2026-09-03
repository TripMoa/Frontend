import { Send, Trash2 } from "lucide-react";
import "../styles/MateModals.css";
import type { MyApplication } from "../hooks/mate.types";
import { isPostExpired } from "../hooks/mate.util";

interface MateSentModalProps {
  applications: MyApplication[];
  getApplicantStatus: (id: string) => "approved" | "rejected" | "pending";
  onClose: () => void;
  onDeleteSent?: (applyId: string) => void;
}

export function MateSentModal({ 
  applications, 
  getApplicantStatus, 
  onClose,
  onDeleteSent,
}: MateSentModalProps){
  return (
    <div className="modal-overlay active" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-window sent-window" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ marginBottom: "0px"}}>
          <span className="mh-title">&gt;&gt; MY SENT APPLICATIONS</span>
          <button className="mh-close" onClick={onClose}>CLOSE [X]</button>
        </div>

        <div className="modal-body" style={{ background: "#f9f9f9", padding: "24px" }}>
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-xl">
              <Send className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">신청 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {applications.map((app) => {
                const status = getApplicantStatus(app.id);
                
                // 상태별 스타일 정의
                const statusStyles = {
                  approved: { label: "승인됨", color: "text-green-600", dot: "bg-green-500" },
                  rejected: { label: "거절됨", color: "text-red-500", dot: "bg-red-500" },
                  pending: { label: "대기중", color: "text-gray-500", dot: "bg-gray-400" }
                }[status];

                return (
                  <div key={app.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden transition-all hover:border-black shadow-sm">
                    {/* 상단 정보 영역 */}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                            {app.postDestination}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {app.startDate} — {app.endDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 ${statusStyles.color}`}>
                            <span className={`w-2 h-2 rounded-full ${statusStyles.dot}`} />
                            <span className="text-xs font-bold uppercase tracking-wider">{statusStyles.label}</span>
                          </div>
                          {isPostExpired(app) && onDeleteSent && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("이 신청을 삭제하시겠습니까?")) {
                                  onDeleteSent(String(app.id));
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

                      {/* 신청 메시지 */}
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 italic border border-gray-100 mb-1">
                        "{app.content || "보낸 메시지가 없습니다."}"
                      </div>
                      
                      <div className="mt-2 text-[11px] text-gray-400 font-mono">
                        HOST: {app.postAuthorName}
                      </div>

                      {/* 승인 시 채팅 안내 */}
                      {status === "approved" && (
                        <button 
                          style={{ 
                            width: "100%", 
                            marginTop: "16px", 
                            padding: "12px", 
                            // 포인트 컬러: 약간 보라색이 섞인 세련된 블루 또는 브랜드 컬러 추천
                            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", 
                            color: "#fff", 
                            border: "none", 
                            borderRadius: "8px", 
                            fontWeight: "bold", 
                            fontSize: "13px",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)", // 은은한 그림자 효과
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                          }}
                          // onClick={() => {/* 채팅 연결 로직 */}}
                        >
                          <span style={{ fontSize: "16px" }}>💬</span>
                          채팅에 참여할 수 있어요
                        </button>
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