import { useState } from "react";
import type { ApplicationResponse, SelectedApplicant } from "../hooks/mate.types";
import { isPostExpired } from "../hooks/mate.util.ts";
import { getApplicantAvatar } from "../../../shared/hooks/avatar.ts";
import { AvatarDisplay } from "../../../shared/components/AvatarDisplay.tsx";

interface ReceivedModalProps {
  applications: ApplicationResponse[];
  getApplicantStatus: (id: string) => "approved" | "rejected" | "pending";
  onApprove: (id: string, postId: number, applicantId: number, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onReject: (id: string, e?: React.MouseEvent<HTMLButtonElement>) => void;
  onClose: () => void;
  onDeleteReceived?: (applyId: string) => void;
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

  if (selectedApplicant) {
    const status = (
      applications.find(a => String(a.id) === String(selectedApplicant.id))?.status?.toLowerCase()
      ?? "pending"
    ) as "approved" | "rejected" | "pending";

    return (
      <div className="tm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div
          className="tm-modal tm-modal--narrow mate-dlg"
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mate-applicant-title"
        >
          <div className="tm-modal__head">
            <button type="button" className="mate-bt mate-bt--ghost mate-bt--sm" onClick={() => setSelectedApplicant(null)}>‹ 목록</button>
            <h3 className="tm-modal__title" id="mate-applicant-title">신청자</h3>
            <button type="button" className="mate-bt mate-bt--sm" onClick={onClose}>닫기</button>
          </div>

          <div className="tm-modal__body">
            <div className="mate-applicant">
              <span className="mate-lb">신청한 여행</span>
              <p className="mate-applicant__dest">{selectedApplicant.postDestination}</p>

              <span className="mate-av mate-av--xl" aria-hidden="true">
                <AvatarDisplay
                  avatar={
                    getApplicantAvatar(
                      selectedApplicant.applicant.profileImage,
                      selectedApplicant.applicant.avatarEmoji
                  )}
                />
              </span>
              <p className="mate-applicant__name">{selectedApplicant.applicant.name}</p>
              <span className="mate-rowi__sub">{selectedApplicant.applicant.email}</span>
              <div className="mate-chip-row">
                <span className="mate-tag">{selectedApplicant.applicant.age}세</span>
                <span className="mate-tag">{selectedApplicant.applicant.gender}</span>
              </div>
            </div>

            {selectedApplicant.applicant.travelStyles?.length > 0 && (
              <>
                <span className="mate-lb">여행 스타일</span>
                <div className="mate-chip-row">
                  {selectedApplicant.applicant.travelStyles.map((s) => (
                    <span key={s} className="mate-tag mate-tag--m">#{s}</span>
                  ))}
                </div>
              </>
            )}

            <span className="mate-lb">신청 메시지</span>
            <p className="mate-quote">“{selectedApplicant.applicant.message}”</p>

            {status === "approved" && <div className="mate-ok">승인한 신청이에요.</div>}
            {status === "rejected" && <div className="mate-error">거절한 신청이에요.</div>}
          </div>

          {status === "pending" && (
            <div className="tm-modal__foot">
              <button
                type="button"
                className="mate-bt mate-bt--neg"
                onClick={() => onReject(selectedApplicant.id)}
              >
                거절
              </button>
              <button
                type="button"
                className="mate-bt mate-bt--r"
                onClick={() => onApprove(selectedApplicant.id, selectedApplicant.postId, selectedApplicant.applicantId)}
              >
                승인
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const openApplicant = (app: ApplicationResponse) => setSelectedApplicant({
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
  });

  return (
    <div className="tm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="tm-modal mate-dlg"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mate-received-title"
      >
        <div className="tm-modal__head">
          <h3 className="tm-modal__title" id="mate-received-title">RECEIVED · 받은 신청</h3>
          <button type="button" className="mate-bt mate-bt--sm" onClick={onClose}>닫기</button>
        </div>

        <div className="tm-modal__body">
          {applications.length === 0 ? (
            <div className="mate-empty">
              <span className="mate-empty__icon" aria-hidden="true">📬</span>
              <b>아직 받은 신청이 없어요</b>
              글을 올리면 여기서 신청을 확인할 수 있어요
            </div>
          ) : (
            <ul className="mate-list">
              {applications.map((app) => {
                const status = String(app.status ?? getApplicantStatus(String(app.id)) ?? "pending").toLowerCase();
                return (
                  <li
                    key={app.id}
                    className="mate-li mate-li--click"
                    role="button"
                    tabIndex={0}
                    onClick={() => openApplicant(app)}
                    onKeyDown={(e) => { if (e.target === e.currentTarget && e.key === "Enter") openApplicant(app); }}
                  >
                    <span className="mate-av mate-av--lg" aria-hidden="true">
                      <AvatarDisplay avatar={getApplicantAvatar(app.profileImage, app.avatar)} />
                    </span>
                    <div className="mate-li__main">
                      <div className="mate-li__title">
                        {app.applicantName}
                        <span className="mate-li__hint">→ {app.postDestination}</span>
                        {status === "approved" && <span className="mate-tag mate-tag--ok">채팅 가능</span>}
                        {status === "rejected" && <span className="mate-tag mate-tag--danger">거절함</span>}
                      </div>
                      <div className="mate-li__sub">“{app.content || "메시지 없음"}”</div>
                    </div>

                    <div className="mate-btns" onClick={(e) => e.stopPropagation()}>
                      {status === "pending" && (
                        <>
                          <button
                            type="button"
                            className="mate-bt mate-bt--sm mate-bt--r"
                            onClick={(e) => onApprove(String(app.id), app.matePostId, app.applicantId, e)}
                          >
                            승인
                          </button>
                          <button
                            type="button"
                            className="mate-bt mate-bt--sm mate-bt--neg"
                            onClick={(e) => onReject(String(app.id), e)}
                          >
                            거절
                          </button>
                        </>
                      )}
                      {isPostExpired(app) && onDeleteReceived && (
                        <button
                          type="button"
                          className="mate-x mate-x--neg"
                          onClick={() => {
                            if (window.confirm("이 신청을 삭제하시겠습니까?")) {
                              onDeleteReceived(String(app.id));
                            }
                          }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
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

import "../styles/legacy-modal-shared.css";
