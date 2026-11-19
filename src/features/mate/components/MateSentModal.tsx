import type { MyApplication } from "../hooks/mate.types";
import { isPostExpired } from "../hooks/mate.util";

interface MateSentModalProps {
  applications: MyApplication[];
  getApplicantStatus: (id: string) => "approved" | "rejected" | "pending";
  onClose: () => void;
  onDeleteSent?: (applyId: string) => void;
}

const STATUS_VIEW = {
  approved: { label: "승인됨", tag: "mate-tag--ok" },
  rejected: { label: "거절됨", tag: "mate-tag--danger" },
  pending: { label: "대기중", tag: "mate-tag--warn" },
} as const;

const normalize = (s: string | undefined) => {
  const v = String(s ?? "pending").toLowerCase();
  return (v === "approved" || v === "rejected" ? v : "pending") as keyof typeof STATUS_VIEW;
};

export function MateSentModal({
  applications,
  getApplicantStatus,
  onClose,
  onDeleteSent,
}: MateSentModalProps){
  return (
    <div className="tm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="tm-modal mate-dlg"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mate-sent-title"
      >
        <div className="tm-modal__head">
          <h3 className="tm-modal__title" id="mate-sent-title">MY SENT · 내가 보낸 신청</h3>
          <button type="button" className="mate-bt mate-bt--sm" onClick={onClose}>닫기</button>
        </div>

        <div className="tm-modal__body">
          {applications.length === 0 ? (
            <div className="mate-empty">
              <span className="mate-empty__icon" aria-hidden="true">📨</span>
              <b>아직 보낸 신청이 없어요</b>
              마음에 드는 동행 글에서 신청해 보세요
            </div>
          ) : (
            <ul className="mate-list">
              {applications.map((app) => {
                const status = normalize(app.status ?? getApplicantStatus(app.id));
                const view = STATUS_VIEW[status];

                return (
                  <li key={app.id} className="mate-li mate-li--col">
                    <div className="mate-li__row">
                      <span className="mate-li__title mate-li__title--lg">{app.postDestination}</span>
                      <span className={`mate-tag ${view.tag}`}>{view.label}</span>
                      <span className="mate-grow" />
                      <span className="mate-li__hint">HOST: {app.postAuthorName}</span>
                      {isPostExpired(app) && onDeleteSent && (
                        <button
                          type="button"
                          className="mate-x mate-x--neg"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("이 신청을 삭제하시겠습니까?")) {
                              onDeleteSent(String(app.id));
                            }
                          }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <div className="mate-li__hint">{app.startDate} – {app.endDate}</div>

                    <p className="mate-quote">“{app.content || "보낸 메시지가 없습니다."}”</p>

                    {status === "approved" && (
                      <div className="mate-ok">
                        💬 채팅에 참여할 수 있어요 · 왼쪽 아래 채팅 버튼에서 열어요
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="tm-modal__foot">
          <button type="button" className="mate-bt" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
