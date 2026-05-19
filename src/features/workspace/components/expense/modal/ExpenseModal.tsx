// src/features/workspace/components/modals/ExpenseModal.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import "./../../../styles/expModal.css";
import { requestExpenseOcrWithPreview } from "../../../../../api/ocr.api";
import BaseModal from "../../../../../shared/components/BaseModal";
import { useTripContext } from "../../../hooks/useTripContext";
import type { UseExpensesStore } from "../../../hooks/useExpenses";
import { ActionPromptModal } from "../../../../../shared/components/ActionPromptModal";
import type {
  ExpenseItem,
  ExpenseMember,
  RoundingRule,
  SplitMap,
  SplitMode,
} from "../../../hooks/expense.ui.types";

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

// EQUAL 분할 계산
const calcEqualSplit = (
  cost: number,
  payer: ExpenseMember,
  involved: ExpenseMember[],
  roundingRule: RoundingRule = "PAYER",
): SplitMap => {
  const members = involved.length > 0 ? involved : [payer].filter(Boolean);
  const n = members.length;

  if (n === 0) return {};

  const base = Math.floor(cost / n);
  const remainder = cost - base * n;
  const out: SplitMap = {};

  members.forEach((m) => {
    out[m] = base;
  });

  if (remainder <= 0) return out;

  if (roundingRule === "SEQUENTIAL") {
    for (let i = 0; i < remainder; i++) {
      const target = members[i % n];
      out[target] = (out[target] ?? 0) + 1;
    }
  } else if (roundingRule === "RANDOM") {
    const seedStr = `${payer}|${cost}|${members.join(",")}`;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
      seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    }
    const nextRand = () => {
      seed ^= seed << 13;
      seed >>>= 0;
      seed ^= seed >> 17;
      seed >>>= 0;
      seed ^= seed << 5;
      seed >>>= 0;
      return seed / 0xffffffff;
    };
    for (let i = 0; i < remainder; i++) {
      const idx = Math.floor(nextRand() * n);
      out[members[idx]] = (out[members[idx]] ?? 0) + 1;
    }
  } else {
    const receiver = members.includes(payer) ? payer : members[0];
    out[receiver] = (out[receiver] ?? 0) + remainder;
  }

  return out;
};

const ExpenseModal: React.FC<Props> = ({ store }) => {
  const { tripId } = useTripContext();

  const {
    isExpenseModalOpen,
    editingId,
    expenses,
    closeExpenseModal,
    currentFileName,
    currentReceiptBase64,
    setCurrentFileName,
    setCurrentReceiptBase64,
    settings,
    members,
    createExpense,
    updateExpense,
    deleteExpense,
  } = store;

  const expenseMembers = useMemo<ExpenseMember[]>(
    () => members.map((member) => member.nickname),
    [members],
  );

  const defaultPayer = expenseMembers[0] ?? "";

  const [date, setDate] = useState("");
  const [storeName, setStoreName] = useState("");
  const [title, setTitle] = useState("");
  const [costText, setCostText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [cat, setCat] = useState("FOOD");
  const [method, setMethod] = useState("CARD");

  const [payer, setPayer] = useState<ExpenseMember>("");

  const [autoIncludePayer, setAutoIncludePayer] = useState(true);
  const [involved, setInvolved] = useState<ExpenseMember[]>([]);

  type ExpenseKind = "SHARED" | "PERSONAL" | null;
  const [expenseKind, setExpenseKind] = useState<ExpenseKind>(null);

  const [splitMode, setSplitMode] = useState<SplitMode>("EQUAL");
  const [splitAmounts, setSplitAmounts] = useState<
    Record<ExpenseMember, number>
  >({});

  type PromptMode = "notice" | "confirm";

  const [submitted, setSubmitted] = useState(false);

  const [prompt, setPrompt] = useState<{
    open: boolean;
    mode: PromptMode;
    title: string;
    headline: string;
    description: string;
    onConfirm?: () => void | Promise<void>;
  }>({
    open: false,
    mode: "notice",
    title: "",
    headline: "",
    description: "",
  });

  const showNotice = (headline: string, description = "") => {
    setPrompt({
      open: true,
      mode: "notice",
      title: "안내",
      headline,
      description,
    });
  };

  const showConfirm = (
    headline: string,
    description: string,
    onConfirm: () => void | Promise<void>,
  ) => {
    setPrompt({
      open: true,
      mode: "confirm",
      title: "확인",
      headline,
      description,
      onConfirm,
    });
  };

  const closePrompt = () => {
    setPrompt((prev) => ({ ...prev, open: false }));
  };

  const total = useMemo(() => parseMoney(costText), [costText]);

  const makeEmptySplitAmounts = (memberList: ExpenseMember[]) =>
    memberList.reduce<Record<ExpenseMember, number>>((acc, member) => {
      acc[member] = 0;
      return acc;
    }, {});

  const editingItem = useMemo(() => {
    if (!editingId) return null;
    return expenses.find((ex) => ex.id === editingId) ?? null;
  }, [editingId, expenses]);

  const activeInvolved = useMemo(() => {
    if (involved.length > 0) return involved;
    return payer ? [payer] : [];
  }, [involved, payer]);

  const computedSplit = useMemo<SplitMap>(() => {
    if (splitMode !== "EQUAL" || !settings) return {};

    return calcEqualSplit(total, payer, activeInvolved, settings.roundingRule);
  }, [splitMode, total, payer, activeInvolved, settings]);

  const participants = useMemo(() => {
    return activeInvolved.map((member) => {
      const amount =
        splitMode === "EQUAL"
          ? (computedSplit[member] ?? 0)
          : (splitAmounts[member] ?? 0);

      return { member, amount: Number(amount) };
    });
  }, [activeInvolved, splitMode, computedSplit, splitAmounts]);

  useEffect(() => {
    if (!isExpenseModalOpen || expenseMembers.length === 0) return;

    if (!editingId) {
      setSubmitted(false);
      setDate(todayISO());
      setStoreName("");
      setTitle("");
      setCostText("");
      setCat("FOOD");
      setMethod("CARD");
      setPayer(defaultPayer);
      setAutoIncludePayer(true);
      setInvolved([...expenseMembers]);
      setExpenseKind(null);
      setSplitMode("EQUAL");
      setReceiptFile(null);
      setCurrentFileName(null);
      setCurrentReceiptBase64(null);
      setSplitAmounts(makeEmptySplitAmounts(expenseMembers));
      return;
    }

    if (!editingItem) return;
    setSubmitted(false);
    setDate(editingItem.date);
    setStoreName(editingItem.storeName ?? "");
    setTitle(editingItem.title);
    setCostText(fmt(editingItem.cost));
    setCat(editingItem.cat);
    setMethod(editingItem.method);
    setPayer(editingItem.payer);
    setInvolved(editingItem.involved);
    setExpenseKind(editingItem.expenseKind ?? null);
    setAutoIncludePayer(editingItem.involved.includes(editingItem.payer));
    setSplitMode(editingItem.splitMode ?? "EQUAL");
    setReceiptFile(null);
    setCurrentReceiptBase64(editingItem.receipt ?? null);
    setCurrentFileName(editingItem.fileName ?? null);

    const nextAmounts = makeEmptySplitAmounts(expenseMembers);
    expenseMembers.forEach((member) => {
      nextAmounts[member] = Number(editingItem.split?.[member] ?? 0);
    });
    setSplitAmounts(nextAmounts);
  }, [
    isExpenseModalOpen,
    editingId,
    editingItem,
    expenseMembers,
    defaultPayer,
    setCurrentFileName,
    setCurrentReceiptBase64,
  ]);

  useEffect(() => {
    if (!isExpenseModalOpen || editingId) return;

    if (!payer && defaultPayer) setPayer(defaultPayer);
    if (involved.length === 0 && expenseMembers.length > 0) {
      setInvolved([defaultPayer]);
    }
  }, [
    isExpenseModalOpen,
    editingId,
    payer,
    defaultPayer,
    involved.length,
    expenseMembers.length,
  ]);

  useEffect(() => {
    if (!autoIncludePayer || !payer) return;

    setInvolved((prev) => (prev.includes(payer) ? prev : [...prev, payer]));
  }, [autoIncludePayer, payer]);

  const splitSum = useMemo(
    () => participants.reduce((a, p) => a + (p.amount || 0), 0),
    [participants],
  );

  const diff = useMemo(() => total - splitSum, [total, splitSum]);

  const isAllJoined =
    expenseMembers.length > 0 && involved.length === expenseMembers.length;
  const isOneJoined = involved.length === 1;

  const needsKindConfirm = useMemo(() => {
    if (!expenseKind) return false;
    if (expenseKind === "PERSONAL" && isAllJoined) return true;
    if (expenseKind === "SHARED" && isOneJoined) return true;
    return false;
  }, [expenseKind, isAllJoined, isOneJoined]);

  const kindWarningMessage = useMemo(() => {
    if (expenseKind === "PERSONAL" && isAllJoined) {
      return "* 개인 지출로 선택되어 있습니다.";
    }
    if (expenseKind === "SHARED" && isOneJoined) {
      return "* 공동 지출로 선택되어 있습니다.";
    }
    return "";
  }, [expenseKind, isAllJoined, isOneJoined]);

  const saveErrorMessage = useMemo(() => {
    if (!expenseKind) return "지출 유형을 선택해주세요";
    if (!date) return "날짜를 입력해주세요";
    if (!storeName.trim()) return "상호명을 입력해주세요";
    if (!title.trim()) return "항목을 입력해주세요";
    if (total <= 0) return "금액은 0원보다 커야 해요";
    if (!payer) return "결제자를 선택해주세요";
    if (!involved.length) return "참여자를 선택해주세요";
    if (diff !== 0) return "분할 합계가 총액과 같아야 해요";
    return "";
  }, [
    expenseKind,
    date,
    storeName,
    title,
    total,
    payer,
    involved.length,
    diff,
  ]);

  const canSave = useMemo(() => !saveErrorMessage, [saveErrorMessage]);

  const dateError = submitted && !date;
  const storeNameError = submitted && !storeName.trim();
  const titleError = submitted && !title.trim();
  const amountError = submitted && total <= 0;
  const payerError = submitted && !payer;
  const involvedError = submitted && !involved.length;
  const splitError = submitted && diff !== 0;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const openPicker = () => fileInputRef.current?.click();

  const handleReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showNotice(
        "업로드 용량 초과",
        "영수증 이미지는 3MB 이하만 업로드 가능합니다.",
      );
      return;
    }

    setReceiptFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setCurrentReceiptBase64(reader.result as string);
      setCurrentFileName(file.name);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const toggleInvolved = (member: ExpenseMember) => {
    setSubmitted(false);

    if (autoIncludePayer && member === payer) return;

    setInvolved((prev) => {
      const next = prev.includes(member)
        ? prev.filter((x) => x !== member)
        : [...prev, member];
      return next.length ? next : [member];
    });

    if (splitMode === "AMOUNT") {
      setSplitAmounts((prev) => ({ ...prev, [member]: 0 }));
    }
  };

  const handlePayerChange = (member: ExpenseMember) => {
    setSubmitted(false);
    setPayer(member);
    if (autoIncludePayer) {
      setInvolved((prev) => (prev.includes(member) ? prev : [...prev, member]));
    }
  };

  const handleCostInput = (v: string) => {
    const n = parseMoney(v);
    setCostText(n ? fmt(n) : "");
  };

  const handleAmountInput = (member: ExpenseMember, v: string) => {
    const n = parseMoney(v);
    setSplitAmounts((prev) => ({ ...prev, [member]: n }));
  };

  const clearAll = () => {
    setSubmitted(false);
    setDate(todayISO());
    setStoreName("");
    setTitle("");
    setCostText("");
    setCat("FOOD");
    setMethod("CARD");
    setPayer(defaultPayer);
    setAutoIncludePayer(true);
    setInvolved([...expenseMembers]);
    setExpenseKind(null);
    setSplitMode("EQUAL");
    setSplitAmounts(makeEmptySplitAmounts(expenseMembers));
    setReceiptFile(null);
    setCurrentFileName(null);
    setCurrentReceiptBase64(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const extractDate = (paidAt: string | null | undefined) => {
    if (!paidAt) return null;
    const s = paidAt.trim();
    if (!s) return null;

    const d = s.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  };

  const resolveReceiptSrc = (receipt: string | null) => {
    if (!receipt) return "";

    if (receipt.startsWith("data:image")) return receipt;

    if (receipt.startsWith("http://") || receipt.startsWith("https://")) {
      return receipt;
    }

    return `${import.meta.env.VITE_API_BASE_URL}${receipt}`;
  };

  const requestOcrAutofill = async () => {
    let fileForOcr = receiptFile;

    if (!fileForOcr && currentReceiptBase64) {
      try {
        const res = await fetch(resolveReceiptSrc(currentReceiptBase64));
        const blob = await res.blob();
        fileForOcr = new File([blob], currentFileName ?? "receipt.jpg", {
          type: blob.type || "image/jpeg",
        });
        setReceiptFile(fileForOcr);
      } catch {
        showNotice(
          "영수증 이미지를 다시 불러오지 못했습니다.",
          "이미지를 다시 업로드한 뒤 OCR 자동 입력을 시도해주세요.",
        );
        return;
      }
    }

    if (!fileForOcr) {
      showNotice("영수증 이미지를 업로드해주세요.");
      return;
    }

    if (!Number.isFinite(tripId) || tripId <= 0) {
      showNotice("유효한 여행 ID를 찾을 수 없습니다.");
      return;
    }

    const payerMember = members.find((m) => m.nickname === payer);
    if (!payerMember) {
      showNotice("결제자를 찾을 수 없습니다.");
      return;
    }

    const joinedMemberIds = members
      .filter((m) => involved.includes(m.nickname))
      .map((m) => m.memberId);

    const request = {
      payerMemberId: payerMember.memberId,
      isShared: expenseKind === "SHARED",
      autoIncludePayer,
      splitMode,
      joinedMemberIds,
    };

    setOcrLoading(true);
    try {
      const { data } = await requestExpenseOcrWithPreview(
        tripId,
        fileForOcr,
        request,
      );

      const autofill = data?.autofill;
      if (!autofill) {
        showNotice("OCR 응답 데이터가 비어 있습니다.");
        return;
      }

      const d = extractDate(autofill.paidAt);
      if (d) setDate(d);

      if (autofill.storeName) setStoreName(autofill.storeName);
      if (autofill.itemMemo) setTitle(autofill.itemMemo);
      if (autofill.totalAmount != null) {
        handleCostInput(String(autofill.totalAmount));
      }
      if (autofill.payMethod) setMethod(autofill.payMethod);
      if (autofill.category) setCat(autofill.category);

      showNotice("자동 입력 완료", "영수증 정보가 입력값에 반영되었습니다.");
      console.log("OCR autofill:", data.autofill);
      console.log("OCR preview:", data.preview);
    } catch (err: any) {
      console.error("OCR 자동입력 실패", err);
      console.error("OCR 응답 바디", err?.response?.data);

      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        "OCR 요청 중 오류가 발생했습니다.";

      showNotice("OCR 자동 입력 실패", msg);
    } finally {
      setOcrLoading(false);
    }
  };

  const saveExpense = async () => {
    const inv = involved.length ? involved : payer ? [payer] : [];

    const finalSplit: SplitMap =
      splitMode === "EQUAL"
        ? calcEqualSplit(total, payer, inv, settings?.roundingRule ?? "PAYER")
        : inv.reduce<SplitMap>((acc, member) => {
            acc[member] = Number(splitAmounts[member] ?? 0);
            return acc;
          }, {});

    const sum = inv.reduce(
      (a, member) => a + Number(finalSplit[member] ?? 0),
      0,
    );

    if (sum !== total) return;

    const payload: Omit<ExpenseItem, "id"> = {
      date,
      storeName: storeName.trim(),
      title: title.trim(),
      cost: total,
      cat,
      payer,
      method,
      involved: inv,
      expenseKind,
      splitMode,
      split: finalSplit,
      receipt: currentReceiptBase64,
      fileName: currentFileName,
    };

    try {
      if (editingId) {
        await updateExpense({ id: editingId, ...payload }, receiptFile);
      } else {
        await createExpense(payload, receiptFile);
      }
    } catch (error: any) {
      showNotice(
        editingId ? "지출 수정 실패" : "지출 등록 실패",
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          error?.message ??
          "지출 저장에 실패했습니다.",
      );
    }
  };

  const handleSave = async () => {
    setSubmitted(true);

    if (!expenseKind) {
      showNotice(
        "지출 유형을 선택해주세요",
        "공동 지출 또는 개인 지출 중 하나를 선택해야 저장할 수 있습니다.",
      );
      return;
    }

    if (!canSave) return;

    if (needsKindConfirm) {
      showConfirm(
        "지출 유형을 확인해주세요",
        expenseKind === "PERSONAL"
          ? "참여자가 전원인데 개인 지출로 선택되어 있습니다. 그대로 저장할까요?"
          : "참여자가 1명인데 공동 지출로 선택되어 있습니다. 그대로 저장할까요?",
        async () => {
          closePrompt();
          await saveExpense();
        },
      );
      return;
    }

    await saveExpense();
  };

  const handleDelete = async () => {
    if (!editingId) return;

    showConfirm(
      "지출 내역을 삭제할까요?",
      "삭제한 지출 내역은 다시 복구할 수 없습니다.",
      async () => {
        closePrompt();
        await deleteExpense(editingId);
      },
    );
  };

  const focusNextOnEnter = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;

    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;

    e.preventDefault();

    const root = formRef.current;
    if (!root) return;

    const fields = Array.from(
      root.querySelectorAll<HTMLElement>("input, select, textarea, button"),
    ).filter((el) => {
      const disabled = (el as HTMLInputElement).disabled;
      const hidden = el.getAttribute("type") === "hidden";
      const notVisible = (el as HTMLElement).offsetParent === null;
      return !disabled && !hidden && !notVisible;
    });

    const idx = fields.indexOf(target);
    if (idx < 0) return;

    (fields[idx + 1] ?? fields[0]).focus();
  };

  return (
    <>
      <BaseModal
        open={isExpenseModalOpen}
        title={editingId ? "EDIT EXPENSE" : "ADD EXPENSE"}
        onClose={closeExpenseModal}
        className="exp2-modal"
        width="min(980px, 92vw)"
        height="90vh"
      >
        <div ref={formRef} className="exp2-body" onKeyDown={focusNextOnEnter}>
          <div className="exp2-left">
            <div className="exp2-receipt-section">
              {currentFileName && (
                <div className="exp2-filehint">첨부: {currentFileName}</div>
              )}

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
                    <img
                      alt="receipt preview"
                      src={resolveReceiptSrc(currentReceiptBase64)}
                    />
                  </div>
                ) : (
                  <div className="exp2-upload-empty">
                    <div className="exp2-upload-label">
                      <span style={{ fontSize: 28 }}>📷</span>
                      <span>UPLOAD RECEIPT</span>
                    </div>
                    <small>
                      영수증 업로드 후 AUTO FILL 버튼을 누르면
                      <br />
                      데이터가 자동으로 입력됩니다.
                    </small>
                  </div>
                )}
              </div>

              <div className="exp2-info-box">
                ⚠ 왼쪽 영역은 자동 입력 대상이 아닙니다.
              </div>

              {currentReceiptBase64 && (
                <div className="exp2-upload-actions">
                  <button
                    className="exp2-btn exp2-btn--ghost"
                    type="button"
                    onClick={requestOcrAutofill}
                    disabled={ocrLoading}
                  >
                    {ocrLoading ? "자동 입력 중..." : "AUTO FILL"}
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

            <div className="exp2-left-box">
              <div className="exp2-box-title">
                WHO PAID? <span className="exp2-hint">(결제자)</span>
              </div>

              <select
                className={`exp2-select ${payerError ? "is-error" : ""}`}
                value={payer}
                onChange={(e) =>
                  handlePayerChange(e.target.value as ExpenseMember)
                }
              >
                {expenseMembers.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
              {payerError && (
                <div className="exp2-field-error">결제자를 선택해주세요.</div>
              )}

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
                {expenseMembers.map((member) => {
                  const on = involved.includes(member);
                  return (
                    <div
                      key={member}
                      className={`exp2-pill ${on ? "" : "is-off"}`}
                      onClick={() => toggleInvolved(member)}
                      role="button"
                      tabIndex={0}
                    >
                      {member}
                    </div>
                  );
                })}
              </div>
              {involvedError && (
                <div className="exp2-field-error">참여자를 선택해주세요.</div>
              )}

              <div style={{ height: 20 }} />

              <div className="exp2-box-title">
                EXPENSE TYPE <span className="exp2-hint">(지출 유형)</span>
              </div>

              <div
                className="exp2-seg"
                role="radiogroup"
                aria-label="expense type"
              >
                <button
                  type="button"
                  className={expenseKind === "SHARED" ? "active" : ""}
                  aria-pressed={expenseKind === "SHARED"}
                  onClick={() => setExpenseKind("SHARED")}
                >
                  공동 지출
                </button>

                <button
                  type="button"
                  className={expenseKind === "PERSONAL" ? "active" : ""}
                  aria-pressed={expenseKind === "PERSONAL"}
                  onClick={() => setExpenseKind("PERSONAL")}
                >
                  개인 지출
                </button>
              </div>

              {kindWarningMessage && (
                <div className="exp2-inline-warning">{kindWarningMessage}</div>
              )}
            </div>
          </div>

          <div className="exp2-form">
            <div className="exp2-row-2">
              <div className="exp2-field">
                <label>DATE</label>
                <input
                  className={`exp2-input ${dateError ? "is-error" : ""}`}
                  type="date"
                  value={date}
                  min="1900-01-01"
                  max="9999-12-31"
                  onChange={(e) => {
                    setSubmitted(false);
                    setDate(e.target.value);
                  }}
                />
                {dateError && (
                  <div className="exp2-field-error">날짜를 입력해주세요.</div>
                )}
              </div>

              <div className="exp2-field">
                <label>AMOUNT</label>
                <input
                  className={`exp2-input ${amountError ? "is-error" : ""}`}
                  type="text"
                  inputMode="numeric"
                  value={amountError ? "" : costText}
                  placeholder={
                    amountError ? "금액은 0원보다 커야 해요." : "금액 입력"
                  }
                  onChange={(e) => {
                    setSubmitted(false);
                    handleCostInput(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="exp2-field">
              <label>STORE NAME</label>
              <input
                className={`exp2-input ${storeNameError ? "is-error" : ""}`}
                type="text"
                value={storeNameError ? "" : storeName}
                placeholder={
                  storeNameError ? "상호명을 입력해주세요." : "상호명 입력"
                }
                onChange={(e) => {
                  setSubmitted(false);
                  setStoreName(e.target.value);
                }}
              />
            </div>

            <div className="exp2-field">
              <label>ITEM</label>
              <input
                className={`exp2-input ${titleError ? "is-error" : ""}`}
                type="text"
                value={titleError ? "" : title}
                placeholder={titleError ? "항목을 입력해주세요." : "항목 입력"}
                onChange={(e) => {
                  setSubmitted(false);
                  setTitle(e.target.value);
                }}
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
                  <option value="QR">QR/간편결제 (QR)</option>
                </select>
              </div>
            </div>

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
                  {canSave ? "OK: 저장 가능" : saveErrorMessage}
                </div>
                {splitError && (
                  <div className="exp2-field-error">
                    분할 합계가 총액과 같아야 해요.
                  </div>
                )}
              </div>
            </div>

            <div className="exp2-info-box">
              <div className="exp2-info-row">
                정산 모드: <strong>통합 버전</strong>
              </div>
              <div className="exp2-info-row">
                잔액 분배:{" "}
                <strong>
                  {settings?.roundingRule === "SEQUENTIAL"
                    ? "순차 분배"
                    : settings?.roundingRule === "RANDOM"
                      ? "랜덤 분배"
                      : "결제자 우선"}
                </strong>
              </div>
            </div>

            <div className="exp2-footer">
              <button
                className="exp2-delete"
                style={{ display: editingId ? "block" : "none" }}
                onClick={handleDelete}
              >
                DELETE
              </button>

              <button className="exp2-save" onClick={handleSave}>
                SAVE RECORD
              </button>
            </div>
          </div>
        </div>
      </BaseModal>

      <ActionPromptModal
        open={prompt.open}
        title={prompt.title}
        headline={prompt.headline}
        description={prompt.description}
        hideCancel={prompt.mode === "notice"}
        cancelText="취소"
        confirmText="확인"
        onClose={closePrompt}
        onConfirm={async () => {
          if (prompt.mode === "confirm" && prompt.onConfirm) {
            await prompt.onConfirm();
            return;
          }

          closePrompt();
        }}
      />
    </>
  );
};

export default ExpenseModal;
