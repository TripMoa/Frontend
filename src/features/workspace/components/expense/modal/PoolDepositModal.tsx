// src/features/workspace/components/expense/PoolDepositModal.tsx
//
// 입금 기록 — 시안(pool): 좁은 모달 · 목표/입금/부족 요약 + 막대 · 입금 내역 줄(승인/반려 링크 + 상태 태그) · [닫기][+ 입금 기록 추가]
// 입금 등록 · 삭제 · 승인 · 반려 동작은 예전 창 그대로이고, 모양과 확인창만 바꿨다.
import React, { useEffect, useMemo, useRef, useState } from "react";
import WsConfirm from "../../layout/WsConfirm";
import type { UseExpensesStore } from "../../../hooks/useExpenses";
import type { ExpenseMember } from "../../../hooks/expense.ui.types";
import { useTripContext } from "../../../hooks/useTripContext";
import { apiMessage } from "../../../hooks/apiError";

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
  const num = typeof value === "number" ? value : Number(String(value).replace(/[^\d]/g, ""));
  if (Number.isNaN(num)) return "";
  return `₩ ${num.toLocaleString("ko-KR")}`;
};

// 문자열 → 숫자
const parseWonInput = (value: string) => {
  const num = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isNaN(num) ? 0 : num;
};

const formatWon = (n: number) => `₩ ${Math.max(0, n).toLocaleString("ko-KR")}`;

const PoolDepositModal: React.FC<Props> = ({ open, member, targetPerMember, store, onClose }) => {
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

  const [notice, setNotice] = useState({ open: false, headline: "", description: "" });
  const showNotice = (headline: string, description = "") => setNotice({ open: true, headline, description });
  const closeNotice = () => setNotice((prev) => ({ ...prev, open: false }));

  const [deletePrompt, setDeletePrompt] = useState<{ open: boolean; depositId: number | null }>({
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
    () => logs.filter((it) => it.depositStatus === "CONFIRMED").reduce((acc, it) => acc + (it.amount ?? 0), 0),
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
    } catch (error) {
      showNotice("입금 등록 실패", apiMessage(error, "입금 등록에 실패했습니다."));
      return false;
    }
  };

  const closeDeletePrompt = () => setDeletePrompt({ open: false, depositId: null });

  const requestDeleteDeposit = (depositId: number, status: string) => {
    const ownerOnlyStatuses = ["CONFIRMED", "REJECTED"];

    if (ownerOnlyStatuses.includes(status) && !isOwner) {
      showNotice("삭제 권한이 없습니다.", "승인 또는 거절된 입금 내역은 여행 소유주만 삭제할 수 있습니다.");
      return;
    }

    setDeletePrompt({ open: true, depositId });
  };

  const confirmDeleteDeposit = async () => {
    if (deletePrompt.depositId == null) return;

    await deleteDepositById(member, deletePrompt.depositId);
    closeDeletePrompt();
  };

  const onEnterNext =
    (next?: React.RefObject<HTMLInputElement | null>, submitIfLast?: boolean): React.KeyboardEventHandler<HTMLInputElement> =>
    async (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();

      if (submitIfLast) {
        await submit();
        return;
      }

      next?.current?.focus();
    };

  const pct = targetPerMember > 0 ? Math.min(100, Math.round((confirmedSum / targetPerMember) * 100)) : 0;
  const cell = (label: string, value: number) => (
    <div className="ws-sumcell">
      <span className="ws-when__l">{label}</span>
      <b className="ws-sumv">{formatWon(value)}</b>
    </div>
  );

  return (
    <>
      <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div
          className="tm-modal tm-modal--narrow"
          role="dialog"
          aria-modal="true"
          aria-label={`입금 기록 ${member}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tm-modal__head">
            <h3 className="tm-modal__title">입금 기록 · {member}</h3>
            <button type="button" className="tm-btn tm-btn--sm" onClick={onClose}>닫기</button>
          </div>

          <div className="tm-modal__body">
            <div className="ws-sumline ws-poolsum">
              {cell("목표", targetPerMember)}
              {cell("입금", confirmedSum)}
              {cell(diff < 0 ? "부족" : diff > 0 ? "초과" : "달성", Math.abs(diff))}
            </div>
            <div className="tm-progress ws-pool__bar"><i style={{ width: `${pct}%` }} /></div>

            <span className="ws-when__l">입금 추가</span>
            <div className="ws-fld ws-pool__form">
              <input
                ref={amountRef}
                className={`tm-input${amountError ? " tm-input--error" : ""}`}
                aria-label="입금액"
                value={amountError ? "" : amount}
                placeholder={amountError ? "입금액은 0원보다 커야 합니다." : "입금액 (예: ₩ 300,000)"}
                onChange={(e) => {
                  setSubmitted(false);
                  const parsed = parseWonInput(e.target.value);
                  setAmount(parsed ? formatWonInput(parsed) : "");
                }}
                onKeyDown={onEnterNext(dateRef)}
                inputMode="numeric"
                disabled={depositLoading}
              />
              <div className="ws-when ws-when--2">
                <input
                  ref={dateRef}
                  type="date"
                  className="tm-input ws-when__in"
                  aria-label="입금 날짜"
                  value={date}
                  min="1900-01-01"
                  max="9999-12-31"
                  onChange={(e) => setDate(e.target.value)}
                  onKeyDown={onEnterNext(memoRef)}
                  disabled={depositLoading}
                />
                <input
                  ref={memoRef}
                  className="tm-input ws-when__in"
                  aria-label="메모"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  onKeyDown={onEnterNext(undefined, true)}
                  placeholder="메모 (선택)"
                  disabled={depositLoading}
                />
              </div>
            </div>

            <span className="ws-when__l">입금 내역 {logs.length}건</span>
            {logs.length === 0 ? (
              <p className="tm-empty">{depositLoading ? "불러오는 중..." : "아직 입금 내역이 없습니다."}</p>
            ) : (
              <div className="ws-sett ws-sett--tight">
                {logs
                  .slice()
                  .sort((a, b) => (a.depositDate < b.depositDate ? 1 : -1))
                  .map((it) => (
                    <div key={it.id} className="ws-airow ws-airow--pool">
                      <div>
                        <b>{formatWon(it.amount)}</b>
                        <div className="tm-hint">
                          {it.depositDate}
                          {it.memo ? ` · ${it.memo}` : ""}
                        </div>
                      </div>
                      <div className="tm-row tm-gap-2">
                        {isOwner && it.depositStatus === "PENDING" && (
                          <>
                            <button
                              type="button"
                              className="tm-btn tm-btn--link tm-btn--sm ws-ulink"
                              onClick={() => void confirmDepositById(member, it.id)}
                              disabled={depositLoading}
                            >
                              승인
                            </button>
                            <button
                              type="button"
                              className="tm-btn tm-btn--link tm-btn--sm ws-ulink ws-ulink--danger"
                              onClick={() => void rejectDepositById(member, it.id)}
                              disabled={depositLoading}
                            >
                              반려
                            </button>
                          </>
                        )}
                        {(!["CONFIRMED", "REJECTED"].includes(it.depositStatus) || isOwner) && (
                          <button
                            type="button"
                            className="tm-btn tm-btn--link tm-btn--sm ws-ulink ws-ulink--danger"
                            onClick={() => requestDeleteDeposit(it.id, it.depositStatus)}
                            disabled={depositLoading}
                          >
                            삭제
                          </button>
                        )}
                        <span
                          className={`tm-tag ${
                            it.depositStatus === "CONFIRMED"
                              ? "tm-tag--mint"
                              : it.depositStatus === "REJECTED"
                              ? "tm-tag--danger"
                              : "tm-tag--yellow"
                          }`}
                        >
                          {it.depositStatusLabel}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="tm-modal__foot">
            <button type="button" className="tm-btn" onClick={onClose}>닫기</button>
            <button type="button" className="tm-btn tm-btn--primary" onClick={() => void submit()} disabled={depositLoading}>
              {depositLoading ? "처리 중..." : "+ 입금 기록 추가"}
            </button>
          </div>
        </div>
      </div>

      <WsConfirm
        open={notice.open}
        title="안내"
        headline={notice.headline}
        description={notice.description}
        hideCancel
        confirmText="확인"
        onClose={closeNotice}
        onConfirm={closeNotice}
      />

      <WsConfirm
        open={deletePrompt.open}
        title="입금 내역 삭제"
        headline="입금 내역을 삭제할까요?"
        description="삭제한 입금 내역은 다시 복구할 수 없습니다."
        cancelText="취소"
        confirmText="삭제"
        danger
        onClose={closeDeletePrompt}
        onConfirm={() => void confirmDeleteDeposit()}
      />
    </>
  );
};

export default PoolDepositModal;
