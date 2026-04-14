// src/features/workspace/components/expense/PoolDepositModal.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./../../../styles/poolModal.css";
import BaseModal from "../../../../../shared/components/BaseModal";

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

  const amountRef = useRef<HTMLInputElement | null>(null);
  const dateRef = useRef<HTMLInputElement | null>(null);
  const memoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open || !member) return;

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
      requestAnimationFrame(() => amountRef.current?.focus());
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

      requestAnimationFrame(() => amountRef.current?.focus());
      return true;
    } catch (error: any) {
      alert(
        error?.response?.data?.message ??
          error?.message ??
          "입금 등록에 실패했습니다.",
      );
      return false;
    }
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
              value={amount}
              onChange={(e) => {
                const raw = e.target.value;
                const parsed = parseWonInput(raw);
                setAmount(parsed ? formatWonInput(parsed) : "");
              }}
              onKeyDown={onEnterNext(dateRef)}
              placeholder="예: ₩ 300,000"
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
              {depositLoading ? "불러오는 중..." : "아직 입금 내역이 없습니다."}
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
                      {it.memo && <div className="pdm-memo-txt">{it.memo}</div>}
                    </div>

                    <div className="pdm-amt">{formatWon(it.amount)}</div>

                    <button
                      className="pdm-del"
                      onClick={() => void deleteDepositById(member, it.id)}
                      disabled={depositLoading}
                    >
                      ✕
                    </button>

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
  );
};

export default PoolDepositModal;
