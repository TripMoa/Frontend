// src/features/workspace/components/expense/sections/MemberStatusPanel.tsx
//
// 정산 상자의 "멤버별 정산" · "입금 현황" 표 — 시안: 머리 줄 + 누르면 상세 창이 열리는 줄 목록.
import React from "react";
import type {
  DepositStatusRow,
  ExpenseMember,
  MemberStatsRow,
} from "../../../hooks/expense.ui.types";

interface SettleRowsProps {
  rows: MemberStatsRow[];
  onOpenSettleDetail: (m: ExpenseMember) => void;
}

/** 멤버별 정산 — 이름 · 부담 · 결제 · 정산(보낼 돈 / 받을 돈) */
export const SettleRows: React.FC<SettleRowsProps> = ({ rows, onOpenSettleDetail }) => (
  <div className="ws-sett">
    <div className="ws-setrow is-head">
      <span>이름</span>
      <span>부담</span>
      <span>결제</span>
      <span>정산</span>
    </div>
    {rows.map((m) => (
      <button
        key={m.mem}
        type="button"
        className="ws-setrow"
        onClick={() => onOpenSettleDetail(m.mem)}
        aria-label={`${m.mem} 정산 상세 열기`}
      >
        <b>{m.mem}</b>
        <span>{m.share.toLocaleString()}</span>
        <span>{m.paid.toLocaleString()}</span>
        {m.diff < 0 ? (
          <b className="ws-neg">{Math.abs(m.diff).toLocaleString()} 보낼 돈</b>
        ) : m.diff > 0 ? (
          <b className="ws-pos">{m.diff.toLocaleString()} 받을 돈</b>
        ) : (
          <span className="tm-hint">정산 없음</span>
        )}
      </button>
    ))}
  </div>
);

interface DepositRowsProps {
  rows: DepositStatusRow[];
  openDepositModal: (mem: string) => void;
}

/** 입금 현황 — 이름 · 목표 · 입금 · 상태(달성 / 부족 / 초과) */
export const DepositRows: React.FC<DepositRowsProps> = ({ rows, openDepositModal }) => (
  <div className="ws-sett">
    <div className="ws-setrow is-head">
      <span>이름</span>
      <span>목표</span>
      <span>입금</span>
      <span>상태</span>
    </div>
    {rows.map((m) => (
      <button
        key={m.mem}
        type="button"
        className="ws-setrow"
        onClick={() => openDepositModal(m.mem)}
        aria-label={`${m.mem} 입금 기록 열기`}
      >
        <b>{m.mem}</b>
        <span>{m.targetAmount.toLocaleString()}</span>
        <span>{m.depositedAmount.toLocaleString()}</span>
        {m.remainingAmount > 0 ? (
          <span className="tm-hint">부족 {m.remainingAmount.toLocaleString()}</span>
        ) : m.overpaidAmount > 0 ? (
          <b className="ws-pos">초과 {m.overpaidAmount.toLocaleString()}</b>
        ) : (
          <b className="ws-pos">달성</b>
        )}
      </button>
    ))}
  </div>
);
