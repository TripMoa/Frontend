import { useState, useEffect, type ReactNode } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { GENDER_OPTIONS, AGE_GROUP_OPTIONS } from "../hooks/mate.constants";
import { getTravelStyles } from "../../../api/auth.api";

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
  actions?: ReactNode;
}

const GENDER_FILTER_OPTIONS = ["전체", ...GENDER_OPTIONS.filter((g) => g !== "전체")];

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
  actions,
}: MateFiltersProps) {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    getTravelStyles()
      .then((res) => setTags(res.data.map((s) => s.name)))
      .catch(() => setTags([]));
  }, []);

  return (
    <>
      <div className="mate-fb">
        <div className="mate-field">
          <label className="mate-lb" htmlFor="mate-filter-location">장소</label>
          <input
            id="mate-filter-location"
            type="text"
            className="tm-input"
            placeholder="장소 검색..."
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="mate-field">
          <label className="mate-lb" htmlFor="mate-filter-date">날짜</label>
          <DatePicker
            id="mate-filter-date"
            selected={dateFilter}
            onChange={(date: Date | null) => {
              setDateFilter(date);
              setCurrentPage(1);
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText="날짜 선택..."
            className="tm-input"
            wrapperClassName="mate-date"
            calendarClassName="tm-datepicker"
            popperClassName="tm-datepicker-popper"
            isClearable
          />
        </div>

        <div className="mate-field">
          <label className="mate-lb" htmlFor="mate-filter-gender">성별</label>
          <select
            id="mate-filter-gender"
            className="tm-select"
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {GENDER_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="mate-field">
          <label className="mate-lb" htmlFor="mate-filter-age">나이</label>
          <select
            id="mate-filter-age"
            className="tm-select"
            value={ageFilter}
            onChange={(e) => {
              setAgeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {AGE_GROUP_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {actions && <div className="mate-fb__actions">{actions}</div>}
      </div>

      {tags.length > 0 && (
        <div className="mate-tags">
          <b className="mate-tabs2__label">TAGS</b>
          <button
            type="button"
            onClick={() => selectedTags.forEach((t) => toggleTag(t))}
            className={`mate-chip ${selectedTags.length === 0 ? "is-on" : ""}`}
            aria-pressed={selectedTags.length === 0}
          >
            전체
          </button>
          {tags.map((tag) => {
            const isOn = selectedTags?.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`mate-chip ${isOn ? "is-on" : ""}`}
                aria-pressed={isOn}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
