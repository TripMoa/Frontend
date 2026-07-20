import { useState, useEffect, useRef, useCallback } from "react";
import ConfirmModal from "../components/modals/ConfirmModal";
import Editor from "../components/Editor";
import type { EditorHandle } from "../components/Editor";
import { getTravelStyles } from "../../../api/auth.api";
import type { TravelStyleOption } from "../../../types/auth.types";
import "../styles/travelStory.css";
import "../styles/WritePage.css";

interface WritePageProps {
  goBack: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onOpenDraftModal: () => void;
  editingStory?: any;
  currentDraft?: any;
  drafts: any[];
  type?: "FREE" | "REVIEW";
}

// 기간 선택용 커스텀 드롭다운
function CustomSelect({
  value, options, onChange, disabled,
}: {
  value: string; options: string[]; onChange: (val: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className={`custom-select-trigger ${open ? "open" : ""}`}
        onClick={() => { if (disabled) { alert("여행 기간은 여행 일정에서 수정할 수 있습니다."); return; } setOpen(!open); }} style={{ width: "100%" }} 
      >
      
        <span>{value}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="custom-select-dropdown">
          {options.map((opt) => (
            <div
              key={opt}
              className={`custom-select-option ${value === opt ? "selected" : ""}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 커스텀 날짜 선택 달력
function CustomDatePicker({ value, onChange, disabled }: { value: string; onChange: (val: string) => void ; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split("-")[0]) : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split("-")[1]) - 1 : new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  const MONTHS = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1);
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1);
  };
  const handleDayClick = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const displayValue = value
    ? `${value.split("-")[0]}년 ${String(parseInt(value.split("-")[1]))}월 ${String(parseInt(value.split("-")[2]))}일`
    : "날짜 선택...";

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = new Date();

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="form-input custom-date-trigger" onClick={() => { if (disabled) { alert("출발 날짜는 여행 일정에서 수정할 수 있습니다."); return; } setOpen(!open); }} >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{displayValue}</span>
      </button>
      {open && (
        <div className="custom-calendar">
          <div className="custom-calendar-header">
            <button type="button" onClick={handlePrevMonth}>‹</button>
            <span>{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={handleNextMonth}>›</button>
          </div>
          <div className="custom-calendar-grid">
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} className="custom-calendar-weekday">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
              const isSelected = value === `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              return (
                <button
                  key={day} type="button"
                  className={`custom-calendar-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => handleDayClick(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewWritePage({
  goBack,
  onPublish,
  onSaveDraft,
  onOpenDraftModal,
  editingStory,
  currentDraft,
  drafts,
}: WritePageProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [travelStyles, setTravelStyles] = useState<TravelStyleOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [duration, setDuration] = useState(editingStory?.duration || currentDraft?.duration || (window as any).tripDataForReview?.duration || "선택하세요");
 const [departureDate, setDepartureDate] = useState(() => {
  const val = editingStory?.departureDate || 
    currentDraft?.departureDate || 
    (window as any).tripDataForReview?.departureDate || 
    "";
  return val;
});
  const [expenses, setExpenses] = useState({
    transportation: "", accommodation: "", food: "", attraction: "", shopping: "",
  });
  const [isPublic, setIsPublic] = useState(true);

  const editorRef = useRef<EditorHandle>(null);

  // 여행 경비 항목 합산
  const totalExpenses =
    (parseInt(expenses.transportation) || 0) +
    (parseInt(expenses.accommodation) || 0) +
    (parseInt(expenses.food) || 0) +
    (parseInt(expenses.attraction) || 0) +
    (parseInt(expenses.shopping) || 0);

  // 나가기 경고 표시 여부 판단 - 제목/목적지/내용 중 하나라도 있으면 true
  const hasContent = useCallback(() => {
    if (editingStory || currentDraft) return true;
    const titleInput = document.querySelector(".title-input") as HTMLInputElement;
    const destinationInput = document.querySelector(".form-input") as HTMLInputElement;
    const title = titleInput?.value.trim();
    const destination = destinationInput?.value.trim();
    const content = editorRef.current?.getContent()?.trim();
    return !!(title || destination || (content && content !== ""));
  }, [editingStory, currentDraft]);

  // 태그 목록 로드
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await getTravelStyles();
        setTravelStyles(response.data);
      } catch {
        setTravelStyles([
          { id: 1, name: "힐링여행" }, { id: 2, name: "액티비티" },
          { id: 3, name: "맛집탐방" }, { id: 4, name: "문화탐방" },
          { id: 5, name: "쇼핑" }, { id: 6, name: "자연" },
          { id: 7, name: "사진" }, { id: 8, name: "야경" },
          { id: 9, name: "로컬체험" }, { id: 10, name: "카페투어" },
          { id: 11, name: "축제" }, { id: 12, name: "역사탐방" },
          { id: 13, name: "야외활동" }, { id: 14, name: "미식투어" },
          { id: 15, name: "럭셔리" }, { id: 16, name: "배낭여행" },
        ]);
      }
    };
    fetchTags();
  }, []);

  // 브라우저 뒤로가기 감지
  useEffect(() => {
    window.history.pushState({ page: "write" }, "", window.location.href);
    const handlePopState = () => {
      if (hasContent()) {
        window.history.pushState({ page: "write" }, "", window.location.href);
        setShowConfirmModal(true);
      } else {
        goBack();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasContent, goBack]);

  // 수정 모드 진입 시 태그 초기화
  useEffect(() => {
    if (editingStory?.tags && travelStyles.length > 0) {
      const tagNames = editingStory.tags.split(",").map((t: string) => t.trim());
      const tagIds = travelStyles.filter((t) => tagNames.includes(t.name)).map((t) => t.id);
      setSelectedTags(tagIds);
    }
  }, [travelStyles, editingStory]);

  // 수정 모드 진입 시 경비 초기화
  useEffect(() => {
    if (editingStory?.expenses) {
      setExpenses({
        transportation: editingStory.expenses.transportation?.toString() || "",
        accommodation: editingStory.expenses.accommodation?.toString() || "",
        food: editingStory.expenses.food?.toString() || "",
        attraction: editingStory.expenses.attraction?.toString() || "",
        shopping: editingStory.expenses.shopping?.toString() || "",
      });
    }
  }, [editingStory]);

  // 페이지 이탈 시 브라우저 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasContent()) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasContent]);

  // 발행 버튼 클릭 - 유효성 검사 후 publishData 설정 및 onPublish 호출
  const handlePublishClick = () => {
    const titleInput = document.querySelector(".title-input") as HTMLInputElement;
    const destinationInput = document.querySelector(".form-input") as HTMLInputElement;
    const title = titleInput?.value.trim();
    const destination = destinationInput?.value.trim();
    const content = editorRef.current?.getContent()?.trim();
    const coverImage = editorRef.current?.getCoverImage();

    if (!title) { alert("제목을 입력해주세요."); titleInput?.focus(); return; }
    if (!destination) { alert("목적지를 입력해주세요."); destinationInput?.focus(); return; }
    if (!content || content === "<br>") { alert("여행 내용을 작성해주세요."); return; }
    if (!coverImage && !editingStory) { alert("사진을 최소 1장 이상 삽입해주세요."); return; }

    const tagNames = selectedTags
      .map((id) => travelStyles.find((t) => t.id === id)?.name)
      .filter((name) => name)
      .join(",");

    const expensesJson = JSON.stringify({
      transportation: parseInt(expenses.transportation) || 0,
      accommodation: parseInt(expenses.accommodation) || 0,
      food: parseInt(expenses.food) || 0,
      attraction: parseInt(expenses.attraction) || 0,
      shopping: parseInt(expenses.shopping) || 0,
      total: totalExpenses,
    });

    (window as any).selectedCoverImageForPublish = coverImage;
    (window as any).publishData = {
      type: "REVIEW",
      title,
      content,
      destination,
      duration,
      budget: totalExpenses.toString(),
      departureDate,
      tags: tagNames,
      expenses: expensesJson,
      isPublic,
      tripId: (window as any).tripDataForReview?.tripId,
    };

    if (typeof onPublish === "function") {
      onPublish();
    } else {
      alert("발행 기능에 문제가 발생했습니다. 페이지를 새로고침 해주세요.");
    }
  };

  return (
    <div className="detail-page-container">
      <div className="write-page-content">
        <div className="write-header">
          <button
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              if (hasContent()) { setShowConfirmModal(true); } else { goBack(); }
            }}
            className="write-close-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
              style={{ width: "24px", height: "24px", fill: "#000", transition: "fill 0.2s", pointerEvents: "none" }}
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          <h1 className="write-header-title">
            {editingStory ? "EDIT STORY" : "WRITE REVIEW"}
          </h1>

          <div className="write-header-actions">
            <div className="write-draft-btn-wrapper">
              <button onClick={onSaveDraft} className="write-draft-btn">SAVE DRAFT</button>
              <div onClick={onOpenDraftModal} className="write-draft-badge">{drafts.length}</div>
            </div>
            <button onClick={handlePublishClick} className="write-publish-btn">PUBLISH</button>
          </div>
        </div>

        <div className="write-form-container">
          {/* 제목 입력 */}
          <div className="write-title-section">
            <label className="write-label">TITLE *</label>
            <input
              key={`title-${editingStory?.id || "new"}`}
              type="text"
              className="title-input"
              placeholder="여행 제목을 입력하세요."
              defaultValue={editingStory?.title || currentDraft?.title || ""}
              maxLength={15}
            />
          </div>

          {/* 목적지 / 기간 / 출발일 */}
          <div className="write-form-grid">
            <div>
              <label className="write-label">DESTINATION *</label>
              <input
                key={`dest-${editingStory?.id || "new"}`}
                type="text"
                className="form-input"
                placeholder="예: 경주"
                defaultValue={editingStory?.destination || currentDraft?.destination || ""}
              />
            </div>
            <div>
              <label className="write-label">DURATION</label>
              <CustomSelect
                value={duration}
                options={["선택하세요","당일치기","1박 2일","2박 3일","3박 4일","4박 5일","5박 6일","1주일 이상"]}
                onChange={(val) => setDuration(val)} disabled={true}
              />
            </div>
            <div>
              <label className="write-label">DEPARTURE DATE</label>
              <CustomDatePicker 
                value={departureDate} 
                onChange={(val) => setDepartureDate(val)}
                disabled={true}  // ← 이렇게 막으면 클릭해도 달력 안 뜸
              />
            </div>
          </div>

          {/* 경비 입력 */}
          <div className="write-expenses-section">
            <label className="write-label">여행 경비</label>
            <div className="write-expenses-container">
              <div className="write-expenses-grid">
                {[
                  { label: "교통비", key: "transportation" },
                  { label: "숙박비", key: "accommodation" },
                  { label: "식비", key: "food" },
                  { label: "관광/입장료", key: "attraction" },
                  { label: "쇼핑/기타", key: "shopping" },
                ].map(({ label, key }) => (
                  <div key={key} className="write-expense-row">
                    <label className="write-expense-label">{label}</label>
                    <input
                      type="number"
                      value={expenses[key as keyof typeof expenses]}
                      onChange={(e) => setExpenses({ ...expenses, [key]: e.target.value })}
                      placeholder="0"
                      className="write-expense-input"
                    />
                    <span className="write-expense-unit">원</span>
                  </div>
                ))}
              </div>
              <div className="write-expenses-total">
                <span>총 합계</span>
                <span>{totalExpenses.toLocaleString()}원</span>
              </div>
            </div>
          </div>

          {/* 공개 설정 */}
          <div className="write-tags-section">
            <label className="write-label">공개 설정</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className={`style-tag ${isPublic ? "selected" : ""}`}
                onClick={() => setIsPublic(true)}
              >
                공개
              </button>
              <button
                type="button"
                className={`style-tag ${!isPublic ? "selected" : ""}`}
                onClick={() => setIsPublic(false)}
              >
                비공개
              </button>
            </div>
          </div>

          {/* 여행 스타일 태그 선택 */}
          <div className="write-tags-section">
            <label className="write-label">TRAVEL STYLE</label>
            <div className="write-tags-container">
              {travelStyles.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`style-tag ${selectedTags.includes(tag.id) ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedTags((prev) =>
                      prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                    );
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* 에디터 */}
          <Editor
            ref={editorRef}
            editingStory={editingStory}
            currentDraft={currentDraft}
          />
        </div>

        <ConfirmModal
          show={showConfirmModal}
          title="페이지 나가기"
          message={`지금 나가시겠습니까?\n변경사항이 저장되지 않을 수 있습니다.`}
          confirmText="나가기"
          cancelText="취소"
          onConfirm={() => { setShowConfirmModal(false); goBack(); }}
          onCancel={() => setShowConfirmModal(false)}
        />
      </div>
    </div>
  );
}

export default ReviewWritePage;