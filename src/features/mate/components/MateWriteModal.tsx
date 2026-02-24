import type { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";
import "../styles/MateModals.css";
import { 
  TRANSPORT_OPTIONS, 
  AGE_GROUP_OPTIONS, 
  GENDER_OPTIONS,
  TRANSPORT_MAP,
  GENDER_PREFERENCE_MAP,
  AGE_GROUP_MAP
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
    <div className="modal-overlay active" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-window write-window" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; NEW TRIP POST</span>
          <button className="mh-close" onClick={onClose}>CLOSE [X]</button>
        </div>

        <form onSubmit={onSubmit} className="modal-body" style={{ background: "white", padding: "32px" }}>
          {/* Destination */}
          <div>
            <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Destination *</label>
            <input 
              name="destination" 
              type="text" 
              required 
              placeholder="여행지를 입력하세요"
              className="w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-mono" 
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Start Date *</label>
              <DatePicker 
                selected={startDate} 
                onChange={setStartDate} 
                dateFormat="yyyy-MM-dd" 
                placeholderText="출발일"
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" 
                required 
              />
            </div>
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">End Date *</label>
              <DatePicker 
                selected={endDate} 
                onChange={setEndDate} 
                dateFormat="yyyy-MM-dd" 
                placeholderText="도착일"
                minDate={startDate || undefined}
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" 
                required 
              />
            </div>
          </div>

          {/* Budget */}
          <div className="mt-6">
            <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Budget *</label>
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-black">₩</span>
              <input 
                name="budget" 
                type="text" 
                placeholder="1000000"
                required
                className="w-full p-3 pl-8 border-2 border-black focus:outline-none font-mono"
                onInput={(e) => {
                  const input = e.currentTarget;
                  const value = input.value.replace(/[^\d]/g, '');
                  input.value = value ? parseInt(value).toLocaleString() : '';
                }}
              />
            </div>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Current Participants *</label>
              <input 
                name="currentParticipant" 
                type="number" 
                min="1" 
                placeholder="1" 
                defaultValue="1" 
                required
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" 
              />
              <p className="text-xs text-black/50 mt-1">현재 인원 (본인 포함)</p>
            </div>
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Max Participants *</label>
              <input 
                name="maxParticipant" 
                type="number" 
                min="2" 
                max="10"
                placeholder="4" 
                required
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" 
              />
              <p className="text-xs text-black/50 mt-1">최대 모집 인원</p>
            </div>
          </div>

          {/* Transport - 단일 선택으로 변경 */}
          <div className="mt-6">
            <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Transport *</label>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_OPTIONS.map((t) => (
                <button 
                  key={t} 
                  type="button" 
                  onClick={() => setSelectedTransport(t)}
                  className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${
                    selectedTransport === t ? "bgBlack" : "bg-white hover:bg-[#eee]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Preferred Gender</label>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.filter(g => g !== "전체").map((g) => (
                  <button 
                    key={g} 
                    type="button" 
                    onClick={() => setSelectedGender(g)}
                    className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${
                      selectedGender === g ? "bgBlack" : "bg-white hover:bg-[#eee]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Preferred Age</label>
              <div className="flex flex-wrap gap-2">
                {AGE_GROUP_OPTIONS.map((a) => (
                  <button 
                    key={a} 
                    type="button" 
                    onClick={() => setSelectedAgeGroup(a)}
                    className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${
                      selectedAgeGroup === a ? "bgBlack" : "bg-white hover:bg-[#eee]"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Description *</label>
            <textarea 
              name="content" 
              placeholder="여행 계획과 함께하고 싶은 메이트 조건을 적어주세요..."
              required
              className="w-full h-32 p-3 border-2 border-black focus:outline-none resize-none font-mono" 
            />
          </div>

          {/* Error */}
          {writeError && (
            <div className="mt-6 p-4 border-2 border-red-600 bg-red-50 text-red-600 font-mono text-sm font-bold flex items-center gap-2 animate-shake">
              <span className="text-lg">⚠</span>
              <span>ERROR: {writeError}</span>
            </div>
          )}

          {/* Submit */}
          <button 
            type="submit"
            className="w-full py-4 font-bold text-lg uppercase tracking-wide transition-colors button bgBlackHoverable mt-6"
          >
            POST TRIP
          </button>
        </form>
      </div>
    </div>
  );
}