// src/features/workspace/components/expense/sections/TripSettings.tsx
//
// "정산 설정" 창 — 디자인 기준(시안)의 expset: 좁은 모달 · 정산 방식 · 잔돈/잔액 배분 · 예산(통장) 금액 + 미리보기 · [취소][설정 적용].
// 값을 바꾸고 미리보기/적용하는 동작은 예전 화면 그대로이고, 항상 펼쳐 두던 것을 버튼으로 여는 창으로 옮겼다.
import React, { useState } from "react";
import WsConfirm from "../../layout/WsConfirm";
import type {
  ExpenseSettings,
  PaymentMode,
  RemainingRule,
  RoundingRule,
} from "../../../hooks/expense.ui.types";

interface TripSettingsProps {
  open: boolean;
  onClose: () => void;

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
  /** 적용하지 않은 변경이 있는지 */
  hasPendingSettingsChange: boolean;

  onPreviewSettings: (fixedBudget?: number) => void;
  onApplySettings: (fixedBudget?: number) => void;

  formatWon: (val: number | string) => string;
  parseWon: (val: string) => number;
}

const MODE_HINT: Record<PaymentMode, string> = {
  INDIVIDUAL: "공동 지출만 예산에서 빠지고, 개인 지출은 정산에서 따로 계산돼요.",
  POOL: "모임 통장 금액을 기준으로 입금 현황과 잔액을 관리해요.",
  HYBRID: "공동 지출은 통장에서 빠지고, 개인 지출은 따로 정산해요.",
};

const TripSettings: React.FC<TripSettingsProps> = ({
  open,
  onClose,
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
  hasPendingSettingsChange,
  onPreviewSettings,
  onApplySettings,
  formatWon,
  parseWon,
}) => {
  const busy = !isOwner || isBootstrapLoading || isPreviewLoading || isApplyLoading;

  const [noticePrompt, setNoticePrompt] = useState({ open: false, headline: "", description: "" });
  const [applyPrompt, setApplyPrompt] = useState<{ open: boolean; fixedBudget?: number }>({
    open: false,
    fixedBudget: undefined,
  });

  const closeNoticePrompt = () => setNoticePrompt((prev) => ({ ...prev, open: false }));
  const closeApplyPrompt = () => setApplyPrompt({ open: false, fixedBudget: undefined });

  const normalizeBudgetByMemberCount = (rawInput: string) => {
    const currentAmount = parseWon(rawInput);

    if (currentAmount <= 0) return { fixedAmount: 0, adjusted: false, difference: 0 };
    if (currentAmount % memberCount === 0) return { fixedAmount: currentAmount, adjusted: false, difference: 0 };

    const fixedAmount = Math.floor(currentAmount / memberCount) * memberCount;
    return { fixedAmount, adjusted: true, difference: currentAmount - fixedAmount };
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
    setApplyPrompt({ open: true, fixedBudget: fixed });
  };

  const confirmApplySettings = () => {
    onApplySettings(applyPrompt.fixedBudget);
    closeApplyPrompt();
    onClose();
  };

  const isPool = settings.paymentMode === "POOL";
  const isHybrid = settings.paymentMode === "HYBRID";
  const lockFields = !isOwner || isApplyLoading || isPreviewLoading;

  return (
    <>
      {open && (
        <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <div
            className="tm-modal tm-modal--narrow"
            role="dialog"
            aria-modal="true"
            aria-label="정산 설정"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tm-modal__head">
              <h3 className="tm-modal__title">정산 설정</h3>
              <button type="button" className="tm-btn tm-btn--sm" onClick={onClose}>닫기</button>
            </div>

            <div className="tm-modal__body">
              <div className="tm-field">
                <label className="tm-label" htmlFor="ws-set-pm">정산 방식</label>
                <select
                  id="ws-set-pm"
                  className="tm-select"
                  value={settings.paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  disabled={lockFields}
                >
                  <option value="INDIVIDUAL">결제 후 정산</option>
                  <option value="POOL">모임 통장</option>
                  <option value="HYBRID">통합 버전</option>
                </select>
                <p className="ws-aidesc ws-set__hint">{MODE_HINT[settings.paymentMode] ?? MODE_HINT.INDIVIDUAL}</p>
              </div>

              {!isPool && (
                <div className="tm-field">
                  <label className="tm-label" htmlFor="ws-set-round">잔돈 배분 방식</label>
                  <select
                    id="ws-set-round"
                    className="tm-select"
                    value={settings.roundingRule}
                    onChange={(e) => setRoundingRule(e.target.value as RoundingRule)}
                    disabled={lockFields}
                  >
                    <option value="PAYER">나머지 금액 결제자에게 할당</option>
                    <option value="SEQUENTIAL">나머지 금액 순서대로 할당</option>
                    <option value="RANDOM">나머지 금액 랜덤으로 할당</option>
                  </select>
                </div>
              )}

              {(isPool || isHybrid) && (
                <div className="tm-field">
                  <label className="tm-label" htmlFor="ws-set-rest">잔액 배분 방식</label>
                  <select
                    id="ws-set-rest"
                    className="tm-select"
                    value={settings.remainingRule}
                    onChange={(e) => setRemainingRule(e.target.value as RemainingRule)}
                    disabled={lockFields}
                  >
                    <option value="AUTO">입금 비율 기준으로 자동 분배</option>
                    <option value="EQUAL">전체 멤버 1/N로 분배</option>
                    <option value="CARRY">다음 여행으로 이월</option>
                  </select>
                </div>
              )}

              <div className="tm-field">
                <label className="tm-label" htmlFor="ws-set-bud">{isPool || isHybrid ? "통장 금액" : "예산"}</label>
                <div className="tm-input-group">
                  <input
                    id="ws-set-bud"
                    className="tm-input"
                    value={sharedBudgetInput}
                    onChange={(e) => setSharedBudgetInput(formatWon(parseWon(e.target.value)))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && isOwner) handlePreviewClick();
                    }}
                    placeholder={isPool ? "모임 통장 금액" : "공동 지출 목표"}
                    inputMode="numeric"
                    readOnly={!isOwner}
                    disabled={isApplyLoading || isPreviewLoading}
                  />
                  {isOwner && (
                    <button type="button" className="tm-btn tm-btn--sm" onClick={handlePreviewClick} disabled={busy}>
                      {isPreviewLoading ? "미리보기 중..." : "미리보기"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="tm-modal__foot">
              <button type="button" className="tm-btn" onClick={onClose}>취소</button>
              {isOwner && (
                <button type="button" className="tm-btn tm-btn--primary" onClick={handleApplyClick} disabled={busy}>
                  {isApplyLoading ? "적용 중..." : hasPendingSettingsChange ? "변경사항 적용" : "설정 적용"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <WsConfirm
        open={noticePrompt.open}
        title="안내"
        headline={noticePrompt.headline}
        description={noticePrompt.description}
        hideCancel
        confirmText="확인"
        onClose={closeNoticePrompt}
        onConfirm={closeNoticePrompt}
      />

      <WsConfirm
        open={applyPrompt.open}
        title="정산 설정 변경"
        headline="정산 설정을 변경하시겠습니까?"
        description={"이후 화면의 정산 결과가 새로운 규칙으로 재계산됩니다.\n기존에 등록된 지출 내역은 변경되지 않습니다."}
        cancelText="취소"
        confirmText="적용"
        onClose={closeApplyPrompt}
        onConfirm={confirmApplySettings}
      />
    </>
  );
};

export default TripSettings;
