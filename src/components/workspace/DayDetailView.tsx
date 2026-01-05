import React, { useMemo, useState } from "react";
import PlaceDetailModal from "./PlaceDetailModal";

interface PlaceInfo {
  name: string;
  time?: string;
  imageUrl?: string;
  address?: string;
  rating?: number;
  category?: string;
  description?: string;
  memo?: string;
}

interface TimelineNode {
  time: string;
  title: string;
  desc: string;
  placeInfo?: PlaceInfo;
}

interface DayDetailViewProps {
  dayTitle: string;
  tripTitle: string;
  startDate: string;
  endDate: string;
  nodes: TimelineNode[];
  addNode: () => void;
  updateNode: (idx: number, field: string, value: string) => void;
  rightOpen?: boolean;
  setRightOpen?: (open: boolean) => void;
}

const DayDetailView: React.FC<DayDetailViewProps> = ({
  dayTitle,
  tripTitle,
  startDate,
  endDate,
  nodes,
  addNode,
  updateNode,
  rightOpen,
  setRightOpen,
}) => {
  const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null>(null);

  // DAY 1, DAY 2 등에서 숫자 추출하여 해당 날짜 계산
  const currentDate = useMemo(() => {
    const dayMatch = dayTitle.match(/DAY\s*(\d+)/i);
    if (!dayMatch) return startDate;
    
    const dayNumber = parseInt(dayMatch[1], 10);
    const start = new Date(startDate);
    
    // dayNumber - 1일을 더함 (DAY 1 = 첫날, DAY 2 = 둘째날)
    start.setDate(start.getDate() + (dayNumber - 1));
    
    return start.toISOString().split('T')[0];
  }, [dayTitle, startDate]);

  // 노드 클릭 핸들러
  const handleNodeClick = (node: TimelineNode) => {
    if (node.placeInfo) {
      setSelectedPlace({
        ...node.placeInfo,
        time: node.time,
      });
    }
  };

  return (
    <div>
      {/* 헤더 영역 */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "10px" 
      }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
          {dayTitle}
        </h2>

        {/* 오른쪽 사이드바 토글 버튼 */}
        {setRightOpen && (
          <button
            onClick={() => setRightOpen(!rightOpen)}
            style={{
              padding: "8px 16px",
              background: rightOpen ? "#000" : "#fff",
              color: rightOpen ? "#fff" : "#000",
              border: "2px solid #000",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!rightOpen) {
                e.currentTarget.style.background = "#f0f0f0";
              }
            }}
            onMouseLeave={(e) => {
              if (!rightOpen) {
                e.currentTarget.style.background = "#fff";
              }
            }}
          >
            {/* {rightOpen ? "🗂️ 사이드바 닫기" : "🗂️ 사이드바 열기"} */}
            {rightOpen ? "🗺️ 지도 · 체크리스트 닫기" : "🗺️ 지도 · 체크리스트 열기"}

          </button>
        )}
      </div>

      <p
        style={{
          color: "#666",
          marginBottom: "30px",
          fontFamily: "var(--font-mono)",
        }}
      >
        {currentDate}
      </p>

      <div className="timeline">
        {nodes.map((n, idx) => (
          <div className="tl-item" key={idx}>
            <div className="tl-dot"></div>

            <div className="tl-time">
              {n.time}
            </div>

            <div 
              className="tl-box"
              onClick={() => handleNodeClick(n)}
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(5px)";
                e.currentTarget.style.boxShadow = "4px 4px 0px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                {n.title}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "#555",
                  marginTop: "5px",
                }}
              >
                {n.desc}
              </div>
            </div>
          </div>
        ))}

        <button
          style={{
            width: "100%",
            border: "2px dashed #ccc",
            padding: "15px",
            fontWeight: "bold",
            color: "#999",
            cursor: "pointer",
            background: "transparent",
          }}
          onClick={addNode}
        >
          + ADD NODE
        </button>
      </div>

      {/* 장소 상세 정보 모달 */}
      {selectedPlace && (
        <PlaceDetailModal
          placeInfo={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
};

export default DayDetailView;