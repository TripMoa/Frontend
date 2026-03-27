// src/features/workspace/components/modals/SettleDetailModal.tsx

import "./../../../styles/detailModal.css";
import type { UseExpensesStore } from "../../../hooks/useExpenses";
import type { ExpenseMember } from "../../../hooks/expense.ui.types";

interface Props {
  store: UseExpensesStore;
  target: ExpenseMember;
  onClose: () => void;
}

/**
 * SettleDetailModal
 * - Expense 정산 상세 모달
 * - 상태는 WorkspaceCenter에서 받은 store 사용
 * - 내부에서 useExpenses() 금지
 * - 백엔드 정산 요약 API(getSettlementSummary / preview / apply) 결과를 기반으로 표시
 */
const SettleDetailModal: React.FC<Props> = ({ store, target, onClose }) => {
  const { memberStats, getSettlementDetailRows } = store;

  const stat = memberStats.find((m) => m.mem === target);
  const details = getSettlementDetailRows(target);

  if (!stat) return null;

  const isPlus = stat.diff > 10;
  const isMinus = stat.diff < -10;

  return (
    <div
      id="settle-detail-modal"
      className="modal-overlay active"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-window"
        style={{ width: "400px", height: "400px" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; {target}&apos;s DETAIL</span>
          <button className="mh-close" onClick={onClose}>
            CLOSE [X]
          </button>
        </div>

        <div
          className="modal-body"
          style={{ padding: "20px", background: "#fff" }}
        >
          {/* SUMMARY */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "20px",
              paddingBottom: "15px",
              borderBottom: "2px solid #333",
            }}
          >
            {isPlus && (
              <>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "#4CAF50",
                  }}
                >
                  +{stat.diff.toLocaleString()}
                </div>
                <div style={{ fontSize: "13px" }}>총 받을 돈</div>
              </>
            )}

            {isMinus && (
              <>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "#F44336",
                  }}
                >
                  {stat.diff.toLocaleString()}
                </div>
                <div style={{ fontSize: "13px" }}>총 보낼 돈</div>
              </>
            )}

            {!isPlus && !isMinus && (
              <>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "#999",
                  }}
                >
                  0
                </div>
                <div style={{ fontSize: "13px" }}>정산 완료</div>
              </>
            )}
          </div>

          {/* DETAIL LIST */}
          <div id="sd-list">
            {details.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#999",
                  padding: "20px",
                }}
              >
                정산할 내역이 없습니다.
              </div>
            )}

            {details.map((d, idx) => (
              <div key={idx} className="settle-log-item">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    className={`settle-badge ${
                      d.type === "send" ? "badge-send" : "badge-receive"
                    }`}
                  >
                    {d.type === "send" ? "TO. SEND" : "FROM. GET"}
                  </span>
                  <span style={{ fontWeight: "bold", marginLeft: 8 }}>
                    {d.other}
                  </span>
                </div>

                <div
                  className="settle-amt"
                  style={{
                    color: d.type === "send" ? "#F44336" : "#4CAF50",
                  }}
                >
                  {d.type === "send" ? "-" : "+"}
                  {d.amount.toLocaleString()} ₩
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettleDetailModal;
