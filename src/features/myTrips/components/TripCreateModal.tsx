// src/features/myTrips/components/TripCreateModal.tsx

import React, { useEffect, useMemo, useState } from "react";
import { checkEmail } from "../../../api/auth.api";
import type { UserResponse } from "../../../types/auth.types";
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

  if (!isOpen) return null;

  const showTempMessage = (message: string) => {
    setAgentMessage(message);
    window.setTimeout(() => {
      setAgentMessage((current) => (current === message ? null : current));
    }, 2000);
  };

  const addAgent = async () => {
    const email = agentInput.trim().toLowerCase();

    if (!email) {
      return;
    }

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

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className="modal-content mission-modal"
        style={{ width: 650, maxWidth: 700 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-black">
          <h3 className="modal-title-black">CREATE NEW MISSION</h3>
          <button className="close-btn-black" onClick={onClose}>
            CLOSE [X]
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-body-neob">
          <div className="input-group">
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

          <div className="date-row">
            <div className="input-group">
              <label>START DATE</label>
              <input
                type="date"
                value={formData.tripStartDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tripStartDate: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="input-group">
              <label>END DATE</label>
              <input
                type="date"
                value={formData.tripEndDate}
                min={formData.tripStartDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tripEndDate: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>AGENTS</label>
            <div className="agent-input-row">
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
                className="add-text-btn"
                disabled={isCheckingAgent}
              >
                {isCheckingAgent ? "CHECKING..." : "ADD"}
              </button>
            </div>
            {agentMessage && (
              <p className="invite-error-text">⚠ {agentMessage}</p>
            )}
            <div className="agent-tag-list">
              {formData.selectedMembers.map((member) => (
                <span key={member.userId} className="agent-tag">
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
            className="submit-btn-black"
            disabled={isSubmitting}
          >
            {isSubmitting ? "SAVING..." : "SAVE MISSION"}
          </button>
        </form>
      </div>
    </div>
  );
};
