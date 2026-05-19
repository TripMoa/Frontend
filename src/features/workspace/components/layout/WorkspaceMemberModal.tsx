// src/features/workspace/components/layout/WorkspaceMemberModal.tsx

import React, { useEffect, useState } from "react";
import BaseModal from "../../../../shared/components/BaseModal";
import "../../styles/modals.css";
import {
  getTripMembers,
  removeTripMember,
  updateTripMemberNickname,
} from "../../../../api/trip.api";
import type { TripMemberResponse } from "../../../../types/trip.types";
import { useAuth } from "../../../user/pages/AuthContext";

import { ActionPromptModal } from "../../../../shared/components/ActionPromptModal";

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
    } catch (error: any) {
      console.error("멤버 내보내기 실패:", error);

      setRemoveTargetMember(null);

      const message =
        error?.response?.data?.message ||
        "지출 또는 입금 내역이 있어 멤버를 내보낼 수 없습니다.";

      showNotice("내보내기 불가", "멤버를 내보낼 수 없습니다", message);
    }
  };

  return (
    <BaseModal
      open={true}
      title="MEMBER MANAGEMENT"
      onClose={onClose}
      className="member-window"
      bodyClassName="member-modal-body"
    >
      {isLoading && (
        <p className="member-guide">멤버 목록을 불러오는 중입니다.</p>
      )}

      {errorMessage && <p className="modal-error">⚠ {errorMessage}</p>}

      {!isLoading && !errorMessage && members.length === 0 && (
        <p className="member-guide">등록된 멤버가 없습니다.</p>
      )}

      {!isLoading && !errorMessage && members.length > 0 && (
        <>
          <div className="member-list">
            {members.map((member) => (
              <div
                key={member.memberId}
                className={`member-item ${
                  isInactiveMember(member) ? "inactive" : ""
                } ${editingMemberId === member.memberId ? "editing" : ""}`}
              >
                <div className="member-info">
                  <div className="member-name-row">
                    <span className="member-name">{member.nickname}</span>

                    {isOwner(member) && (
                      <span className="owner-badge">
                        <i className="fa-solid fa-crown"></i>
                      </span>
                    )}

                    {isMe(member) && !isOwner(member) && (
                      <span className="me-badge">ME</span>
                    )}
                  </div>

                  <span className="member-sub">
                    {isOwner(member)
                      ? "여행 소유주"
                      : isInactiveMember(member)
                        ? "탈퇴 또는 제재 멤버"
                        : "여행 멤버"}
                  </span>

                  {editingMemberId === member.memberId && (
                    <div className="member-edit-box">
                      <input
                        className="member-nickname-input"
                        value={nicknameValue}
                        maxLength={20}
                        onChange={(e) => setNicknameValue(e.target.value)}
                        placeholder="닉네임 입력"
                      />

                      <div className="member-edit-actions">
                        <button
                          type="button"
                          className="member-action-btn"
                          onClick={() => void handleUpdateNickname(member)}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          className="member-action-btn"
                          onClick={() => {
                            setEditingMemberId(null);
                            setNicknameValue("");
                            setErrorMessage(null);
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="member-actions">
                  {isMe(member) &&
                    !isInactiveMember(member) &&
                    editingMemberId !== member.memberId && (
                      <button
                        type="button"
                        className="member-action-btn"
                        onClick={() => startEditNickname(member)}
                      >
                        닉네임 수정
                      </button>
                    )}

                  {isCurrentUserOwner &&
                    !isOwner(member) &&
                    editingMemberId !== member.memberId && (
                      <button
                        type="button"
                        className="member-action-btn danger"
                        onClick={() => setRemoveTargetMember(member)}
                      >
                        내보내기
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <ActionPromptModal
        open={!!removeTargetMember}
        title="REMOVE MEMBER"
        headline="멤버를 내보내시겠습니까?"
        description={
          removeTargetMember
            ? `${removeTargetMember.nickname}님을 이 여행에서 내보냅니다.`
            : ""
        }
        cancelText="취소"
        confirmText="내보내기"
        onClose={() => setRemoveTargetMember(null)}
        onConfirm={() => void handleRemoveMember()}
      />

      <ActionPromptModal
        open={noticeModal.open}
        title={noticeModal.title}
        headline={noticeModal.headline}
        description={noticeModal.description}
        confirmText="확인"
        hideCancel
        onClose={closeNotice}
        onConfirm={closeNotice}
      />
    </BaseModal>
  );
};

export default WorkspaceMemberModal;
