import React, { useState } from "react";
import "../../styles/workspace/modals.css";

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

const WorkspaceModals: React.FC<EditTripModalProps> = ({
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

  return (
    <div
      className="modal-overlay active"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-window trip-window"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ✅ 다른 모달들과 동일한 헤더 구조 */}
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; EDIT TRIP</span>
          <button className="mh-close" onClick={onClose}>
            CLOSE [X]
          </button>
        </div>

        {/* ✅ 다른 모달들과 동일하게 inp-row / inp-row-group 사용 */}
        <div
          className="modal-body"
          style={{ padding: "20px", background: "#fff", overflowY: "auto" }}
        >
          <div
            className="modal-body edit-trip-modal-body"
            style={{ background: "#fff" }}
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
                  onChange={handleChange}
                />
              </div>

              <div className="inp-row">
                <label>복귀 날짜</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-save" type="button" onClick={handleSave}>
                저장하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceModals;
