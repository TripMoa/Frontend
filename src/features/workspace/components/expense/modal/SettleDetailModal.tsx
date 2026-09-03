import "./../../../styles/detailModal.css";
import BaseModal from "../../../../../shared/components/BaseModal";

import type { UseExpensesStore } from "../../../hooks/useExpenses";
import type { ExpenseMember } from "../../../hooks/expense.ui.types";

interface Props {
  store: UseExpensesStore;
  target: ExpenseMember;
  onClose: () => void;
}

const SettleDetailModal: React.FC<Props> = ({ store, target, onClose }) => {
  const { memberStats, getSettlementDetailRows } = store;

  const stat = memberStats.find((m) => m.mem === target);
  const details = getSettlementDetailRows(target);

  if (!stat) return null;

  const isPlus = stat.diff > 0;
  const isMinus = stat.diff < 0;

  return (
    <BaseModal
      open={!!stat}
      title={`${target}'s DETAIL`}
      onClose={onClose}
      className="sdm-modal"
      width="400px"
    >
      <div className="sdm-body">
        {/* SUMMARY */}
        <div className="sdm-summary">
          {isPlus && (
            <>
              <div className="sdm-plus">+{stat.diff.toLocaleString()}</div>
              <div className="sdm-label">총 받을 돈</div>
            </>
          )}

          {isMinus && (
            <>
              <div className="sdm-minus">{stat.diff.toLocaleString()}</div>
              <div className="sdm-label">총 보낼 돈</div>
            </>
          )}

          {!isPlus && !isMinus && (
            <>
              <div className="sdm-zero">0</div>
              <div className="sdm-label">정산 완료</div>
            </>
          )}
        </div>

        {/* DETAIL LIST */}
        <div id="sd-list">
          {details.length === 0 && (
            <div className="sdm-empty">정산할 내역이 없습니다.</div>
          )}

          {details.map((d) => (
            <div
              key={`${d.type}-${d.other}-${d.amount}`}
              className="settle-log-item"
            >
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
    </BaseModal>
  );
};

export default SettleDetailModal;
