// src/features/myTrips/components/TripCreateModal.tsx

import React, { useEffect, useMemo, useState } from "react";
import { checkEmail } from "../../../api/auth.api";
import { MAX_TRIP_MEMBERS } from "../../../shared/config/tripLimits";
import type { UserResponse } from "../../../types";
import type {
  SelectedMember,
  TripCreateFormState,
} from "./../hooks/useMyTrips";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: TripCreateFormState;
  setFormData: React.Dispatch<React.SetStateAction<TripCreateFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  currentUser: UserResponse | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TripCreateModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  currentUser,
}: ModalProps) => {
  const [agentInput, setAgentInput] = useState("");
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [isCheckingAgent, setIsCheckingAgent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAgentInput("");
      setAgentMessage(null);
      setIsCheckingAgent(false);
    }
  }, [isOpen]);

  const selectedMemberIds = useMemo(
    () => new Set(formData.selectedMembers.map((member) => member.userId)),
    [formData.selectedMembers],
  );

  // 본인(소유자)은 자동 포함이라 인원에 1을 더해서 센다
  const memberCount = formData.selectedMembers.length + 1;
  const isMemberLimitReached = memberCount >= MAX_TRIP_MEMBERS;

  const showTempMessage = (message: string) => {
    setAgentMessage(message);
    window.setTimeout(() => {
      setAgentMessage((current) => (current === message ? null : current));
    }, 2000);
  };

  const addAgent = async () => {
    const email = agentInput.trim().toLowerCase();

    if (!email) return;

    if (!EMAIL_REGEX.test(email)) {
      showTempMessage("이메일 형식이 올바르지 않습니다.");
      return;
    }

    if (currentUser?.email && email === currentUser.email.toLowerCase()) {
      showTempMessage("본인은 자동 포함됩니다.");
      return;
    }

    if (isMemberLimitReached) {
      showTempMessage(`여행은 본인을 포함해 최대 ${MAX_TRIP_MEMBERS}명까지 함께할 수 있어요.`);
      return;
    }

    setIsCheckingAgent(true);
    setAgentMessage(null);

    try {
      const response = await checkEmail({ email });
      const { exists, userId, email: foundEmail, name } = response.data;

      if (!exists || userId === null || !foundEmail) {
        showTempMessage("가입되지 않은 멤버입니다.");
        return;
      }

      if (selectedMemberIds.has(userId)) {
        showTempMessage("이미 추가된 멤버입니다.");
        return;
      }

      const nextMember: SelectedMember = {
        userId,
        email: foundEmail,
        name,
      };

      setFormData((prev) => ({
        ...prev,
        selectedMembers: [...prev.selectedMembers, nextMember],
      }));
      setAgentInput("");
    } catch (error) {
      console.error("멤버 이메일 확인 실패:", error);
      showTempMessage("가입되지 않은 멤버입니다.");
    } finally {
      setIsCheckingAgent(false);
    }
  };

  const removeAgent = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedMembers: prev.selectedMembers.filter(
        (member) => member.userId !== userId,
      ),
    }));
  };

  const isDateRangeValid =
    !formData.tripStartDate ||
    !formData.tripEndDate ||
    formData.tripEndDate >= formData.tripStartDate;

  const handleStartDateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tripStartDate: value,
    }));
  };

  const handleEndDateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tripEndDate: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form
        className="tm-modal tm-modal--narrow"
        role="dialog"
        aria-modal="true"
        aria-label="새 여행 만들기"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="tm-modal__head">
          <h3 className="tm-modal__title">새 여행 만들기</h3>
          <button type="button" className="tm-btn tm-btn--sm" onClick={onClose}>닫기</button>
        </div>

        <div className="tm-modal__body">
          <div className="tm-field">
            <label className="tm-label" htmlFor="mt-title">여행 제목</label>
            <input
              id="mt-title"
              type="text"
              className="tm-input"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="여행 제목을 입력하세요"
              required
            />
          </div>

          <div className="tm-form-grid">
            <div className="tm-field">
              <label className="tm-label" htmlFor="mt-start">출발 날짜</label>
              <input
                id="mt-start"
                type="date"
                className="tm-input"
                value={formData.tripStartDate}
                min="1900-01-01"
                max="9999-12-31"
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
              />
            </div>
            <div className="tm-field">
              <label className="tm-label" htmlFor="mt-end">복귀 날짜</label>
              <input
                id="mt-end"
                type="date"
                className={`tm-input${isDateRangeValid ? "" : " tm-input--error"}`}
                value={formData.tripEndDate}
                min={formData.tripStartDate || "1900-01-01"}
                max="9999-12-31"
                onChange={(e) => handleEndDateChange(e.target.value)}
                required
              />
            </div>
          </div>
          {!isDateRangeValid && (
            <p className="tm-field__error" role="alert">복귀 날짜는 출발 날짜 이후여야 합니다.</p>
          )}

          <div className="tm-field">
            <label className="tm-label" htmlFor="mt-member">
              멤버 <span className="tm-hint">(본인 포함 {memberCount}/{MAX_TRIP_MEMBERS}명)</span>
            </label>
            <div className="tm-input-group">
              <input
                id="mt-member"
                type="email"
                className="tm-input"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addAgent();
                  }
                }}
                placeholder="친구 이메일 입력"
              />
              <button
                type="button"
                className="tm-btn tm-btn--sm"
                onClick={() => void addAgent()}
                disabled={isCheckingAgent || isMemberLimitReached}
                title={isMemberLimitReached ? `최대 ${MAX_TRIP_MEMBERS}명까지예요` : undefined}
              >
                {isCheckingAgent ? "확인 중" : "추가"}
              </button>
            </div>
            <p className="tm-field__hint">본인은 자동 포함됩니다.</p>
            {agentMessage && <p className="tm-field__error" role="alert">{agentMessage}</p>}

            {formData.selectedMembers.length > 0 && (
              <div className="tm-row tm-row--wrap tm-gap-2 tm-mt-2">
                {formData.selectedMembers.map((member) => (
                  <span key={member.userId} className="tm-tag tm-tag--x">
                    {member.name ?? member.email}
                    <button type="button" aria-label="멤버 빼기" onClick={() => removeAgent(member.userId)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="tm-modal__foot">
          <button type="button" className="tm-btn" onClick={onClose}>취소</button>
          <button type="submit" className="tm-btn tm-btn--primary" disabled={isSubmitting || !isDateRangeValid}>
            {isSubmitting ? "만드는 중..." : "여행 만들기"}
          </button>
        </div>
      </form>
    </div>
  );
};
