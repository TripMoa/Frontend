interface FilterSectionProps {
  filters: {
    destination: string;
    duration: string;
    budget: string;
    style: string;
  };
  setFilters: (filters: any) => void;
}

function FilterSection({ filters, setFilters }: FilterSectionProps) {
  return (
    <div style={{
      background: '#fff',
      padding: '24px',
      marginBottom: '32px',
      border: '3px solid #000',
      boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px'
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: 'rgba(0,0,0,0.5)',
          textTransform: 'uppercase',
          fontFamily: "'Share Tech Mono', monospace",
          letterSpacing: '1px'
        }}>
          FILTERS
        </span>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* 여행지 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'rgba(0,0,0,0.6)',
            textTransform: 'uppercase',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '0.5px'
          }}>
            여행지
          </label>
          <select 
            value={filters.destination}
            onChange={(e) => setFilters({...filters, destination: e.target.value})}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '2px solid #000',
              background: '#fff',
              fontSize: '13px',
              fontFamily: "'Share Tech Mono', monospace",
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option>전체</option>
            <option>서울</option>
            <option>부산</option>
            <option>제주</option>
            <option>강릉</option>
            <option>경주</option>
            <option>전주</option>
            <option>여수</option>
          </select>
        </div>

        {/* 여행 기간 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'rgba(0,0,0,0.6)',
            textTransform: 'uppercase',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '0.5px'
          }}>
            여행 기간
          </label>
          <select 
            value={filters.duration}
            onChange={(e) => setFilters({...filters, duration: e.target.value})}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '2px solid #000',
              background: '#fff',
              fontSize: '13px',
              fontFamily: "'Share Tech Mono', monospace",
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option>전체</option>
            <option>당일치기</option>
            <option>1박 2일</option>
            <option>2박 3일</option>
            <option>3박 4일</option>
            <option>4박 5일</option>
            <option>5박 6일</option>
            <option>1주일 이상</option>
          </select>
        </div>

        {/* 예산대 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'rgba(0,0,0,0.6)',
            textTransform: 'uppercase',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '0.5px'
          }}>
            예산대
          </label>
          <select 
            value={filters.budget}
            onChange={(e) => setFilters({...filters, budget: e.target.value})}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '2px solid #000',
              background: '#fff',
              fontSize: '13px',
              fontFamily: "'Share Tech Mono', monospace",
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option>전체</option>
            <option>10만원 이하</option>
            <option>10-30만원</option>
            <option>30-50만원</option>
            <option>50-100만원</option>
            <option>100만원 이상</option>
          </select>
        </div>

        {/* 여행 스타일 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'rgba(0,0,0,0.6)',
            textTransform: 'uppercase',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '0.5px'
          }}>
            여행 스타일
          </label>
          <select 
            value={filters.style}
            onChange={(e) => setFilters({...filters, style: e.target.value})}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '2px solid #000',
              background: '#fff',
              fontSize: '13px',
              fontFamily: "'Share Tech Mono', monospace",
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option>전체</option>
            <option>힐링여행</option>
            <option>액티비티</option>
            <option>맛집투어</option>
            <option>문화탐방</option>
            <option>쇼핑</option>
            <option>사진명소</option>
            <option>가성비</option>
            <option>럭셔리</option>
          </select>
        </div>
      </div>

      <div style={{
        borderTop: '2px dashed rgba(0,0,0,0.2)',
        marginTop: '16px',
        paddingTop: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '1px',
            marginRight: '4px'
          }}>
            TAGS
          </span>
          {['힐링여행', '액티비티', '맛집투어', '문화탐방', '쇼핑', '사진명소', '가성비', '럭셔리'].map((tag) => {
            const isSelected = filters.style === tag;
            return (
              <button 
                key={tag} 
                onClick={() => setFilters({...filters, style: isSelected ? '전체' : tag})}
                style={{
                  padding: '6px 12px',
                  border: '2px solid #000',
                  background: isSelected ? '#000' : '#fff',
                  color: isSelected ? '#fff' : '#000',
                  fontSize: '11px',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '2px 2px 0px rgba(0,0,0,1)' : 'none',
                  transform: isSelected ? 'translate(-1px, -1px)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#fff';
                  }
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FilterSection;