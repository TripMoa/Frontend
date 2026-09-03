// src/features/workspace/components/expense/PoolDepositModal.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./../../../styles/poolModal.css";
import BaseModal from "../../../../../shared/components/BaseModal";
import { ActionPromptModal } from "../../../../../shared/components/ActionPromptModal";
import type { UseExpensesStore } from "../../../hooks/useExpenses";
import type { ExpenseMember } from "../../../hooks/expense.ui.types";
import { useTripContext } from "../../../hooks/useTripContext";

type Props = {
  open: boolean;
  member: ExpenseMember | null;
  targetPerMember: number;
  store: UseExpensesStore;
  onClose: () => void;
};

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const todayYmd = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// 숫자 → ₩ + 콤마 문자열
const formatWonInput = (value: number | string) => {
  const num =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^\d]/g, ""));
  if (Number.isNaN(num)) return "";
  return `₩ ${num.toLocaleString("ko-KR")}`;
};

// 문자열 → 숫자
const parseWonInput = (value: string) => {
  const num = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isNaN(num) ? 0 : num;
};

const formatWon = (n: number) => `₩ ${Math.max(0, n).toLocaleString("ko-KR")}`;

const PoolDepositModal: React.FC<Props> = ({
  open,
  member,
  targetPerMember,
  store,
  onClose,
}) => {
  const {
    depositLogs,
    depositLoading,
    loadMemberDepositLogs,
    createDepositForMember,
    deleteDepositById,
    confirmDepositById,
    rejectDepositById,
  } = store;

  const { isOwner } = useTripContext();

  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(todayYmd());
  const [memo, setMemo] = useState<string>("");

  const [notice, setNotice] = useState({
    open: false,
    headline: "",
    description: "",
  });

  const showNotice = (headline: string, description = "") => {
    setNotice({
      open: true,
      headline,
      description,
    });
  };

  const closeNotice = () => {
    setNotice((prev) => ({ ...prev, open: false }));
  };

  const [deletePrompt, setDeletePrompt] = useState<{
    open: boolean;
    depositId: number | null;
  }>({
    open: false,
    depositId: null,
  });

  const [submitted, setSubmitted] = useState(false);
  const amountError = submitted && (!amount || parseWonInput(amount) <= 0);
  const amountRef = useRef<HTMLInputElement | null>(null);
  const dateRef = useRef<HTMLInputElement | null>(null);
  const memoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open || !member) return;

    setSubmitted(false);
    setAmount("");
    setDate(todayYmd());
    setMemo("");

    void loadMemberDepositLogs(member);
    requestAnimationFrame(() => amountRef.current?.focus());
  }, [open, member, loadMemberDepositLogs]);

  const logs = useMemo(() => {
    if (!member) return [];
    return depositLogs[member] ?? [];
  }, [depositLogs, member]);

  const confirmedSum = useMemo(
    () =>
      logs
        .filter((it) => it.depositStatus === "CONFIRMED")
        .reduce((acc, it) => acc + (it.amount ?? 0), 0),
    [logs],
  );

  const diff = confirmedSum - targetPerMember;

  if (!open || !member) return null;

  const submit = async () => {
    const n = parseWonInput(amount);
    if (!n || n <= 0) {
      setSubmitted(true);
      requestAnimationFrame(() => amountRef.current?.focus());
      return false;
    }

    if (!date) {
      showNotice("날짜를 입력해주세요.");
      requestAnimationFrame(() => dateRef.current?.focus());
      return false;
    }

    try {
      await createDepositForMember(member, {
        amount: n,
        depositDate: date,
        memo: memo.trim() || undefined,
      });

      setAmount("");
      setMemo("");
      setDate(todayYmd());
      setSubmitted(false);

      requestAnimationFrame(() => amountRef.current?.focus());
      return true;
    } catch (error: any) {
      showNotice(
        "입금 등록 실패",
        error?.response?.data?.message ??
          error?.message ??
          "입금 등록에 실패했습니다.",
      );
      return false;
    }
  };

  const closeDeletePrompt = () => {
    setDeletePrompt({
      open: false,
      depositId: null,
    });
  };

  const requestDeleteDeposit = (depositId: number, status: string) => {
    const ownerOnlyStatuses = ["CONFIRMED", "REJECTED"];

    if (ownerOnlyStatuses.includes(status) && !isOwner) {
      showNotice(
        "삭제 권한이 없습니다.",
        "승인 또는 거절된 입금 내역은 여행 소유주만 삭제할 수 있습니다.",
      );
      return;
    }

    setDeletePrompt({
      open: true,
      depositId,
    });
  };

  const confirmDeleteDeposit = async () => {
    if (deletePrompt.depositId == null) return;

    await deleteDepositById(member, deletePrompt.depositId);
    closeDeletePrompt();
  };

  const onEnterNext =
    (
      next?: React.RefObject<HTMLInputElement | null>,
      submitIfLast?: boolean,
    ): React.KeyboardEventHandler<HTMLInputElement> =>
    async (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();

      if (submitIfLast) {
        await submit();
        return;
      }

      next?.current?.focus();
    };

  return (
    <>
      <BaseModal
        open={open}
        title="DEPOSIT LOG"
        onClose={onClose}
        className="pdm-modal"
        width="min(980px, 92vw)"
      >
        <div className="pdm-body">
          <div className="pdm-form">
            <div className="pdm-field">
              <div className="pdm-panel-title">입금액</div>
              <input
                ref={amountRef}
                className={amountError ? "is-error" : ""}
                value={amountError ? "" : amount}
                placeholder={
                  amountError
                    ? "입금액은 0원보다 커야 합니다."
                    : "예: ₩ 300,000"
                }
                onChange={(e) => {
                  setSubmitted(false);

                  const raw = e.target.value;
                  const parsed = parseWonInput(raw);

                  setAmount(parsed ? formatWonInput(parsed) : "");
                }}
                onKeyDown={onEnterNext(dateRef)}
                inputMode="numeric"
                disabled={depositLoading}
              />
            </div>

            <div className="pdm-field">
              <div className="pdm-panel-title">날짜</div>
              <input
                ref={dateRef}
                type="date"
                value={date}
                min="1900-01-01"
                max="9999-12-31"
                onChange={(e) => setDate(e.target.value)}
                onKeyDown={onEnterNext(memoRef)}
                disabled={depositLoading}
              />
            </div>

            <div className="pdm-field pdm-memo">
              <div className="pdm-panel-title">메모</div>
              <input
                ref={memoRef}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                onKeyDown={onEnterNext(undefined, true)}
                placeholder="선택"
                disabled={depositLoading}
              />
            </div>

            <button
              className="pdm-add"
              onClick={() => void submit()}
              disabled={depositLoading}
            >
              {depositLoading ? "처리 중..." : "+ ADD"}
            </button>
          </div>

          <div className="pdm-list">
            <div className="pdm-summary">
              <span className="pdm-summary-main">
                {member} · 목표 {formatWon(targetPerMember)} · 현재{" "}
                {formatWon(confirmedSum)}
              </span>

              <span
                className={`pdm-summary-gap ${
                  diff < 0 ? "pdm-neg" : diff > 0 ? "pdm-pos" : ""
                }`}
              >
                ({diff < 0 ? "부족 " : diff > 0 ? "초과 " : "달성 "}
                {formatWon(Math.abs(diff))})
              </span>
            </div>

            <div className="pdm-list-head">
              <span>입금 기록</span>
              <span className="pdm-count"> {logs.length}건</span>
            </div>

            {logs.length === 0 ? (
              <div className="pdm-empty">
                {depositLoading
                  ? "불러오는 중..."
                  : "아직 입금 내역이 없습니다."}
              </div>
            ) : (
              <ul>
                {logs
                  .slice()
                  .sort((a, b) => (a.depositDate < b.depositDate ? 1 : -1))
                  .map((it) => (
                    <li key={it.id} className="pdm-item">
                      <div className="pdm-item-left">
                        <div className="pdm-date">{it.depositDate}</div>
                        {it.memo && (
                          <div className="pdm-memo-txt">{it.memo}</div>
                        )}
                      </div>

                      <div className="pdm-amt">{formatWon(it.amount)}</div>

                      {(!["CONFIRMED", "REJECTED"].includes(it.depositStatus) ||
                        isOwner) && (
                        <button
                          className="pdm-del"
                          onClick={() =>
                            requestDeleteDeposit(it.id, it.depositStatus)
                          }
                          disabled={depositLoading}
                        >
                          ✕
                        </button>
                      )}

                      <div className="pdm-actions">
                        <span
                          className={`pdm-status-badge ${
                            it.depositStatus === "CONFIRMED"
                              ? "is-confirmed"
                              : it.depositStatus === "REJECTED"
                                ? "is-rejected"
                                : "is-pending"
                          }`}
                        >
                          {it.depositStatusLabel}
                        </span>

                        {isOwner && it.depositStatus === "PENDING" && (
                          <>
                            <button
                              className="pdm-approve"
                              onClick={() =>
                                void confirmDepositById(member, it.id)
                              }
                              disabled={depositLoading}
                            >
                              승인
                            </button>

                            <button
                              className="pdm-reject"
                              onClick={() =>
                                void rejectDepositById(member, it.id)
                              }
                              disabled={depositLoading}
                            >
                              거절
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </BaseModal>

      <ActionPromptModal
        open={notice.open}
        title="안내"
        headline={notice.headline}
        description={notice.description}
        hideCancel
        confirmText="확인"
        onClose={closeNotice}
        onConfirm={closeNotice}
      />

      <ActionPromptModal
        open={deletePrompt.open}
        title="입금 내역 삭제"
        headline="승인된 입금 내역을 삭제할까요?"
        description="삭제한 입금 내역은 다시 복구할 수 없습니다."
        cancelText="취소"
        confirmText="삭제"
        onClose={closeDeletePrompt}
        onConfirm={() => void confirmDeleteDeposit()}
      />
    </>
  );
};

export default PoolDepositModal;
