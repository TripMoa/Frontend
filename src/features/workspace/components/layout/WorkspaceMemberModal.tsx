// src/features/workspace/components/layout/WorkspaceMemberModal.tsx

import React, { useEffect, useState } from "react";
import {
  addTripMember,
  getTripMembers,
  removeTripMember,
  updateTripMemberNickname,
} from "../../../../api/trip.api";
import { checkEmail } from "../../../../api/auth.api";
import { apiMessage } from "../../hooks/apiError";
import type { TripMemberResponse } from "../../../../types/trip.types";
import { useAuth } from "../../../user/pages/AuthContext";

import WsConfirm from "./WsConfirm";
import WorkspaceInviteBox from "./WorkspaceInviteBox";

interface WorkspaceMemberModalProps {
  tripId: number;
  ownerUserId: number;
  onClose: () => void;
}

const WorkspaceMemberModal: React.FC<WorkspaceMemberModalProps> = ({
  tripId,
  ownerUserId,
  onClose,
}) => {
  const { userId: currentUserId } = useAuth();

  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [nicknameValue, setNicknameValue] = useState("");

  const [members, setMembers] = useState<TripMemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [removeTargetMember, setRemoveTargetMember] =
    useState<TripMemberResponse | null>(null);

  const [noticeModal, setNoticeModal] = useState({
    open: false,
    title: "",
    headline: "",
    description: "",
  });

  const showNotice = (title: string, headline: string, description: string) => {
    setNoticeModal({ open: true, title, headline, description });
  };

  const closeNotice = () => {
    setNoticeModal((prev) => ({ ...prev, open: false }));
  };

  const isCurrentUserOwner = currentUserId === ownerUserId;

  // 소유자: 이메일로 가입자를 찾아 멤버로 추가
  const [addEmail, setAddEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleAddMember = async () => {
    const email = addEmail.trim().toLowerCase();
    if (!email || isAdding) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddMessage({ text: "이메일 형식이 올바르지 않습니다.", ok: false });
      return;
    }

    setIsAdding(true);
    setAddMessage(null);

    try {
      const { data: found } = await checkEmail({ email });

      if (!found.exists || found.userId == null) {
        setAddMessage({ text: "가입되지 않은 이메일입니다.", ok: false });
        return;
      }

      if (members.some((m) => m.userId === found.userId)) {
        setAddMessage({ text: "이미 이 여행의 멤버입니다.", ok: false });
        return;
      }

      await addTripMember(tripId, found.userId);
      setAddEmail("");
      setAddMessage({ text: `${found.name ?? email}님을 멤버로 추가했어요.`, ok: true });
      await fetchMembers();
    } catch (e) {
      setAddMessage({ text: apiMessage(e, "멤버를 추가하지 못했어요."), ok: false });
    } finally {
      setIsAdding(false);
    }
  };

  const fetchMembers = async () => {
    if (!tripId) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getTripMembers(tripId);
      setMembers(response.data);
    } catch (error) {
      console.error("여행 멤버 조회 실패:", error);
      setErrorMessage("멤버 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchMembers();
  }, [tripId]);

  const isOwner = (member: TripMemberResponse) => {
    return member.userId === ownerUserId;
  };

  const isMe = (member: TripMemberResponse) => {
    return member.userId === currentUserId;
  };

  const isInactiveMember = (member: TripMemberResponse) => {
    return member.userId === null || member.nickname === "알수 없음";
  };

  const startEditNickname = (member: TripMemberResponse) => {
    setErrorMessage(null);
    setEditingMemberId(member.memberId);
    setNicknameValue(member.nickname);
  };

  const handleUpdateNickname = async (member: TripMemberResponse) => {
    const trimmedNickname = nicknameValue.trim();

    if (!trimmedNickname) {
      setErrorMessage("닉네임을 입력해주세요.");
      return;
    }

    if (trimmedNickname === member.nickname) {
      setEditingMemberId(null);
      setNicknameValue("");
      return;
    }

    try {
      await updateTripMemberNickname(tripId, member.memberId, {
        nickname: trimmedNickname,
      });

      setEditingMemberId(null);
      setNicknameValue("");
      await fetchMembers();
    } catch (error) {
      console.error("닉네임 변경 실패:", error);
      setErrorMessage("닉네임 변경에 실패했습니다.");
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTargetMember) return;

    try {
      await removeTripMember(tripId, removeTargetMember.memberId);
      setRemoveTargetMember(null);
      await fetchMembers();
    } catch (error) {
      console.error("멤버 내보내기 실패:", error);

      setRemoveTargetMember(null);

      const message = apiMessage(error, "지출 또는 입금 내역이 있어 멤버를 내보낼 수 없습니다.");

      showNotice("내보내기 불가", "멤버를 내보낼 수 없습니다", message);
    }
  };

  return (
    <>
      <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div
          className="tm-modal tm-modal--narrow"
          role="dialog"
          aria-modal="true"
          aria-label={isCurrentUserOwner ? "멤버 관리" : "멤버 보기"}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tm-modal__head">
            <h3 className="tm-modal__title">{isCurrentUserOwner ? "멤버 관리" : "멤버 보기"}</h3>
            <button type="button" className="tm-btn tm-btn--sm" onClick={onClose}>닫기</button>
          </div>

          <div className="tm-modal__body">
            {isCurrentUserOwner && (
              <>
                <div className="tm-input-group">
                  <input
                    className="tm-input tm-grow"
                    type="email"
                    aria-label="친구 이메일"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleAddMember();
                    }}
                    placeholder="추가할 친구의 가입 이메일"
                    disabled={isAdding}
                  />
                  <button
                    type="button"
                    className="tm-btn tm-btn--sm tm-btn--primary"
                    onClick={() => void handleAddMember()}
                    disabled={isAdding || !addEmail.trim()}
                  >
                    {isAdding ? "확인 중..." : "멤버 추가"}
                  </button>
                </div>
                {addMessage && (
                  <p
                    className="tm-hint ws-mem__msg"
                    role="status"
                    style={{ color: addMessage.ok ? "var(--tm-ok)" : "var(--tm-red-strong)" }}
                  >
                    {addMessage.text}
                  </p>
                )}
              </>
            )}

            {isLoading && <p className="tm-hint tm-mt-3">멤버 목록을 불러오는 중이에요.</p>}

            {errorMessage && (
              <p className="tm-hint ws-mem__msg" role="alert" style={{ color: "var(--tm-red-strong)" }}>
                {errorMessage}
              </p>
            )}

            {!isLoading && !errorMessage && members.length === 0 && (
              <p className="tm-empty">등록된 멤버가 없어요.</p>
            )}

            {!isLoading && members.length > 0 && (
              <ul className="tm-list tm-mt-3">
                {members.map((member, idx) => {
                  const owner = isOwner(member);
                  const editing = editingMemberId === member.memberId;
                  const inactive = isInactiveMember(member);
                  return (
                    <li
                      key={member.memberId}
                      className={`tm-list__item ws-mem__item${inactive ? " is-off" : ""}`}
                    >
                      <span className={`tm-avatar${owner || idx === 0 ? " tm-avatar--dark" : ""}`}>
                        {member.profileImage ? (
                          <img src={member.profileImage} alt="" />
                        ) : (
                          member.nickname.slice(0, 1)
                        )}
                      </span>
                      <div className="tm-list__main">
                        <div className="tm-list__title">
                          {member.nickname}
                          {isMe(member) && <span className="ws-mem__me"> (나)</span>}
                        </div>
                        <div className="tm-list__sub">
                          {owner ? "여행 소유주" : inactive ? "탈퇴 또는 제재 멤버" : "여행 멤버"}
                        </div>
                      </div>

                      {isMe(member) && !inactive && !editing && (
                        <button
                          type="button"
                          className="tm-btn tm-btn--link tm-btn--sm ws-ulink"
                          onClick={() => startEditNickname(member)}
                        >
                          닉네임 수정
                        </button>
                      )}
                      {isCurrentUserOwner && !owner && !editing && (
                        <button
                          type="button"
                          className="tm-btn tm-btn--link tm-btn--sm ws-ulink ws-ulink--danger"
                          onClick={() => setRemoveTargetMember(member)}
                        >
                          내보내기
                        </button>
                      )}

                      {editing && (
                        <div className="ws-mem__edit">
                          <input
                            className="tm-input tm-grow"
                            aria-label="닉네임"
                            value={nicknameValue}
                            maxLength={20}
                            onChange={(e) => setNicknameValue(e.target.value)}
                            placeholder="닉네임 입력"
                          />
                          <button
                            type="button"
                            className="tm-btn tm-btn--sm tm-btn--primary"
                            onClick={() => void handleUpdateNickname(member)}
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            className="tm-btn tm-btn--sm"
                            onClick={() => {
                              setEditingMemberId(null);
                              setNicknameValue("");
                              setErrorMessage(null);
                            }}
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="tm-subsec">
              <h4>친구 초대</h4>
              <WorkspaceInviteBox />
            </div>
          </div>

          <div className="tm-modal__foot">
            <button type="button" className="tm-btn" onClick={onClose}>닫기</button>
          </div>
        </div>
      </div>

      <WsConfirm
        open={!!removeTargetMember}
        title="멤버 내보내기"
        headline="멤버를 내보내시겠습니까?"
        description={
          removeTargetMember ? `${removeTargetMember.nickname}님을 이 여행에서 내보냅니다.` : ""
        }
        confirmText="내보내기"
        danger
        onClose={() => setRemoveTargetMember(null)}
        onConfirm={() => void handleRemoveMember()}
      />

      <WsConfirm
        open={noticeModal.open}
        title={noticeModal.title}
        headline={noticeModal.headline}
        description={noticeModal.description}
        confirmText="확인"
        hideCancel
        onClose={closeNotice}
        onConfirm={closeNotice}
      />
    </>
  );
};

export default WorkspaceMemberModal;
