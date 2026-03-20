import { useState, useEffect, useRef } from 'react';
import { getTags } from '../../../api/travelTags.api';
import type { Tag } from '../../../api/travelTags.api';
import '../styles/travelStory.css';
import '../styles/FilterSection.css';

interface FilterSectionProps {
  filters: {
    searchTerm?: string;
    destination: string;
    duration: string;
    minBudget: string;
    maxBudget: string;
    tags: string[];
  };
  setFilters: (filters: any) => void;
}

// 공통 드롭다운 선택 컴포넌트 (여행 기간, 예산대)
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // '전체' 또는 빈 값이 아닐 때 활성 상태로 표시
  const isActive = value !== '전체' && value !== '';

  return (
    <div className="filter-select-group" ref={ref}>
      <label className="filter-select-label">{label}</label>
      <div className="custom-select-wrapper">
        <button
          type="button"
          className={`custom-select-trigger ${open ? 'open' : ''} ${isActive && !open ? 'active' : ''}`}
          onClick={() => setOpen(!open)}
        >
          <span>{value || '전체'}</span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {open && (
          <div className="custom-select-dropdown">
            {options.map((opt) => (
              <div
                key={opt}
                className={`custom-select-option ${value === opt ? 'selected' : ''}`}
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

function FilterSection({ filters, setFilters }: FilterSectionProps) {
  const [travelStyles, setTravelStyles] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 태그 목록 로드 (실패 시 하드코딩된 기본값으로 fallback)
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoading(true);
        const response = await getTags();
        setTravelStyles(response.data);
      } catch (error) {
        setTravelStyles([
          { id: 1, name: '힐링여행' }, { id: 2, name: '액티비티' },
          { id: 3, name: '맛집탐방' }, { id: 4, name: '문화탐방' },
          { id: 5, name: '쇼핑' },    { id: 6, name: '자연' },
          { id: 7, name: '사진' },    { id: 8, name: '야경' },
          { id: 9, name: '로컬체험' }, { id: 10, name: '카페투어' },
          { id: 11, name: '축제' },   { id: 12, name: '역사탐방' },
          { id: 13, name: '야외활동' }, { id: 14, name: '미식투어' },
          { id: 15, name: '럭셔리' }, { id: 16, name: '배낭여행' }
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

  // 하나 이상의 필터가 적용된 상태인지 확인 (RESET ALL 버튼 표시 여부)
  const hasActiveFilters =
    (filters.destination && filters.destination !== '전체') ||
    (filters.duration && filters.duration !== '전체') ||
    (filters.minBudget && filters.minBudget !== '전체') ||
    filters.tags.length > 0;

  // 모든 필터 초기화
  const resetFilters = () => {
    setFilters({
      ...filters,
      destination: '',
      duration: '',
      minBudget: '',
      maxBudget: '',
      tags: []
    });
  };

  return (
    <div className="filter-section">
      <div className="filter-header">
        <span className="filter-header-title">FILTERS</span>
        {hasActiveFilters && (
          <button className="filter-reset-btn" onClick={resetFilters}>
            [ RESET ALL ]
          </button>
        )}
      </div>

      <div className="filter-selects">

        {/* 여행지 - 텍스트 검색 */}
        <div className="filter-select-group">
          <label className="filter-select-label">여행지</label>
          <div className="filter-search-wrapper">
            <svg
              className="filter-search-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16" height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <input
              type="text"
              className={`filter-search-input ${filters.destination ? 'active' : ''}`}
              placeholder="장소 검색..."
              value={filters.destination}
              onChange={(e) => updateFilter('destination', e.target.value)}
            />
          </div>
        </div>

        <CustomSelect
          label="여행 기간"
          value={filters.duration || '전체'}
          options={['전체', '당일치기', '1박 2일', '2박 3일', '3박 4일', '4박 5일', '5박 6일', '1주일 이상']}
          onChange={(val) => updateFilter('duration', val)}
        />

        <CustomSelect
          label="예산대"
          value={filters.minBudget || '전체'}
          options={['전체', '10만원 이하', '10-30만원', '30-50만원', '50-100만원', '100만원 이상']}
          onChange={(val) => updateFilter('minBudget', val)}
        />
      </div>

      <div className="filter-divider">
        <span className="filter-style-label">TRAVEL STYLE</span>

        {isLoading && <div className="filter-loading">LOADING TAGS...</div>}

        {/* 태그 선택 시 토글 방식으로 filters.tags 배열에 추가/제거 */}
        {!isLoading && (
          <div className="filter-tags-container">
            {travelStyles.map((tag) => {
              const isSelected = filters.tags.includes(tag.name);
              return (
                <button
                  key={tag.id}
                  className={`filter-tag ${isSelected ? 'selected' : ''}`}
                  onClick={() =>
                    updateFilter(
                      'tags',
                      isSelected
                        ? filters.tags.filter(t => t !== tag.name)
                        : [...filters.tags, tag.name]
                    )
                  }
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterSection;