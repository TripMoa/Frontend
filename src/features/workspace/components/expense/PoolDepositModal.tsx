// src/features/workspace/components/expense/PoolDepositModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/poolModal.css";

export type DepositLog = {
  id: string;
  member: string;
  amount: number;
  date: string; // YYYY-MM-DD
  memo?: string;
};

type Props = {
  open: boolean;
  member: string | null;
  targetPerMember: number;
  logs: DepositLog[];
  onClose: () => void;
  onAddLog: (member: string, log: Omit<DepositLog, "id" | "member">) => void;
  onDeleteLog?: (member: string, id: string) => void;
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
  if (isNaN(num)) return "";
  return `₩ ${num.toLocaleString("ko-KR")}`;
};

// 문자열 → 숫자 (₩, 콤마 제거)
const parseWonInput = (value: string) => {
  const num = Number(String(value).replace(/[^\d]/g, ""));
  return isNaN(num) ? 0 : num;
};

// 화면 출력용
const formatWon = (n: number) => `₩ ${Math.max(0, n).toLocaleString("ko-KR")}`;

const PoolDepositModal: React.FC<Props> = ({
  open,
  member,
  targetPerMember,
  logs,
  onClose,
  onAddLog,
  onDeleteLog,
}) => {
  // State: 폼 입력값
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(todayYmd());
  const [memo, setMemo] = useState<string>("");

  // Ref: Enter로 다음 입력칸 이동 및 포커스 제어
  const amountRef = useRef<HTMLInputElement | null>(null);
  const dateRef = useRef<HTMLInputElement | null>(null);
  const memoRef = useRef<HTMLInputElement | null>(null);

  // Effect: 모달이 열리면 첫 입력(입금액)으로 포커스 이동
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => amountRef.current?.focus());
    }
  }, [open]);

  // Memo: 해당 멤버의 총 입금액 합계 계산
  const sum = useMemo(
    () => logs.reduce((acc, it) => acc + (it.amount ?? 0), 0),
    [logs],
  );

  // Derived: 목표 대비 차액(초과/부족/달성 표시용)
  const diff = sum - targetPerMember;

  if (!open || !member) return null;

  // 입금 기록 추가 핸들러
  const submit = () => {
    const n = parseWonInput(amount);
    if (!n || n <= 0) {
      requestAnimationFrame(() => amountRef.current?.focus());
      return false;
    }

    onAddLog(member, {
      amount: n,
      date,
      memo: memo.trim() || undefined,
    });

    setAmount("");
    setMemo("");

    requestAnimationFrame(() => amountRef.current?.focus());
    return true;
  };

  // Enter 동작 공통 핸들러
  const onEnterNext =
    (
      next?: React.RefObject<HTMLInputElement | null>,
      submitIfLast?: boolean,
    ): React.KeyboardEventHandler<HTMLInputElement> =>
    (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();

      if (submitIfLast) {
        submit();
        return;
      }

      next?.current?.focus();
    };

  return (
    <div className="pdm-backdrop" onMouseDown={onClose}>
      <div
        className="pdm-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="pdm-head">
          <div>
            <div className="pdm-title">&gt;&gt; DEPOSIT LOG</div>
          </div>
          <button className="pdm-close" onClick={onClose}>
            CLOSE [X]
          </button>
        </div>

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
              />
            </div>

            <button className="pdm-add" onClick={submit}>
              + ADD
            </button>
          </div>

          <div className="pdm-list">
            <div className="pdm-summary">
              <span className="pdm-summary-main">
                {member} · 목표 {formatWon(targetPerMember)} · 현재{" "}
                {formatWon(sum)}
              </span>

              <span
                className={`pdm-summary-gap ${diff < 0 ? "pdm-neg" : diff > 0 ? "pdm-pos" : ""}`}
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
              <div className="pdm-empty">아직 입금 내역이 없습니다.</div>
            ) : (
              <ul>
                {logs
                  .slice()
                  .sort((a, b) => (a.date < b.date ? 1 : -1))
                  .map((it) => (
                    <li key={it.id} className="pdm-item">
                      <div className="pdm-item-left">
                        <div className="pdm-date">{it.date}</div>
                        {it.memo && (
                          <div className="pdm-memo-txt">{it.memo}</div>
                        )}
                      </div>
                      <div className="pdm-amt">{formatWon(it.amount)}</div>
                      {onDeleteLog && (
                        <button
                          className="pdm-del"
                          onClick={() => onDeleteLog(member, it.id)}
                          title="삭제"
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolDepositModal;
