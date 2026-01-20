import type { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";
import "../styles/MateModals.css";
import { TRANSPORT_OPTIONS, TRAVEL_TYPE_OPTIONS, AGE_GROUP_OPTIONS, GENDER_OPTIONS } from "../hooks/mate.constants";

interface MateWriteModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  selectedTransport: string[];
  setSelectedTransport: (value: string[]) => void;
  selectedTravelTypes: string[];
  setSelectedTravelTypes: (value: string[]) => void;
  selectedAgeGroups: string[];
  setSelectedAgeGroups: (value: string[]) => void;
  selectedGender: string;
  setSelectedGender: (value: string) => void;
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
  selectedTravelTypes,
  setSelectedTravelTypes,
  selectedAgeGroups,
  setSelectedAgeGroups,
  selectedGender,
  setSelectedGender,
}: MateWriteModalProps){
  const toggleTransport = (t: string) => {
    setSelectedTransport(selectedTransport.includes(t) ? selectedTransport.filter(x => x !== t) : [...selectedTransport, t]);
  };
  const toggleTravelType = (t: string) => {
    setSelectedTravelTypes(selectedTravelTypes.includes(t) ? selectedTravelTypes.filter(x => x !== t) : [...selectedTravelTypes, t]);
  };
  const toggleAgeGroup = (a: string) => {
    setSelectedAgeGroups(selectedAgeGroups.includes(a) ? selectedAgeGroups.filter(x => x !== a) : [...selectedAgeGroups, a]);
  };

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
            <input name="destination" type="text" required placeholder="여행지를 입력하세요"
              className="w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-mono" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Start Date *</label>
              <DatePicker selected={startDate} onChange={setStartDate} dateFormat="yyyy-MM-dd" placeholderText="출발일"
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" required />
            </div>
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">End Date *</label>
              <DatePicker selected={endDate} onChange={setEndDate} dateFormat="yyyy-MM-dd" placeholderText="도착일"
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" required />
            </div>
          </div>

          {/* Budget & Participants */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Budget</label>
              <input name="budget" type="text" placeholder="$1,000"
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" />
            </div>
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Max Participants</label>
              <input name="participants" type="text" placeholder="1/4"
                className="w-full p-3 border-2 border-black focus:outline-none font-mono" />
            </div>
          </div>

          {/* Transport */}
          <div className="mt-6">
            <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Transport</label>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_OPTIONS.map((t) => (
                <button key={t} type="button" onClick={() => toggleTransport(t)}
                  className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${selectedTransport.includes(t) ? "bgBlack" : "bg-white hover:bg-[#eee]"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Type */}
          <div className="mt-6">
            <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Travel Style</label>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_TYPE_OPTIONS.map((t) => (
                <button key={t} type="button" onClick={() => toggleTravelType(t)}
                  className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${selectedTravelTypes.includes(t) ? "bgBlack" : "bg-white hover:bg-[#eee]"}`}>
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
                  <button key={g} type="button" onClick={() => setSelectedGender(g)}
                    className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${selectedGender === g ? "bgBlack" : "bg-white hover:bg-[#eee]"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Preferred Age</label>
              <div className="flex flex-wrap gap-2">
                {AGE_GROUP_OPTIONS.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAgeGroup(a)}
                    className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${selectedAgeGroups.includes(a) ? "bgBlack" : "bg-white hover:bg-[#eee]"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="text-xs text-black/50 uppercase font-bold mb-2 block">Description</label>
            <textarea name="description" placeholder="여행 계획과 함께하고 싶은 메이트 조건을 적어주세요..."
              className="w-full h-32 p-3 border-2 border-black focus:outline-none resize-none font-mono" />
          </div>

          {/* Submit */}
          <button type="submit"
            className="w-full py-4 font-bold text-lg uppercase tracking-wide transition-colors button bgBlackHoverable mt-6">
            POST TRIP
          </button>
        </form>
      </div>
    </div>
  );
}