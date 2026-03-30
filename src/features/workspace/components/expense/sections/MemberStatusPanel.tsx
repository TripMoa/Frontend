// src/features/workspace/components/expense/sections/MemberStatusPanel.tsx
import React from "react";
import type { ExpenseMember } from "../../../hooks/expense.ui.types";

type DepositStatusRow = {
  mem: ExpenseMember;
  targetAmount: number;
  depositedAmount: number;
  remainingAmount: number;
  overpaidAmount: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID";
};

interface MemberStatusPanelProps {
  settings: any;
  memberPanel: "SETTLE" | "STATUS";
  setMemberPanel: (p: "SETTLE" | "STATUS") => void;

  orderedMemberStats: any[];

  orderedDepositStatusRows: DepositStatusRow[];
  pagedDepositStatusRows: DepositStatusRow[];

  openDepositModal: (mem: string) => void;
  statusPage: number;
  setStatusPage: React.Dispatch<React.SetStateAction<number>>;
  statusPageCount: number;

  activePayer: string;
  setActivePayer: React.Dispatch<React.SetStateAction<string>>;
  onOpenSettleDetail: (m: string) => void;
  detailsRef: React.RefObject<HTMLDivElement | null>;
}

const MemberStatusPanel: React.FC<MemberStatusPanelProps> = ({
  settings,
  memberPanel,
  setMemberPanel,
  orderedMemberStats,
  orderedDepositStatusRows,
  pagedDepositStatusRows,
  openDepositModal,
  statusPage,
  setStatusPage,
  statusPageCount,
  activePayer,
  setActivePayer,
  onOpenSettleDetail,
  detailsRef,
}) => {
  const STATUS_PAGE_SIZE = 3;

  return (
    <div className="stat-box stat-box--members">
      <div className="stat-head stat-head-row">
        {settings.paymentMode === "HYBRID" && (
          <div className="seg-spacer" aria-hidden />
        )}
        <span>
          {settings.paymentMode === "POOL"
            ? "STATUS (입금 현황)"
            : settings.paymentMode === "HYBRID"
              ? memberPanel === "STATUS"
                ? "STATUS (입금 현황)"
                : "SETTLEMENT (1/N)"
              : "SETTLEMENT (1/N)"}
        </span>

        {settings.paymentMode === "HYBRID" && (
          <div className="seg">
            <button
              className={`seg-btn ${memberPanel === "SETTLE" ? "active" : ""}`}
              onClick={() => setMemberPanel("SETTLE")}
            >
              정산
            </button>
            <button
              className={`seg-btn ${memberPanel === "STATUS" ? "active" : ""}`}
              onClick={() => setMemberPanel("STATUS")}
            >
              현황
            </button>
          </div>
        )}
      </div>

      {settings.paymentMode === "POOL" ||
      (settings.paymentMode === "HYBRID" && memberPanel === "STATUS") ? (
        <>
          <div className="stat-body stat-body--fill">
            <div className="pool-chart-wrap">
              <div
                className="pool-chart"
                style={
                  {
                    "--status-cols": Math.min(
                      Math.max(pagedDepositStatusRows.length, 1),
                      STATUS_PAGE_SIZE,
                    ),
                  } as React.CSSProperties
                }
              >
                {pagedDepositStatusRows.map((m) => {
                  const sum = m.depositedAmount;
                  const target = m.targetAmount;
                  const filled = target > 0 ? Math.min(1, sum / target) : 0;
                  const shortage = m.remainingAmount;
                  const overflow = m.overpaidAmount;

                  return (
                    <div key={m.mem} className="pool-bar-col">
                      <button
                        className="pool-bar-btn"
                        onClick={() => openDepositModal(m.mem)}
                      >
                        <div className="pool-bar-meta">
                          {shortage > 0 ? (
                            <span className="pool-badge neg">
                              부족 ₩ {shortage.toLocaleString()}
                            </span>
                          ) : overflow > 0 ? (
                            <span className="pool-badge pos">
                              초과 ₩ {overflow.toLocaleString()}
                            </span>
                          ) : (
                            <span className="pool-badge ok">달성 !</span>
                          )}
                        </div>

                        <div className="pool-bar-frame">
                          {filled < 1 && (
                            <div
                              className="pool-bar-missing"
                              style={{ height: `${(1 - filled) * 100}%` }}
                            >
                              <div className="pool-bar-ghost" />
                            </div>
                          )}
                          <div
                            className="pool-bar-fill"
                            style={{ height: `${filled * 100}%` }}
                          />
                        </div>
                      </button>

                      <button
                        className="pool-name"
                        onClick={() => openDepositModal(m.mem)}
                      >
                        {m.mem}
                      </button>

                      <div className="pool-subline">
                        {sum.toLocaleString()} / {target.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {orderedDepositStatusRows.length > STATUS_PAGE_SIZE && (
            <div className="status-pagination">
              <button
                className="status-page-btn"
                onClick={() => setStatusPage((p) => Math.max(p - 1, 0))}
                disabled={statusPage === 0}
              >
                이전
              </button>
              <span className="status-page-indicator">
                {statusPage + 1} / {statusPageCount}
              </span>
              <button
                className="status-page-btn"
                onClick={() =>
                  setStatusPage((p) => Math.min(p + 1, statusPageCount - 1))
                }
                disabled={statusPage === statusPageCount - 1}
              >
                다음
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="stat-body">
          <div className="stat-scroll-area">
            <table className="stat-table settlement-table">
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th style={{ textAlign: "right", color: "#2196F3" }}>COST</th>
                  <th style={{ textAlign: "right", color: "#888" }}>PAID</th>
                  <th style={{ textAlign: "right" }}>±</th>
                  <th style={{ textAlign: "center" }}>DETAIL</th>
                </tr>
              </thead>
              <tbody>
                {orderedMemberStats.map((m) => (
                  <tr
                    key={m.mem}
                    className={`settle-row ${activePayer === m.mem ? "active" : ""}`}
                    onClick={() => {
                      setActivePayer((p) => (p === m.mem ? "ALL" : m.mem));
                      detailsRef.current?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                  >
                    <td style={{ fontWeight: "bold" }}>{m.mem}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                      {m.share.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", color: "#999" }}>
                      {m.paid.toLocaleString()}
                    </td>
                    <td
                      className={`st-res ${m.diff > 0 ? "plus" : m.diff < 0 ? "minus" : "zero"}`}
                      style={{ textAlign: "right" }}
                    >
                      {m.diff > 0 && "+"}
                      {m.diff.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn-detail"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSettleDetail(m.mem);
                        }}
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="stat-note">
        ※{" "}
        {settings.paymentMode === "POOL" ||
        (settings.paymentMode === "HYBRID" && memberPanel === "STATUS")
          ? "승인 완료된 입금 금액만 현황에 반영됩니다. 이름을 클릭하면 입금 기록을 관리할 수 있습니다."
          : "(+) 받을 돈 / (-) 보낼 돈 | 이름을 클릭하면 필터가 자동으로 적용됩니다."}
      </div>
    </div>
  );
};

export default MemberStatusPanel;
