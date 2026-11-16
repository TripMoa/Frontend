// src/features/workspace/components/modals/ExpenseModal.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { requestExpenseOcrWithPreview } from "../../../../../api/ocr.api";
import { useTripContext } from "../../../hooks/useTripContext";
import type { UseExpensesStore } from "../../../hooks/useExpenses";
import WsConfirm from "../../layout/WsConfirm";
import type {
  ExpenseItem,
  ExpenseMember,
  RoundingRule,
  SplitMap,
  SplitMode,
} from "../../../hooks/expense.ui.types";
import { API_BASE_URL } from "../../../../../shared/config/env";
import type { ScheduleItemOption } from "../../../../../types/scheduleItemOption.types";

interface Props {
  store: UseExpensesStore;
  scheduleItemOptions?: ScheduleItemOption[];
  initialScheduleItemId?: number | null;
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

const ExpenseModal: React.FC<Props> = ({
  store,
  scheduleItemOptions = [],
  initialScheduleItemId = null,
}) => {
  const { tripId } = useTripContext();

  const groupedScheduleItemsByDay = scheduleItemOptions.reduce<
    Record<string, ScheduleItemOption[]>
  >((acc, opt) => {
    (acc[opt.day] ??= []).push(opt);
    return acc;
  }, {});

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

  const [scheduleItemId, setScheduleItemId] = useState<number | null>(
    initialScheduleItemId,
  );

  type PromptMode = "notice" | "confirm";

  const [submitted, setSubmitted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false); // 자세한 설정(카테고리·결제 수단·분할·일정 연결)

  const [prompt, setPrompt] = useState<{
    open: boolean;
    mode: PromptMode;
    title: string;
    headline: string;
    description: string;
    confirmText?: string;
    danger?: boolean;
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
    opts?: { confirmText?: string; danger?: boolean },
  ) => {
    setPrompt({
      open: true,
      mode: "confirm",
      title: "확인",
      headline,
      description,
      confirmText: opts?.confirmText,
      danger: opts?.danger,
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
      setScheduleItemId(initialScheduleItemId);
      return;
    }

    if (!editingItem) return;
    setSubmitted(false);
    setScheduleItemId(editingItem.scheduleItemId ?? null);
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
    initialScheduleItemId,
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
    setScheduleItemId(initialScheduleItemId);
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

    return `${API_BASE_URL}${receipt}`;
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
      scheduleItemId,
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
      { confirmText: "삭제", danger: true },
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

  if (!isExpenseModalOpen) return null;

  const CAT_NAME: Record<string, string> = {
    FOOD: "식비",
    TRANS: "교통",
    STAY: "숙소",
    SHOP: "쇼핑",
    TICKET: "관광/티켓",
    ETC: "기타",
  };
  const METHOD_NAME: Record<string, string> = { CARD: "카드", CASH: "현금", QR: "QR·간편결제" };
  const linkedLabel = scheduleItemId != null ? "일정 연결됨" : "연결 없음";
  const moreSummary = `${CAT_NAME[cat] ?? cat} · ${METHOD_NAME[method] ?? method} · ${
    splitMode === "EQUAL" ? "균등 분할" : "금액 지정"
  } · ${linkedLabel}`;
  const star = <span className="ws-req" aria-hidden="true">*</span>;

  return (
    <>
      <div className="tm-overlay">
        <div
          className="tm-modal ws-expm"
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? "지출 수정" : "지출 추가"}
        >
          <div className="tm-modal__head">
            <h3 className="tm-modal__title">{editingId ? "지출 수정" : "지출 추가"}</h3>
            <button type="button" className="tm-btn tm-btn--sm" onClick={closeExpenseModal}>닫기</button>
          </div>

          <div ref={formRef} className="tm-modal__body" onKeyDown={focusNextOnEnter}>
            {/* 영수증 — 자동 입력 */}
            <div className="ws-ocrrow">
              <span className="tm-hint tm-grow">
                {currentFileName
                  ? `첨부: ${currentFileName}`
                  : "영수증 사진으로 자동 입력할 수 있어요 (3MB 이하)"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReceipt}
                className="ws-sr"
                tabIndex={-1}
                aria-hidden="true"
              />
              {currentReceiptBase64 && (
                <>
                  <button type="button" className="tm-btn tm-btn--sm" onClick={requestOcrAutofill} disabled={ocrLoading}>
                    {ocrLoading ? "자동 입력 중..." : "자동 입력"}
                  </button>
                  <button type="button" className="tm-btn tm-btn--sm" onClick={clearAll}>지우기</button>
                </>
              )}
              <button type="button" className="tm-btn tm-btn--sm" onClick={openPicker}>
                {currentReceiptBase64 ? "다시 올리기" : "영수증 올리기"}
              </button>
            </div>
            {currentReceiptBase64 && (
              <div className="ws-expm__preview">
                <img alt="영수증 미리보기" src={resolveReceiptSrc(currentReceiptBase64)} />
              </div>
            )}

            <div className="ws-when ws-when--2 ws-expm__row">
              <div className="ws-when__cell">
                <label className="ws-when__l" htmlFor="ws-ex-d">날짜 {star}</label>
                <input
                  id="ws-ex-d"
                  className={`tm-input ws-when__in${dateError ? " tm-input--error" : ""}`}
                  type="date"
                  value={date}
                  min="1900-01-01"
                  max="9999-12-31"
                  onChange={(e) => {
                    setSubmitted(false);
                    setDate(e.target.value);
                  }}
                />
                {dateError && <div className="tm-field__error">날짜를 입력해주세요.</div>}
              </div>
              <div className="ws-when__cell">
                <label className="ws-when__l" htmlFor="ws-ex-a">금액 {star}</label>
                <input
                  id="ws-ex-a"
                  className={`tm-input ws-when__in${amountError ? " tm-input--error" : ""}`}
                  type="text"
                  inputMode="numeric"
                  value={amountError ? "" : costText}
                  placeholder={amountError ? "금액은 0원보다 커야 해요." : "금액 입력"}
                  onChange={(e) => {
                    setSubmitted(false);
                    handleCostInput(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="ws-when ws-when--2 ws-expm__row">
              <div className="ws-when__cell">
                <label className="ws-when__l" htmlFor="ws-ex-t">항목 {star}</label>
                <input
                  id="ws-ex-t"
                  className={`tm-input ws-when__in${titleError ? " tm-input--error" : ""}`}
                  type="text"
                  value={titleError ? "" : title}
                  placeholder={titleError ? "항목을 입력해주세요." : "예: 점심"}
                  onChange={(e) => {
                    setSubmitted(false);
                    setTitle(e.target.value);
                  }}
                />
              </div>
              <div className="ws-when__cell">
                <label className="ws-when__l" htmlFor="ws-ex-s">상호명 {star}</label>
                <input
                  id="ws-ex-s"
                  className={`tm-input ws-when__in${storeNameError ? " tm-input--error" : ""}`}
                  type="text"
                  value={storeNameError ? "" : storeName}
                  placeholder={storeNameError ? "상호명을 입력해주세요." : "예: 타코야키 와나카"}
                  onChange={(e) => {
                    setSubmitted(false);
                    setStoreName(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="ws-fld">
              <label className="ws-when__l" htmlFor="ws-ex-p">결제자 {star}</label>
              <select
                id="ws-ex-p"
                className={`tm-select${payerError ? " tm-input--error" : ""}`}
                value={payer}
                onChange={(e) => handlePayerChange(e.target.value as ExpenseMember)}
              >
                {expenseMembers.map((member) => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
              {payerError && <div className="tm-field__error">결제자를 선택해주세요.</div>}
              <label className="tm-check ws-expm__auto">
                <input
                  type="checkbox"
                  checked={autoIncludePayer}
                  onChange={(e) => setAutoIncludePayer(e.target.checked)}
                />
                <span>결제자를 참여자에 자동 포함</span>
              </label>
            </div>

            <div className="ws-fld">
              <span className="ws-when__l">참여자 {star}</span>
              <div className="tm-row ws-expm__joined">
                {expenseMembers.map((member) => (
                  <label key={member} className="tm-check">
                    <input
                      type="checkbox"
                      checked={involved.includes(member)}
                      onChange={() => toggleInvolved(member)}
                    />
                    <span>{member}</span>
                  </label>
                ))}
              </div>
              {involvedError && <div className="tm-field__error">참여자를 선택해주세요.</div>}
            </div>

            <div className="ws-fld">
              <span className="ws-when__l">지출 유형 {star}</span>
              <div className="tm-seg ws-aiseg" role="group" aria-label="지출 유형">
                <button
                  type="button"
                  className={expenseKind === "SHARED" ? "is-on" : ""}
                  aria-pressed={expenseKind === "SHARED"}
                  onClick={() => setExpenseKind("SHARED")}
                >
                  공동 지출
                </button>
                <button
                  type="button"
                  className={expenseKind === "PERSONAL" ? "is-on" : ""}
                  aria-pressed={expenseKind === "PERSONAL"}
                  onClick={() => setExpenseKind("PERSONAL")}
                >
                  개인 지출
                </button>
              </div>
              {submitted && !expenseKind && <div className="tm-field__error">지출 유형을 선택해주세요.</div>}
              {kindWarningMessage && <p className="ws-aidesc ws-expm__warn">{kindWarningMessage}</p>}
            </div>

            {/* 금액을 직접 나눌 때는 접지 않고 바로 보이게 */}
            {splitMode === "AMOUNT" && (
              <div className="ws-fld">
                <span className="ws-when__l">금액 지정 — 참여자별 부담액</span>
                <div className="ws-sett">
                  {participants.map((p) => (
                    <div key={p.member} className="ws-airow ws-airow--split">
                      <b>
                        {p.member}
                        {p.member === payer && <span className="tm-tag ws-expm__payer">결제자</span>}
                      </b>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="tm-input ws-when__in"
                        aria-label={`${p.member} 부담액`}
                        value={fmt(splitAmounts[p.member] ?? 0)}
                        onChange={(e) => handleAmountInput(p.member, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="tm-kv"><span>총액</span><b>{fmt(total)}원</b></div>
                <div className="tm-kv"><span>분할 합계</span><b>{fmt(splitSum)}원</b></div>
                <div className="tm-kv">
                  <span>차이</span>
                  <b className={diff === 0 ? "ws-pos" : "ws-neg"}>
                    {diff >= 0 ? fmt(diff) : `-${fmt(Math.abs(diff))}`}원
                  </b>
                </div>
                {splitError && <div className="tm-field__error">분할 합계가 총액과 같아야 해요.</div>}
              </div>
            )}

            <button
              type="button"
              className="ws-morebar"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
            >
              <b>자세한 설정</b>
              <span className="tm-hint tm-ellipsis">{moreOpen ? "접기 ▴" : `${moreSummary} ▾`}</span>
            </button>

            {moreOpen && (
              <div className="ws-aimore">
                <div className="ws-fld">
                  <label className="ws-when__l" htmlFor="ws-ex-cat">카테고리</label>
                  <select id="ws-ex-cat" className="tm-select" value={cat} onChange={(e) => setCat(e.target.value)}>
                    {Object.keys(CAT_NAME).map((k) => (
                      <option key={k} value={k}>{CAT_NAME[k]}</option>
                    ))}
                  </select>
                </div>

                <div className="ws-fld">
                  <span className="ws-when__l">결제 수단</span>
                  <div className="tm-seg ws-aiseg" role="group" aria-label="결제 수단">
                    {Object.keys(METHOD_NAME).map((k) => (
                      <button
                        key={k}
                        type="button"
                        className={method === k ? "is-on" : ""}
                        aria-pressed={method === k}
                        onClick={() => setMethod(k)}
                      >
                        {METHOD_NAME[k]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ws-fld">
                  <span className="ws-when__l">분할 방식</span>
                  <div className="tm-seg ws-aiseg" role="group" aria-label="분할 방식">
                    <button
                      type="button"
                      className={splitMode === "EQUAL" ? "is-on" : ""}
                      aria-pressed={splitMode === "EQUAL"}
                      onClick={() => setSplitMode("EQUAL")}
                    >
                      균등
                    </button>
                    <button
                      type="button"
                      className={splitMode === "AMOUNT" ? "is-on" : ""}
                      aria-pressed={splitMode === "AMOUNT"}
                      onClick={() => setSplitMode("AMOUNT")}
                    >
                      금액 지정
                    </button>
                  </div>
                  {splitMode === "EQUAL" && participants.length > 0 && (
                    <p className="ws-aidesc ws-expm__warn">
                      {participants.map((p) => `${p.member} ${fmt(p.amount)}원`).join(" · ")}
                    </p>
                  )}
                </div>

                {scheduleItemOptions.length > 0 && (
                  <div className="ws-fld">
                    <label className="ws-when__l" htmlFor="ws-ex-link">연결할 일정</label>
                    <select
                      id="ws-ex-link"
                      className="tm-select"
                      value={scheduleItemId ?? ""}
                      onChange={(e) => setScheduleItemId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">연결 안 함</option>
                      {Object.entries(groupedScheduleItemsByDay).map(([day, items]) => (
                        <optgroup key={day} label={day}>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.time} · {item.title}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="tm-modal__foot">
            {editingId && (
              <button type="button" className="tm-btn tm-btn--danger tm-mr-auto" onClick={handleDelete}>삭제</button>
            )}
            <button type="button" className="tm-btn" onClick={closeExpenseModal}>취소</button>
            <button type="button" className="tm-btn tm-btn--primary" onClick={handleSave}>
              {editingId ? "수정 저장" : "저장"}
            </button>
          </div>
        </div>
      </div>

      <WsConfirm
        open={prompt.open}
        title={prompt.title}
        headline={prompt.headline}
        description={prompt.description}
        hideCancel={prompt.mode === "notice"}
        cancelText="취소"
        confirmText={prompt.confirmText ?? "확인"}
        danger={prompt.danger}
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
