// src/features/workspace/components/layout/WorkspaceTripModal.tsx
// "여행 수정" 창 — 디자인 기준(시안): 좁은 모달 · 제목 · 출발/복귀 날짜 · [취소][저장].
import React, { useState } from "react";

export interface TripData {
  title: string;
  startDate: string;
  endDate: string;
}

interface EditTripModalProps {
  init: TripData;
  onClose: () => void;
  onSave: (data: TripData) => void;
}

const WorkspaceTripModal: React.FC<EditTripModalProps> = ({ init, onClose, onSave }) => {
  const [formData, setFormData] = useState<TripData>(init);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isDateRangeValid =
    !formData.startDate || !formData.endDate || formData.endDate >= formData.startDate;

  const handleSave = () => {
    if (!isDateRangeValid) return;
    onSave(formData);
  };

  return (
    <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="tm-modal tm-modal--narrow"
        role="dialog"
        aria-modal="true"
        aria-label="여행 수정"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tm-modal__head">
          <h3 className="tm-modal__title">여행 수정</h3>
          <button type="button" className="tm-btn tm-btn--sm" onClick={onClose}>닫기</button>
        </div>

        <div className="tm-modal__body">
          <div className="ws-fld">
            <label className="ws-when__l" htmlFor="ws-trip-title">여행 제목</label>
            <input
              id="ws-trip-title"
              type="text"
              className="tm-input"
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="ws-when ws-when--2 ws-trip__dates">
            <div className="ws-when__cell">
              <label className="ws-when__l" htmlFor="ws-trip-start">출발 날짜</label>
              <input
                id="ws-trip-start"
                type="date"
                className="tm-input ws-when__in"
                name="startDate"
                value={formData.startDate}
                min="1900-01-01"
                max="9999-12-31"
                onChange={handleChange}
              />
            </div>
            <div className="ws-when__cell">
              <label className="ws-when__l" htmlFor="ws-trip-end">복귀 날짜</label>
              <input
                id="ws-trip-end"
                type="date"
                className={`tm-input ws-when__in${isDateRangeValid ? "" : " tm-input--error"}`}
                name="endDate"
                value={formData.endDate}
                min={formData.startDate || "1900-01-01"}
                max="9999-12-31"
                onChange={handleChange}
              />
            </div>
          </div>

          {!isDateRangeValid && (
            <p className="ws-aidesc ws-trip__err" role="alert">복귀 날짜는 출발 날짜 이후여야 합니다.</p>
          )}
        </div>

        <div className="tm-modal__foot">
          <button type="button" className="tm-btn" onClick={onClose}>취소</button>
          <button type="button" className="tm-btn tm-btn--primary" onClick={handleSave} disabled={!isDateRangeValid}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceTripModal;
