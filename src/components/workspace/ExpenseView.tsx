import "../../styles/workspace/center.css";
import type { ExpenseMember, UseExpensesStore } from "../../hooks/useExpenses";

interface Props {
  store: UseExpensesStore;
  onOpenSettleDetail: (m: ExpenseMember) => void;
}

/**
 * ExpenseView
 * - 화면 전용 컴포넌트
 * - 상태는 store(props)로만 사용
 * - 모달 렌더는 WorkspaceCenter에서만
 */
const ExpenseView: React.FC<Props> = ({ store, onOpenSettleDetail }) => {
  const {
    expenses,
    filteredList,
    summary,
    memberStats,
    categoryStats,
    filterDate,
    setFilter,
    openAddModal,
    openEditModal,
  } = store;

  const allDates = Array.from(new Set(expenses.map((e) => e.date))).sort();

  const viewReceipt = (e: React.MouseEvent, base64: string) => {
    e.stopPropagation();
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<img src="${base64}" style="max-width:100%">`);
    }
  };

  return (
    <>
      {/* ❗ WorkspaceCenter에 이미 id="view-expenses" 래퍼가 있으므로 여기서는 중복 id 제거 */}
      <div className="content-view-inner">
        {/* ================= HEADER + FILTER ================= */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            SHARED WALLET (KRW)
          </h2>

          <div className="filter-group">
            <button
              className={`filter-tag ${filterDate === "ALL" ? "active" : ""}`}
              onClick={() => setFilter("ALL")}
            >
              ALL
            </button>

            {allDates.map((date) => (
              <button
                key={date}
                className={`filter-tag ${filterDate === date ? "active" : ""}`}
                onClick={() => setFilter(date)}
              >
                {date.substring(5)}
              </button>
            ))}
          </div>
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="exp-summary">
          <div className="exp-card">
            <div className="lbl">TOTAL BUDGET</div>
            <div className="val">₩ {summary.totalBudget.toLocaleString()}</div>
          </div>

          <div className="exp-card highlight">
            <div className="lbl">TOTAL SPENT</div>
            <div className="val">₩ {summary.totalSpent.toLocaleString()}</div>
          </div>

          <div className="exp-card">
            <div className="lbl">REMAINING</div>
            <div className="val">₩ {summary.remaining.toLocaleString()}</div>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="stats-panel">
          <div className="stat-box">
            <div className="stat-head">&gt;&gt; SETTLEMENT (1/N)</div>

            <table className="stat-table">
              <thead>
                <tr>
                  <th>MEM</th>
                  <th style={{ textAlign: "right", color: "#2196F3" }}>COST</th>
                  <th style={{ textAlign: "right", color: "#888" }}>PAID</th>
                  <th style={{ textAlign: "right" }}>±</th>
                  <th style={{ textAlign: "center" }}>DETAIL</th>
                </tr>
              </thead>
              <tbody>
                {memberStats.map((m) => (
                  <tr key={m.mem}>
                    <td style={{ fontWeight: "bold" }}>{m.mem}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                      {m.share.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", color: "#999" }}>
                      {m.paid.toLocaleString()}
                    </td>
                    <td
                      className={`st-res ${
                        m.diff > 0 ? "plus" : m.diff < 0 ? "minus" : "zero"
                      }`}
                      style={{ textAlign: "right" }}
                    >
                      {m.diff > 0 && "+"}
                      {m.diff.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn-detail"
                        onClick={() => onOpenSettleDetail(m.mem)}
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="stat-note">* (+) 받을 돈 / (-) 보낼 돈</div>
          </div>

          {/* CATEGORY */}
          <div className="stat-box">
            <div className="stat-head">&gt;&gt; CATEGORY SPEND</div>

            <div id="cat-list">
              {categoryStats.map((c) => (
                <div key={c.cat} className="cat-item-box">
                  <div className="cat-top">
                    <span style={{ fontWeight: "bold" }}>{c.cat}</span>
                    <span>
                      ₩ {c.amount.toLocaleString()}{" "}
                      <span style={{ color: "#888", fontSize: "11px" }}>
                        ({c.percent}%)
                      </span>
                    </span>
                  </div>

                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-thumb"
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= LIST ================= */}
        <div className="exp-list-wrapper">
          <div className="exp-header">
            <span style={{ flex: 2 }}>DETAILS</span>
            <span style={{ flex: 1, textAlign: "right" }}>AMOUNT (₩)</span>
          </div>

          <div id="expense-list-container">
            {filteredList.map((item) => {
              const involvedText =
                !item.involved || item.involved.length === 4
                  ? "ALL"
                  : item.involved.join(", ");

              return (
                <div
                  key={item.id}
                  className="exp-row"
                  onClick={() => openEditModal(item.id)}
                >
                  <div className="exp-info">
                    <div className="exp-name">
                      {item.title}
                      {item.receipt && (
                        <span
                          className="receipt-link"
                          onClick={(e) => viewReceipt(e, item.receipt!)}
                        >
                          <i className="fa-solid fa-paperclip"></i>{" "}
                          {item.fileName || "영수증"}
                        </span>
                      )}
                    </div>

                    <div className="exp-meta-line">
                      <span className="badge-cat">{item.cat}</span>
                      <span>{item.date.substring(5)}</span>
                      <span style={{ color: "#ccc" }}>|</span>
                      <span>{item.payer} 결제</span>
                      <span style={{ color: "#ccc" }}>|</span>
                      <span style={{ color: "#2196F3", fontWeight: "bold" }}>
                        <i className="fa-solid fa-user-group"></i>{" "}
                        {involvedText}
                      </span>
                    </div>
                  </div>

                  <div className="exp-cost">- {item.cost.toLocaleString()}</div>
                </div>
              );
            })}
          </div>

          <button className="exp-add-btn" onClick={openAddModal}>
            + ADD NEW EXPENSE
          </button>
        </div>
      </div>
    </>
  );
};

export default ExpenseView;
