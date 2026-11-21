import { useState, useEffect, useRef } from "react";
import { getTravelStyles } from "../../../api/auth.api";
import type { TravelStyleOption } from "../../../types/auth.types";
import "../styles/travelStory.css";
import "../styles/FilterSection.css";

interface FilterSectionProps {
  filters: {
    searchTerm?: string;
    destination: string;
    duration: string;
    minBudget: string;
    maxBudget: string;
    tags: number[];
  };
  setFilters: (filters: any) => void;

  selectedType: "FREE" | "REVIEW" | "ALL";
  setSelectedType: React.Dispatch<
    React.SetStateAction<"FREE" | "REVIEW" | "ALL">
  >;

  tags: TravelStyleOption[];
}

// 공통 드롭다운 선택 컴포넌트
function CustomSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = value !== "전체" && value !== "";

  return (
    <div className="tm-field filter-select-group" ref={ref}>
      <label className="tm-label filter-select-label">{label}</label>
      <div className="custom-select-wrapper">
        <button
          type="button"
          className={`custom-select-trigger ${open ? "open" : ""} ${isActive && !open ? "active" : ""}`}
          onClick={() => setOpen(!open)}
        >
          <span>{value || "전체"}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <div className="custom-select-dropdown">
            {options.map((opt) => (
              <div
                key={opt}
                className={`custom-select-option ${value === opt ? "selected" : ""}`}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSection({ filters, setFilters, selectedType, setSelectedType }: FilterSectionProps) {
  const [travelStyles, setTravelStyles] = useState<TravelStyleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 태그 목록 로드
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoading(true);
        const response = await getTravelStyles();
        setTravelStyles(response.data);
      } catch (error) {
        setTravelStyles([
          { id: 1, name: "힐링여행" },
          { id: 2, name: "액티비티" },
          { id: 3, name: "맛집탐방" },
          { id: 4, name: "문화탐방" },
          { id: 5, name: "쇼핑" },
          { id: 6, name: "자연" },
          { id: 7, name: "사진" },
          { id: 8, name: "야경" },
          { id: 9, name: "로컬체험" },
          { id: 10, name: "카페투어" },
          { id: 11, name: "축제" },
          { id: 12, name: "역사탐방" },
          { id: 13, name: "야외활동" },
          { id: 14, name: "미식투어" },
          { id: 15, name: "럭셔리" },
          { id: 16, name: "배낭여행" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTags();
  }, []);

  // 특정 필터 항목만 업데이트
  const updateFilter = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    (filters.destination && filters.destination !== "전체") ||
    (filters.duration && filters.duration !== "전체") ||
    (filters.minBudget && filters.minBudget !== "전체") ||
    filters.tags.length > 0;

  // 모든 필터 초기화
  const resetFilters = () => {
    setFilters({
      ...filters,
      destination: "",
      duration: "",
      minBudget: "",
      maxBudget: "",
      tags: [],
    });
  };

  const noTagSelected = filters.tags.length === 0;

  return (
    <section className="tm-filter-panel filter-section">
      <div className="filter-selects">
        <div className="tm-field filter-select-group">
          <label className="tm-label filter-select-label">여행지</label>
          <input
            type="text"
            className={`tm-input filter-search-input ${filters.destination ? "active" : ""}`}
            placeholder="장소 검색..."
            value={filters.destination}
            onChange={(e) => updateFilter("destination", e.target.value)}
          />
        </div>

        <CustomSelect
          label="여행 기간"
          value={filters.duration || "전체"}
          options={[
            "전체",
            "당일치기",
            "1박 2일",
            "2박 3일",
            "3박 4일",
            "4박 5일",
            "5박 6일",
            "1주일 이상",
          ]}
          onChange={(val) => updateFilter("duration", val)}
        />

        <CustomSelect
          label="예산대"
          value={filters.minBudget || "전체"}
          options={[
            "전체",
            "10만원 이하",
            "10-30만원",
            "30-50만원",
            "50-100만원",
            "100만원 이상",
          ]}
          onChange={(val) => updateFilter("minBudget", val)}
        />
      </div>

      {/* TRAVEL STYLE */}
      <div className="filter-divider">
        <b className="tm-toolbar__label filter-style-label">TRAVEL STYLE</b>

        {isLoading && <span className="filter-loading">LOADING TAGS...</span>}

        {!isLoading && (
          <>
            <button
              type="button"
              className={`tm-pill ${noTagSelected ? "is-on" : ""}`}
              onClick={() => updateFilter("tags", [])}
            >
              전체
            </button>
            {travelStyles.map((tag) => {
              const isSelected = filters.tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`tm-pill ${isSelected ? "is-on" : ""}`}
                  onClick={() =>
                    updateFilter(
                      "tags",
                      isSelected
                        ? filters.tags.filter((t) => t !== tag.id)
                        : [...filters.tags, tag.id],
                    )
                  }
                >
                  {tag.name}
                </button>
              );
            })}
          </>
        )}

        <button
          type="button"
          className="tm-btn tm-btn--sm"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
        >
          모든 필터 초기화
        </button>
      </div>
    </section>
  );
}

export default FilterSection;
