// 정산 상세 — 시안(settle): 좁은 모달 · 보낼 돈/받을 돈 줄 목록 · [닫기]
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

  return (
    <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="tm-modal tm-modal--narrow"
        role="dialog"
        aria-modal="true"
        aria-label={`정산 상세 ${target}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tm-modal__head">
          <h3 className="tm-modal__title">정산 상세 · {target}</h3>
          <button type="button" className="tm-btn tm-btn--sm" onClick={onClose}>닫기</button>
        </div>

        <div className="tm-modal__body">
          <p className="tm-hint">
            {stat.diff > 0
              ? `총 받을 돈 ₩ ${stat.diff.toLocaleString()}`
              : stat.diff < 0
              ? `총 보낼 돈 ₩ ${Math.abs(stat.diff).toLocaleString()}`
              : "정산할 돈이 없어요"}
          </p>

          {details.length === 0 ? (
            <p className="tm-empty">정산할 내역이 없습니다.</p>
          ) : (
            <ul className="tm-list">
              {details.map((d) => (
                <li key={`${d.type}-${d.other}-${d.amount}`} className="tm-list__item">
                  <span className={`tm-tag ${d.type === "send" ? "tm-tag--danger" : "tm-tag--ok"}`}>
                    {d.type === "send" ? "보낼 돈" : "받을 돈"}
                  </span>
                  <div className="tm-list__main">
                    <div className="tm-list__title">{d.type === "send" ? `${d.other}에게` : `${d.other}에게서`}</div>
                  </div>
                  <b>₩ {d.amount.toLocaleString()}</b>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="tm-modal__foot">
          <button type="button" className="tm-btn" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default SettleDetailModal;
