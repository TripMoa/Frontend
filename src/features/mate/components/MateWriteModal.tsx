import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  TRANSPORT_OPTIONS,
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
} from "../hooks/mate.constants";

interface MateWriteModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  selectedTransport: string;
  setSelectedTransport: (value: string) => void;
  selectedAgeGroup: string;
  setSelectedAgeGroup: (value: string) => void;
  selectedGender: string;
  setSelectedGender: (value: string) => void;
  writeError: string | null;
}

export function MateWriteModal({
  onClose,
  onSubmit,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedTransport,
  setSelectedTransport,
  selectedAgeGroup,
  setSelectedAgeGroup,
  selectedGender,
  setSelectedGender,
  writeError,
}: MateWriteModalProps){

  return (
    <div className="tm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form
        className="tm-modal mate-dlg"
        onSubmit={onSubmit}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mate-write-title"
      >
        <div className="tm-modal__head">
          <h3 className="tm-modal__title" id="mate-write-title">모집글 쓰기</h3>
          <button type="button" className="mate-bt mate-bt--sm" onClick={onClose}>닫기</button>
        </div>

        <div className="tm-modal__body">
          <div className="mate-field">
            <label className="mate-lb mate-lb--req" htmlFor="mate-write-destination">여행지</label>
            <input
              id="mate-write-destination"
              name="destination"
              type="text"
              required
              placeholder="여행지를 입력하세요"
              className="tm-input"
            />
          </div>

          <div className="mate-grid2">
            <div className="mate-field">
              <label className="mate-lb mate-lb--req" htmlFor="mate-write-start">출발일</label>
              <DatePicker
                id="mate-write-start"
                selected={startDate}
                onChange={setStartDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="출발일"
                className="tm-input"
                wrapperClassName="mate-date"
                calendarClassName="tm-datepicker"
                popperClassName="tm-datepicker-popper"
                required
              />
            </div>
            <div className="mate-field">
              <label className="mate-lb mate-lb--req" htmlFor="mate-write-end">도착일</label>
              <DatePicker
                id="mate-write-end"
                selected={endDate}
                onChange={setEndDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="도착일"
                minDate={startDate || undefined}
                className="tm-input"
                wrapperClassName="mate-date"
                calendarClassName="tm-datepicker"
                popperClassName="tm-datepicker-popper"
                required
              />
            </div>

            <div className="mate-field">
              <label className="mate-lb mate-lb--req" htmlFor="mate-write-budget">1인 예산</label>
              <div className="mate-money">
                <input
                  id="mate-write-budget"
                  name="budget"
                  type="text"
                  inputMode="numeric"
                  placeholder="1,000,000"
                  required
                  className="tm-input tm-num"
                  onInput={(e) => {
                    const input = e.currentTarget;
                    const value = input.value.replace(/[^\d]/g, '');
                    input.value = value ? parseInt(value).toLocaleString() : '';
                  }}
                />
              </div>
            </div>
            <div className="mate-field">
              <label className="mate-lb mate-lb--req" htmlFor="mate-write-transport">이동수단</label>
              <select
                id="mate-write-transport"
                className="tm-select"
                value={selectedTransport}
                onChange={(e) => setSelectedTransport(e.target.value)}
                required
              >
                <option value="" disabled>선택하세요</option>
                {TRANSPORT_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="mate-field">
              <label className="mate-lb mate-lb--req" htmlFor="mate-write-current">현재 인원 (본인 포함)</label>
              <input
                id="mate-write-current"
                name="currentParticipant"
                type="number"
                min="1"
                placeholder="1"
                defaultValue="1"
                required
                className="tm-input"
              />
            </div>
            <div className="mate-field">
              <label className="mate-lb mate-lb--req" htmlFor="mate-write-max">최대 모집 인원</label>
              <input
                id="mate-write-max"
                name="maxParticipant"
                type="number"
                min="2"
                max="10"
                placeholder="4"
                required
                className="tm-input"
              />
              <p className="mate-hint">2~10명</p>
            </div>

            <div className="mate-field">
              <label className="mate-lb" htmlFor="mate-write-gender">선호 성별</label>
              <select
                id="mate-write-gender"
                className="tm-select"
                value={selectedGender || "무관"}
                onChange={(e) => setSelectedGender(e.target.value)}
              >
                {GENDER_OPTIONS.filter(g => g !== "전체").map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="mate-field">
              <label className="mate-lb" htmlFor="mate-write-age">선호 나이</label>
              <select
                id="mate-write-age"
                className="tm-select"
                value={selectedAgeGroup || "전체"}
                onChange={(e) => setSelectedAgeGroup(e.target.value)}
              >
                {AGE_GROUP_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mate-field">
            <label className="mate-lb mate-lb--req" htmlFor="mate-write-content">설명</label>
            <textarea
              id="mate-write-content"
              name="content"
              placeholder="여행 계획과 함께하고 싶은 메이트 조건을 적어주세요..."
              required
              className="tm-textarea"
              rows={5}
            />
          </div>

          {writeError && (
            <div className="mate-error" role="alert">
              {writeError}
            </div>
          )}
        </div>

        <div className="tm-modal__foot">
          <button type="button" className="mate-bt" onClick={onClose}>취소</button>
          <button type="submit" className="mate-bt mate-bt--r">등록</button>
        </div>
      </form>
    </div>
  );
}
