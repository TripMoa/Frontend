// src/features/workspace/components/layout/WorkspaceTripModal.tsx

import React, { useState } from "react";
import BaseModal from "../../../../shared/components/BaseModal";
import "../../styles/modals.css";

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

const WorkspaceTripModal: React.FC<EditTripModalProps> = ({
  init,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<TripData>(init);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert("복귀 날짜는 출발 날짜보다 빠를 수 없습니다! ✈️");
      return;
    }

    onSave(formData);
  };

  const isDateRangeValid =
    !formData.startDate ||
    !formData.endDate ||
    formData.endDate >= formData.startDate;

  return (
    <BaseModal
      open={true}
      title="EDIT TRIP"
      onClose={onClose}
      className="trip-window"
      bodyClassName="edit-trip-modal-body"
    >
      <div className="inp-row">
        <label>여행 제목</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
      </div>

      <div className="inp-row-group">
        <div className="inp-row">
          <label>출발 날짜</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            min="1900-01-01"
            max="9999-12-31"
            onChange={handleChange}
          />
        </div>

        <div className="inp-row">
          <label>복귀 날짜</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            min={formData.startDate || "1900-01-01"}
            max="9999-12-31"
            onChange={handleChange}
          />
        </div>
      </div>

      {!isDateRangeValid && (
        <p className="modal-error">⚠ 복귀 날짜는 출발 날짜 이후여야 합니다.</p>
      )}

      <div className="modal-footer">
        <button
          className="btn-save"
          type="button"
          onClick={handleSave}
          disabled={!isDateRangeValid}
        >
          저장하기
        </button>
      </div>
    </BaseModal>
  );
};

export default WorkspaceTripModal;
