//src\features\workspace\components\modals\ExpenseModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";

import "../../styles/expModal.css";

import { EXPENSE_MEMS } from "../../hooks/useExpenses";
import type {
  ExpenseItem,
  ExpenseMember,
  SplitMode,
  SplitMap,
  UseExpensesStore,
} from "../../hooks/useExpenses";

interface Props {
  store: UseExpensesStore;
}

const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("ko-KR") : "0";
const parseMoney = (v: string) => {
  const s = String(v ?? "").replace(/[^\d]/g, "");
  return s ? parseInt(s, 10) : 0;
};

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// EQUAL 분할 계산(나머지 분배 규칙 적용)
const calcEqualSplit = (
  cost: number,
  payer: ExpenseMember,
  involved: ExpenseMember[],
  roundingRule: "PAYER" | "SEQUENTIAL" | "RANDOM" = "PAYER",
): SplitMap => {
  const n = involved.length || 1;
  const base = Math.floor(cost / n);
  const remainder = cost - base * n;

  const out: SplitMap = {};
  involved.forEach((m) => (out[m] = base));

  if (remainder <= 0) return out;

  // remainder 만큼 +1씩 분배
  if (roundingRule === "PAYER") {
    const receiver = involved.includes(payer) ? payer : involved[0];
    out[receiver] = (out[receiver] ?? 0) + remainder;
    return out;
  }

  // RANDOM은 리렌더마다 결과가 바뀌면 UX가 불안정해서,
  // 동일 입력에 대해 항상 같은 결과가 나오도록 간단한 seed를 사용
  const seedStr = `${payer}|${cost}|${involved.join(",")}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++)
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const nextRand = () => {
    // xorshift32
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >> 17;
    seed >>>= 0;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed / 0xffffffff;
  };

  for (let i = 0; i < remainder; i++) {
    const idx =
      roundingRule === "SEQUENTIAL" ? i % n : Math.floor(nextRand() * n);
    const target = involved[idx];
    out[target] = (out[target] ?? 0) + 1;
  }

  return out;
};

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
    settings,
  } = store;

  // form state
  const [date, setDate] = useState("");
  const [storeName, setStoreName] = useState("");
  const [title, setTitle] = useState("");
  const [costText, setCostText] = useState("0");

  const [cat, setCat] = useState("FOOD");
  const [method, setMethod] = useState("CARD");

  // left controls
  const [payer, setPayer] = useState<ExpenseItem["payer"]>("ME");
  const [autoIncludePayer, setAutoIncludePayer] = useState(true);
  const [involved, setInvolved] = useState<ExpenseMember[]>([...EXPENSE_MEMS]);

  // split
  const [splitMode, setSplitMode] = useState<SplitMode>("EQUAL");
  const [splitAmounts, setSplitAmounts] = useState<
    Record<ExpenseMember, number>
  >({
    ME: 0,
    J: 0,
    K: 0,
    M: 0,
  });

  const total = useMemo(() => parseMoney(costText), [costText]);

  const [saveError, setSaveError] = useState<string | null>(null);

  // 참여자 비어있으면 최소 1명 유지
  useEffect(() => {
    if (involved.length === 0) setInvolved([payer]);
  }, [involved.length, payer]);

  // 결제자를 참여자에 자동 포함
  useEffect(() => {
    if (!autoIncludePayer) return;
    setInvolved((prev) => (prev.includes(payer) ? prev : [...prev, payer]));
  }, [autoIncludePayer, payer]);

  // 모달 열릴 때 ADD/EDIT 주입
  useEffect(() => {
    if (!isExpenseModalOpen) return;

    if (!editingId) {
      setDate(todayISO());
      setStoreName("");
      setTitle("");
      setCostText("0");
      setCat("FOOD");
      setMethod("CARD");
      setPayer("ME");
      setAutoIncludePayer(true);
      setInvolved([...EXPENSE_MEMS]);
      setSplitMode("EQUAL");
      setSplitAmounts({ ME: 0, J: 0, K: 0, M: 0 });

      setCurrentFileName(null);
      setCurrentReceiptBase64(null);
      return;
    }

    const item = getEditingExpense();
    if (!item) return;

    setDate(item.date);
    setStoreName(item.storeName ?? "");
    setTitle(item.title);
    setCostText(fmt(item.cost));
    setCat(item.cat);
    setPayer(item.payer);
    setMethod(item.method);
    setInvolved(item.involved);

    setAutoIncludePayer(item.involved.includes(item.payer));

    setSplitMode(item.splitMode ?? "EQUAL");
    setSplitAmounts({
      ME: Number(item.split?.ME ?? 0),
      J: Number(item.split?.J ?? 0),
      K: Number(item.split?.K ?? 0),
      M: Number(item.split?.M ?? 0),
    });
  }, [isExpenseModalOpen, editingId]);

  // EQUAL 모드면 화면 표시도 자동 계산값을 쓰도록
  const computedSplit: SplitMap = useMemo(() => {
    if (splitMode !== "EQUAL") return {};
    if (total <= 0)
      return calcEqualSplit(
        0,
        payer,
        involved.length ? involved : [payer],
        settings.roundingRule,
      );
    return calcEqualSplit(
      total,
      payer,
      involved.length ? involved : [payer],
      settings.roundingRule,
    );
  }, [splitMode, total, payer, involved, settings.roundingRule]);

  const participants = useMemo(() => {
    const inv = involved.length ? involved : [payer];

    if (splitMode === "EQUAL") {
      return inv.map((m) => ({
        member: m,
        amount: Number(computedSplit[m] ?? 0),
      }));
    }
    return inv.map((m) => ({
      member: m,
      amount: Number(splitAmounts[m] ?? 0),
    }));
  }, [involved, payer, splitMode, computedSplit, splitAmounts]);

  const splitSum = useMemo(
    () => participants.reduce((a, p) => a + (p.amount || 0), 0),
    [participants],
  );
  const diff = useMemo(() => total - splitSum, [total, splitSum]);

  const canSave = useMemo(() => {
    if (!date) return false;
    if (!title.trim()) return false;
    if (total <= 0) return false;
    if (!involved.length) return false;
    if (diff !== 0) return false;
    return true;
  }, [date, title, total, involved.length, diff]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => fileInputRef.current?.click();

  const handleReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

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

  const toggleInvolved = (m: ExpenseMember) => {
    if (autoIncludePayer && m === payer) return;
    setInvolved((prev) => {
      const next = prev.includes(m)
        ? prev.filter((x) => x !== m)
        : [...prev, m];
      return next.length ? next : [m];
    });
    if (splitMode === "AMOUNT") {
      setSplitAmounts((prev) => ({ ...prev, [m]: 0 }));
    }
  };

  const handlePayerChange = (m: ExpenseMember) => {
    setPayer(m);
    if (autoIncludePayer) {
      setInvolved((prev) => (prev.includes(m) ? prev : [...prev, m]));
    }
  };

  const handleCostInput = (v: string) => {
    const n = parseMoney(v);
    setCostText(fmt(n));
  };

  const handleAmountInput = (m: ExpenseMember, v: string) => {
    const n = parseMoney(v);
    setSplitAmounts((prev) => ({ ...prev, [m]: n }));
  };

  const clearAll = () => {
    setDate(todayISO());
    setStoreName("");
    setTitle("");
    setCostText("0");
    setCat("FOOD");
    setMethod("CARD");
    setPayer("ME");
    setAutoIncludePayer(true);
    setInvolved([...EXPENSE_MEMS]);
    setSplitMode("EQUAL");
    setSplitAmounts({ ME: 0, J: 0, K: 0, M: 0 });
    setCurrentFileName(null);
    setCurrentReceiptBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // html의 MOCK OCR FILL 느낌(원하면 삭제 가능)
  const mockOcrFill = () => {
    setDate("2026-01-30");
    setCostText(fmt(5900));
    setMethod("CARD");
    setStoreName((prev) => (prev.trim() ? prev : "카공족 신풍역"));
    setTitle((prev) => (prev.trim() ? prev : "음료/카페"));
  };

  const handleSave = () => {
    if (!canSave) {
      alert("입력값을 확인해주세요. (특히 분할 합계 = 총액)");
      return;
    }

    const inv = involved.length ? involved : [payer];

    const finalSplit: SplitMap =
      splitMode === "EQUAL"
        ? calcEqualSplit(total, payer, inv, settings.roundingRule)
        : inv.reduce<SplitMap>((acc, m) => {
            acc[m] = Number(splitAmounts[m] ?? 0);
            return acc;
          }, {});

    // 마지막 안전 체크
    const sum = inv.reduce((a, m) => a + Number(finalSplit[m] ?? 0), 0);
    if (sum !== total) {
      alert("분할 합계가 총액과 일치해야 합니다.");
      return;
    }

    saveExpense({
      date,
      storeName: storeName.trim(),
      title: title.trim(),
      cost: total,
      cat,
      payer,
      method,
      involved: inv,
      splitMode,
      split: finalSplit,
      receipt: currentReceiptBase64,
      fileName: currentFileName,
    });
  };

  const handleOverlayMouseDown: React.MouseEventHandler<HTMLDivElement> = (
    e,
  ) => {
    if (e.target === e.currentTarget) closeExpenseModal();
  };

  // 엔터 핸들러
  const formRef = useRef<HTMLDivElement | null>(null);

  const focusNextOnEnter = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;

    const target = e.target as HTMLElement;

    if (target.tagName === "TEXTAREA") return;

    e.preventDefault();

    const root = formRef.current;
    if (!root) return;

    const fields = Array.from(
      root.querySelectorAll<HTMLElement>("input, select, textarea"),
    ).filter((el) => {
      const disabled = (el as HTMLInputElement).disabled;
      const hidden = el.getAttribute("type") === "hidden";
      const notVisible = (el as any).offsetParent === null;
      return !disabled && !hidden && !notVisible;
    });

    const idx = fields.indexOf(target);
    if (idx < 0) return;

    (fields[idx + 1] ?? fields[0]).focus();
  };

  return (
    <div
      id="exp-modal"
      className={`modal-overlay ${isExpenseModalOpen ? "active" : ""}`}
      onMouseDown={handleOverlayMouseDown}
    >
      <div className="modal-window exp2-modal" role="dialog" aria-modal="true">
        <div className="exp2-header">
          <div className="exp2-title">
            &gt;&gt; {editingId ? "EDIT" : "ADD"} EXPENSE
          </div>
          <button className="exp2-close" onClick={closeExpenseModal}>
            CLOSE [X]
          </button>
        </div>

        <div className="exp2-body">
          {/* LEFT */}
          <div className="exp2-left">
            {/* ====== Receipt Section ====== */}
            <div className="exp2-receipt-section">
              {/* ===== Upload Card ===== */}
              <div
                className="exp2-upload"
                onClick={openPicker}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openPicker();
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReceipt}
                  className="exp2-file-input"
                />

                {currentReceiptBase64 ? (
                  <div className="exp2-preview">
                    <img alt="receipt preview" src={currentReceiptBase64} />
                  </div>
                ) : (
                  <div className="exp2-upload-empty">
                    <div className="exp2-upload-label">
                      <span style={{ fontSize: 28 }}>📷</span>
                      <span>UPLOAD RECEIPT</span>
                    </div>
                    <small>
                      영수증 업로드 후 (OCR 연결 시)
                      <br />
                      날짜/금액/상호/결제수단 자동 입력 가능
                    </small>
                  </div>
                )}
              </div>

              {/* ===== Actions ===== */}
              {currentReceiptBase64 && (
                <div className="exp2-upload-actions">
                  <button
                    className="exp2-btn exp2-btn--ghost"
                    type="button"
                    onClick={mockOcrFill}
                  >
                    AUTO FILL
                  </button>
                  <button
                    className="exp2-btn exp2-btn--ghost"
                    type="button"
                    onClick={clearAll}
                  >
                    CLEAR
                  </button>
                </div>
              )}
            </div>

            {/* Left Box  */}
            <div className="exp2-left-box">
              <div className="exp2-box-title">
                WHO PAID? <span className="exp2-hint">(결제자)</span>
              </div>

              <select
                className="exp2-select"
                value={payer}
                onChange={(e) =>
                  handlePayerChange(e.target.value as ExpenseMember)
                }
              >
                {EXPENSE_MEMS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <div className="exp2-mini">
                <label>
                  <input
                    type="checkbox"
                    checked={autoIncludePayer}
                    onChange={(e) => setAutoIncludePayer(e.target.checked)}
                  />{" "}
                  결제자를 참여자에 자동 포함
                </label>
              </div>

              <div style={{ height: 14 }} />

              <div className="exp2-box-title">
                WHO JOINED? <span className="exp2-hint">(참여자)</span>
              </div>

              <div className="exp2-pill-row">
                {EXPENSE_MEMS.map((m) => {
                  const on = involved.includes(m);
                  return (
                    <div
                      key={m}
                      className={`exp2-pill ${on ? "" : "is-off"}`}
                      onClick={() => toggleInvolved(m)}
                      role="button"
                      tabIndex={0}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="exp2-form" ref={formRef} onKeyDown={focusNextOnEnter}>
            <div className="exp2-field">
              <label>DATE</label>
              <input
                className="exp2-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="exp2-field">
              <label>
                STORE NAME <span className="exp2-hint">(상호명)</span>
              </label>
              <input
                className="exp2-input"
                type="text"
                placeholder="예: 카공족 신풍역"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>

            <div className="exp2-field">
              <label>ITEM</label>
              <input
                className="exp2-input"
                type="text"
                placeholder="무엇을 샀나요? (예: 점심 식사)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="exp2-field">
              <label>COST (₩)</label>
              <input
                className="exp2-input"
                inputMode="numeric"
                value={costText}
                onChange={(e) => handleCostInput(e.target.value)}
              />
            </div>

            <div className="exp2-row-2">
              <div className="exp2-field">
                <label>CATEGORY</label>
                <select
                  className="exp2-select"
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                >
                  <option value="FOOD">식비 (FOOD)</option>
                  <option value="TRANS">교통 (TRANS)</option>
                  <option value="STAY">숙소 (STAY)</option>
                  <option value="SHOP">쇼핑 (SHOP)</option>
                  <option value="TICKET">관광/티켓 (TICKET)</option>
                  <option value="ETC">기타 (ETC)</option>
                </select>
              </div>

              <div className="exp2-field">
                <label>METHOD</label>
                <select
                  className="exp2-select"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="CARD">신용카드 (CARD)</option>
                  <option value="CASH">현금 (CASH)</option>
                  <option value="QR">QR/간편결제</option>
                </select>
              </div>
            </div>

            {/* SPLIT CALC */}
            <div className="exp2-split-card">
              <div className="exp2-split-head">
                <div className="exp2-split-title">SPLIT CALC</div>

                <div
                  className="exp2-toggle"
                  role="tablist"
                  aria-label="split type"
                >
                  <button
                    type="button"
                    className={splitMode === "EQUAL" ? "active" : ""}
                    aria-selected={splitMode === "EQUAL"}
                    onClick={() => setSplitMode("EQUAL")}
                  >
                    균등 (1/N)
                  </button>
                  <button
                    type="button"
                    className={splitMode === "AMOUNT" ? "active" : ""}
                    aria-selected={splitMode === "AMOUNT"}
                    onClick={() => setSplitMode("AMOUNT")}
                  >
                    금액 입력
                  </button>
                </div>
              </div>

              <div className="exp2-split-grid">
                {participants.map((p) => (
                  <div key={p.member} className="exp2-split-row">
                    <div className="exp2-who">
                      <strong>{p.member}</strong>
                      {p.member === payer && (
                        <span className="exp2-tag">PAYER</span>
                      )}
                    </div>

                    <div className="exp2-amt">
                      {splitMode === "EQUAL" ? (
                        <div className="exp2-amt-text">{fmt(p.amount)}원</div>
                      ) : (
                        <>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={fmt(splitAmounts[p.member] ?? 0)}
                            onChange={(e) =>
                              handleAmountInput(p.member, e.target.value)
                            }
                          />
                          <span className="exp2-won">원</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="exp2-split-summary">
                <div className="exp2-summary-left">
                  <div className="exp2-kv">
                    <span className="k">총액</span>
                    <span className="v">{fmt(total)}원</span>
                  </div>
                  <div className="exp2-kv">
                    <span className="k">분할합계</span>
                    <span className="v">{fmt(splitSum)}원</span>
                  </div>
                  <div className="exp2-kv">
                    <span className="k">차이</span>
                    <span className="v">
                      {diff >= 0 ? fmt(diff) : `-${fmt(Math.abs(diff))}`}원
                    </span>
                  </div>
                </div>

                <div className={`exp2-delta ${canSave ? "ok" : "bad"}`}>
                  {canSave ? "OK: 저장 가능" : "분할 합계가 총액과 같아야 해요"}
                </div>
              </div>
            </div>

            {/* footer buttons */}
            <div className="exp2-footer">
              <button
                className="exp2-delete"
                style={{ display: editingId ? "block" : "none" }}
                onClick={deleteCurrentExpense}
              >
                DELETE
              </button>

              <button
                className="exp2-save"
                disabled={!canSave}
                onClick={handleSave}
              >
                SAVE RECORD
              </button>
            </div>

            {/* (선택) 파일명 표시 */}
            {currentFileName && (
              <div className="exp2-filehint">첨부: {currentFileName}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
