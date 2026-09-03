// src/features/myTrips/components/TripCreateModal.tsx

import React, { useEffect, useMemo, useState } from "react";
import { checkEmail } from "../../../api/auth.api";
import BaseModal from "../../../shared/components/BaseModal";
import "../styles/TripCreateModal.css";
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

  return (
    <BaseModal
      open={isOpen}
      onClose={onClose}
      title="CREATE NEW MISSION"
      className="tcm-modal"
      bodyClassName="tcm-body"
    >
      <form onSubmit={onSubmit} className="tcm-form">
        <div className="tcm-field">
          <label>MISSION TITLE</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="작전명을 입력하세요"
            required
          />
        </div>

        <div className="tcm-date-row">
          <div className="tcm-field">
            <label>START DATE</label>
            <input
              type="date"
              value={formData.tripStartDate}
              min="1900-01-01"
              max="9999-12-31"
              onChange={(e) => handleStartDateChange(e.target.value)}
              required
            />
          </div>

          <div className="tcm-field">
            <label>END DATE</label>
            <input
              type="date"
              value={formData.tripEndDate}
              min={formData.tripStartDate || "1900-01-01"}
              max="9999-12-31"
              onChange={(e) => handleEndDateChange(e.target.value)}
              required
            />
          </div>

          {!isDateRangeValid && (
            <p className="tcm-error">
              ⚠ 도착 날짜는 출발 날짜 이후여야 합니다.
            </p>
          )}
        </div>

        <div className="tcm-field">
          <label>AGENTS</label>

          <div className="tcm-agent-row">
            <input
              type="email"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addAgent();
                }
              }}
              placeholder="이메일 입력"
            />

            <button
              type="button"
              onClick={() => void addAgent()}
              className="tcm-add-btn"
              disabled={isCheckingAgent}
            >
              {isCheckingAgent ? "CHECKING..." : "ADD"}
            </button>
          </div>

          {agentMessage && <p className="tcm-error">⚠ {agentMessage}</p>}

          <div className="tcm-agent-tags">
            {formData.selectedMembers.map((member) => (
              <span key={member.userId} className="tcm-agent-tag">
                {member.name ?? member.email}
                <button
                  type="button"
                  onClick={() => removeAgent(member.userId)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="tcm-submit"
          disabled={isSubmitting || !isDateRangeValid}
        >
          {isSubmitting ? "SAVING..." : "SAVE MISSION"}
        </button>
      </form>
    </BaseModal>
  );
};
