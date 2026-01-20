import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";
import "../styles/MateFilters.css";
import { MapPin, Calendar, ChevronDown } from "lucide-react";
import { ALL_TAGS, GENDER_OPTIONS, AGE_OPTIONS } from "../hooks/mate.constants";

interface MateFiltersProps {
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  dateFilter: Date | null;
  setDateFilter: (date: Date | null) => void;
  genderFilter: string;
  setGenderFilter: (value: string) => void;
  ageFilter: string;
  setAgeFilter: (value: string) => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  setCurrentPage: (page: number) => void;
}

export function MateFilters({
  locationFilter,
  setLocationFilter,
  dateFilter,
  setDateFilter,
  genderFilter,
  setGenderFilter,
  ageFilter,
  setAgeFilter,
  selectedTags,
  toggleTag,
  setCurrentPage,
}: MateFiltersProps) {
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      if (!target.closest(".dropdown-gender") && !target.closest(".dropdown-age")) {
        setShowGenderDropdown(false);
        setShowAgeDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="filters">
      <div style={{ marginBottom: '20px' }}>
        <span className="filters-label">FILTERS</span>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Location */}
        <div className="relative flex-1 min-w-[180px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
          <input
            type="text"
            placeholder="장소 검색..."
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-3 py-2.5 border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/40 text-sm font-mono"
          />
        </div>

        {/* Date */}
        <div className="relative flex-1 min-w-[180px]">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none z-10" />
          <DatePicker
            selected={dateFilter}
            onChange={(date: Date | null) => {
              setDateFilter(date);
              setCurrentPage(1);
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText="날짜 선택..."
            className="w-full pl-10 pr-3 py-2.5 border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/40 text-sm font-mono"
            isClearable
          />
        </div>

        {/* Gender Dropdown */}
        <div className="relative flex-1 min-w-[140px] dropdown-gender">
          <button
            type="button"
            onClick={() => {
              setShowGenderDropdown(!showGenderDropdown);
              setShowAgeDropdown(false);
            }}
            className={`w-full px-3 py-2.5 border-2 border-black text-left text-sm font-mono font-bold flex items-center justify-between transition-all ${
              genderFilter !== "전체" ? "bgActive" : "bg-white text-black hover:bg-[#f5f5f5]"
            }`}
          >
            <span>{genderFilter === "전체" ? "성별" : genderFilter}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showGenderDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {showGenderDropdown && (
            <div className={`absolute top-full left-0 right-0 mt-1 bg-white z-50 overflow-hidden dropdown`}>
              {GENDER_OPTIONS.map((option, idx) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setGenderFilter(option);
                    setShowGenderDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-mono font-bold transition-colors ${
                    idx !== GENDER_OPTIONS.length - 1 ? "border-b border-black/10" : ""
                  } ${genderFilter === option ? "bgActive" : "bg-white text-black hover:bg-[#eee]"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Age Dropdown */}
        <div className="relative flex-1 min-w-[140px] dropdown-age">
          <button
            type="button"
            onClick={() => {
              setShowAgeDropdown(!showAgeDropdown);
              setShowGenderDropdown(false);
            }}
            className={`w-full px-3 py-2.5 border-2 border-black text-left text-sm font-mono font-bold flex items-center justify-between transition-all ${
              ageFilter !== "전체" ? "bgActive" : "bg-white text-black hover:bg-[#f5f5f5]"
            }`}
          >
            <span>{ageFilter === "전체" ? "나이" : ageFilter}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showAgeDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {showAgeDropdown && (
            <div className={`absolute top-full left-0 right-0 mt-1 bg-white z-50 overflow-hidden dropdown`}>
              {AGE_OPTIONS.map((option, idx) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setAgeFilter(option);
                    setShowAgeDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-mono font-bold transition-colors ${
                    idx !== AGE_OPTIONS.length - 1 ? "border-b border-black/10" : ""
                  } ${ageFilter === option ? "bgActive" : "bg-white text-black hover:bg-[#eee]"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t-2 border-dashed border-black/20 my-4"></div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-black/50 uppercase mr-1">TAGS</span>
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1.5 border-2 border-black text-xs transition-all font-bold ${
              selectedTags.includes(tag)
                ? "bgActive tagActive"
                : "bg-white text-black hover:bg-[#f5f5f5]"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}