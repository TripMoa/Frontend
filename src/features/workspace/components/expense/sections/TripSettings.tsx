// src/features/workspace/components/expense/sections/TripSettings.tsx

import React, { useEffect, useRef, useState } from "react";
import { ActionPromptModal } from "../../../../../shared/components/ActionPromptModal";
import type {
  ExpenseSettings,
  PaymentMode,
  RemainingRule,
  RoundingRule,
} from "../../../hooks/expense.ui.types";

interface TripSettingsProps {
  settings: ExpenseSettings;
  isApplyLoading: boolean;
  isPreviewLoading: boolean;
  isBootstrapLoading: boolean;

  setPaymentMode: (mode: PaymentMode) => void;
  setRoundingRule: (rule: RoundingRule) => void;
  setRemainingRule: (rule: RemainingRule) => void;

  sharedBudgetInput: string;
  setSharedBudgetInput: (val: string) => void;

  memberCount: number;
  isOwner: boolean;

  onPreviewSettings: (fixedBudget?: number) => void;
  onApplySettings: (fixedBudget?: number) => void;
  openAddModal: () => void;

  formatWon: (val: number | string) => string;
  parseWon: (val: string) => number;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const MODE_HINT: Record<PaymentMode, string> = {
  INDIVIDUAL:
    "※ 공동 지출만 예산에서 차감되며, 개인 지출은 정산 영역에서 별도로 계산됩니다. 설정 변경 후에는 '설정 적용' 버튼을 눌러야 반영됩니다.",

  POOL: "※ 모임 통장 금액을 기준으로 입금 현황과 잔액을 관리합니다. 통장 금액을 변경한 뒤에는 '설정 적용' 버튼을 눌러야 반영됩니다.",

  HYBRID:
    "※ 공동 지출은 통장에서 차감하고, 개인 지출은 별도로 정산합니다. 설정 변경 후에는 '설정 적용' 버튼을 눌러야 반영됩니다.",
};

const TripSettings: React.FC<TripSettingsProps> = ({
  settings,
  isApplyLoading,
  isPreviewLoading,
  isBootstrapLoading,
  setPaymentMode,
  setRoundingRule,
  setRemainingRule,
  sharedBudgetInput,
  setSharedBudgetInput,
  memberCount,
  isOwner,
  onPreviewSettings,
  onApplySettings,
  openAddModal,
  formatWon,
  parseWon,
  inputRef,
}) => {
  const previewDisabled =
    !isOwner || isBootstrapLoading || isPreviewLoading || isApplyLoading;

  const applyDisabled =
    !isOwner || isBootstrapLoading || isApplyLoading || isPreviewLoading;

  const [noticePrompt, setNoticePrompt] = useState({
    open: false,
    headline: "",
    description: "",
  });

  const [applyPrompt, setApplyPrompt] = useState<{
    open: boolean;
    fixedBudget?: number;
  }>({
    open: false,
    fixedBudget: undefined,
  });

  const closeNoticePrompt = () => {
    setNoticePrompt((prev) => ({ ...prev, open: false }));
  };

  const closeApplyPrompt = () => {
    setApplyPrompt({
      open: false,
      fixedBudget: undefined,
    });
  };

  const normalizeBudgetByMemberCount = (rawInput: string) => {
    const currentAmount = parseWon(rawInput);

    if (currentAmount <= 0) {
      return {
        fixedAmount: 0,
        adjusted: false,
        difference: 0,
      };
    }

    if (currentAmount % memberCount === 0) {
      return {
        fixedAmount: currentAmount,
        adjusted: false,
        difference: 0,
      };
    }

    const fixedAmount = Math.floor(currentAmount / memberCount) * memberCount;

    return {
      fixedAmount,
      adjusted: true,
      difference: currentAmount - fixedAmount,
    };
  };

  const validateAndFixBudget = (rawInput: string): number => {
    const result = normalizeBudgetByMemberCount(rawInput);

    if (result.adjusted) {
      setNoticePrompt({
        open: true,
        headline: "금액이 자동 조정되었습니다.",
        description:
          `인원 수(${memberCount}명)에 맞춰 균등 분할이 가능하도록 금액을 조정했습니다.\n` +
          `기존: ${formatWon(parseWon(rawInput))}\n` +
          `조정: ${formatWon(result.fixedAmount)} (${formatWon(result.difference)} 차감)`,
      });

      setSharedBudgetInput(formatWon(result.fixedAmount));
    }

    return result.fixedAmount;
  };

  const handlePreviewClick = () => {
    const fixed = validateAndFixBudget(sharedBudgetInput);
    onPreviewSettings(fixed);
  };

  const handleApplyClick = () => {
    const fixed = validateAndFixBudget(sharedBudgetInput);

    setApplyPrompt({
      open: true,
      fixedBudget: fixed,
    });
  };

  const confirmApplySettings = () => {
    onApplySettings(applyPrompt.fixedBudget);
    closeApplyPrompt();
  };

  const appliedSettingsRef = useRef(settings);

  useEffect(() => {
    appliedSettingsRef.current = settings;
  }, [isApplyLoading]);

  const appliedSettings = appliedSettingsRef.current;

  const hasPendingSettingsChange =
    parseWon(sharedBudgetInput) !== appliedSettings.sharedBudget ||
    settings.paymentMode !== appliedSettings.paymentMode ||
    settings.roundingRule !== appliedSettings.roundingRule ||
    settings.remainingRule !== appliedSettings.remainingRule;

  return (
    <>
      <div className="trip-settings">
        <div className="ts-main">
          <div
            className={`ts-left ts-left--${settings.paymentMode.toLowerCase()}`}
          >
            <div className="ts-field">
              <div className="ts-label">정산 방식</div>
              <select
                className="ts-select"
                value={settings.paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                disabled={!isOwner || isApplyLoading || isPreviewLoading}
              >
                <option value="INDIVIDUAL">결제 후 정산</option>
                <option value="POOL">모임 통장</option>
                <option value="HYBRID">통합 버전</option>
              </select>
            </div>

            {(settings.paymentMode === "INDIVIDUAL" ||
              settings.paymentMode === "HYBRID") && (
              <div className="ts-field">
                <div className="ts-label">잔돈 배분 방식</div>
                <select
                  className="ts-select"
                  value={settings.roundingRule}
                  onChange={(e) =>
                    setRoundingRule(e.target.value as RoundingRule)
                  }
                  disabled={!isOwner || isApplyLoading || isPreviewLoading}
                >
                  <option value="PAYER">나머지 금액 결제자에게 할당</option>
                  <option value="SEQUENTIAL">나머지 금액 순서대로 할당</option>
                  <option value="RANDOM">나머지 금액 랜덤으로 할당</option>
                </select>
              </div>
            )}

            {(settings.paymentMode === "POOL" ||
              settings.paymentMode === "HYBRID") && (
              <div className="ts-field">
                <div className="ts-label">잔액 배분 방식</div>
                <select
                  className="ts-select"
                  value={settings.remainingRule}
                  onChange={(e) =>
                    setRemainingRule(e.target.value as RemainingRule)
                  }
                  disabled={!isOwner || isApplyLoading || isPreviewLoading}
                >
                  <option value="AUTO">입금 비율 기준으로 자동 분배</option>
                  <option value="EQUAL">전체 멤버 1/N로 분배</option>
                  <option value="CARRY">다음 여행으로 이월</option>
                </select>
              </div>
            )}

            <div className="ts-field ts-field-budget">
              <div className="ts-label">
                {settings.paymentMode === "POOL" ||
                settings.paymentMode === "HYBRID"
                  ? "통장 금액"
                  : "예산 설정"}
              </div>

              <div className="ts-budget-row">
                <input
                  ref={inputRef}
                  className="ts-input"
                  value={sharedBudgetInput}
                  onChange={(e) =>
                    setSharedBudgetInput(formatWon(parseWon(e.target.value)))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isOwner) {
                      handlePreviewClick();
                    }
                  }}
                  placeholder={
                    settings.paymentMode === "POOL"
                      ? "모임 통장 금액"
                      : "공동 지출 목표"
                  }
                  inputMode="numeric"
                  readOnly={!isOwner}
                  disabled={isApplyLoading || isPreviewLoading}
                />

                {isOwner && (
                  <button
                    type="button"
                    className="ts-btn ghost"
                    onClick={handlePreviewClick}
                    disabled={previewDisabled}
                  >
                    {isPreviewLoading ? "미리보기 중..." : "미리보기"}
                  </button>
                )}
              </div>
            </div>

            <div className="ts-action">
              {isOwner && (
                <button
                  type="button"
                  className="ts-btn primary"
                  onClick={handleApplyClick}
                  disabled={applyDisabled}
                >
                  {isApplyLoading
                    ? "적용 중..."
                    : hasPendingSettingsChange
                      ? "변경사항 적용 필요"
                      : "설정 적용"}
                </button>
              )}

              <button
                type="button"
                className={`ts-btn primary ${hasPendingSettingsChange ? "is-dirty" : ""}`}
                onClick={openAddModal}
                disabled={isBootstrapLoading || isApplyLoading}
              >
                + 지출 추가
              </button>
            </div>
          </div>
        </div>

        <span className="ts-hint">
          {MODE_HINT[settings.paymentMode] ?? MODE_HINT.INDIVIDUAL}
        </span>
      </div>

      <ActionPromptModal
        open={noticePrompt.open}
        title="안내"
        headline={noticePrompt.headline}
        description={noticePrompt.description}
        hideCancel
        confirmText="확인"
        onClose={closeNoticePrompt}
        onConfirm={closeNoticePrompt}
      />

      <ActionPromptModal
        open={applyPrompt.open}
        title="정산 설정 변경"
        headline="정산 설정을 변경하시겠습니까?"
        description={
          "이후 화면의 정산 결과가 새로운 규칙으로 재계산됩니다.\n기존에 등록된 지출 내역은 변경되지 않습니다."
        }
        cancelText="취소"
        confirmText="적용"
        onClose={closeApplyPrompt}
        onConfirm={confirmApplySettings}
      />
    </>
  );
};

export default TripSettings;
