import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import "../../styles/workspace/modals.css";

import { EXPENSE_MEMS } from "../../hooks/useExpenses";
import type {
  ExpenseItem,
  ExpenseMember,
  UseExpensesStore,
} from "../../hooks/useExpenses";

interface Props {
  store: UseExpensesStore;
}

const ExpenseModal: React.FC<Props> = ({ store }) => {
  const {
    isExpenseModalOpen,
    editingId,
    getEditingExpense,
    saveExpense,
    deleteCurrentExpense,
    closeExpenseModal,
    setCurrentFileName,
    setCurrentReceiptBase64,
    currentFileName,
    currentReceiptBase64,
  } = store;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState("");
  const [cat, setCat] = useState("FOOD");
  const [payer, setPayer] = useState<ExpenseItem["payer"]>("ME");
  const [method, setMethod] = useState("CARD");
  const [involved, setInvolved] = useState<ExpenseMember[]>([]);

  // ✅ 모달이 열릴 때만 원본처럼 ADD/EDIT 값 주입
  useEffect(() => {
    if (!isExpenseModalOpen) return;

    if (!editingId) {
      // ADD (원본: openExpModal(null) 케이스)
      setDate("2025-12-24");
      setTitle("");
      setCost("");
      setCat("FOOD");
      setPayer("ME");
      setMethod("CARD");
      setInvolved([...EXPENSE_MEMS]);
      setCurrentFileName(null);
      setCurrentReceiptBase64(null);
      return;
    }

    // EDIT
    const item = getEditingExpense();
    if (!item) return;

    setDate(item.date);
    setTitle(item.title);
    setCost(String(item.cost));
    setCat(item.cat);
    setPayer(item.payer);
    setMethod(item.method);
    setInvolved(item.involved);
  }, [isExpenseModalOpen, editingId]);

  const handleReceipt = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("3MB 이하 파일만 업로드 가능합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCurrentReceiptBase64(reader.result as string);
      setCurrentFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!date || !title || !cost) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    if (!involved || involved.length === 0) {
      alert("참여자를 최소 1명 이상 선택해주세요.");
      return;
    }

    saveExpense({
      date,
      title,
      cost: Number(cost),
      cat,
      payer,
      method,
      involved,
      receipt: currentReceiptBase64,
      fileName: currentFileName,
    });
  };

  // overlay 바깥 클릭 닫기 (원본 UX 보강)
  const handleOverlayMouseDown: React.MouseEventHandler<HTMLDivElement> = (
    e
  ) => {
    if (e.target === e.currentTarget) closeExpenseModal();
  };

  return (
    <div
      id="exp-modal"
      className={`modal-overlay ${isExpenseModalOpen ? "active" : ""}`}
      onMouseDown={handleOverlayMouseDown}
    >
      <div className="modal-window exp-window">
        <div className="modal-header">
          <span className="mh-title">
            &gt;&gt; {editingId ? "EDIT" : "ADD"} EXPENSE
          </span>

          {/* ✅ 원본 closeExpModal() 복원 */}
          <button className="mh-close" onClick={closeExpenseModal}>
            CLOSE [X]
          </button>
        </div>

        <div
          className="modal-body"
          style={{ padding: "20px", background: "#fff", overflowY: "auto" }}
        >
          <div className="exp-form-grid">
            {/* RECEIPT */}
            <div
              className="receipt-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="receipt-input"
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleReceipt}
              />

              {currentReceiptBase64 ? (
                <img id="receipt-preview" src={currentReceiptBase64} />
              ) : (
                <div id="receipt-placeholder">
                  <i
                    className="fa-solid fa-camera"
                    style={{ fontSize: "24px", marginBottom: "10px" }}
                  ></i>
                  <span>UPLOAD RECEIPT</span>
                </div>
              )}
            </div>

            {/* INPUTS */}
            <div className="form-inputs">
              <div className="inp-row">
                <label>DATE</label>
                <input
                  type="date"
                  id="inp-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="inp-row">
                <label>ITEM</label>
                <input
                  type="text"
                  id="inp-title"
                  placeholder="무엇을 샀나요? (예: 점심 식사)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="inp-row">
                <label>COST (₩)</label>
                <input
                  type="number"
                  id="inp-cost"
                  placeholder="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>

              <div className="inp-row-group">
                <div className="inp-row">
                  <label>CATEGORY</label>
                  <select
                    id="inp-cat"
                    value={cat}
                    onChange={(e) => setCat(e.target.value)}
                  >
                    <option value="FOOD">식비 (FOOD)</option>
                    <option value="TRANS">교통 (TRANS)</option>
                    <option value="STAY">숙소 (STAY)</option>
                    <option value="SHOP">쇼핑 (SHOP)</option>
                    <option value="TICKET">관광/티켓</option>
                    <option value="ETC">기타 (ETC)</option>
                  </select>
                </div>

                <div className="inp-row">
                  <label>WHO PAID? (결제자)</label>
                  <select
                    id="inp-payer"
                    value={payer}
                    onChange={(e) => setPayer(e.target.value as ExpenseMember)}
                  >
                    {EXPENSE_MEMS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="inp-row" style={{ marginTop: "10px" }}>
                <label>WHO JOINED? (참여자 - 1/N 대상)</label>
                <div id="inp-involved-wrapper" className="check-group">
                  {EXPENSE_MEMS.map((m) => (
                    <span
                      key={m}
                      className={`check-btn ${
                        involved.includes(m) ? "active" : ""
                      }`}
                      onClick={() =>
                        setInvolved((prev) =>
                          prev.includes(m)
                            ? prev.filter((x) => x !== m)
                            : [...prev, m]
                        )
                      }
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="inp-row">
                <label>METHOD</label>
                <select
                  id="inp-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="CARD">신용카드 (CARD)</option>
                  <option value="CASH">현금 (CASH)</option>
                  <option value="QR">QR/간편결제</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              id="btn-delete-exp"
              className="btn-delete-exp"
              style={{ display: editingId ? "block" : "none" }}
              onClick={deleteCurrentExpense}
            >
              DELETE
            </button>

            <button className="btn-save-exp" onClick={handleSave}>
              SAVE RECORD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
