// 후기 상세 - 계획한 동선 (DAY별 탭, route 없으면 숨김)
import { useState } from "react";
import { parseRoute } from "../../../api/stories.api";
import "../styles/DetailPage.css";

interface RouteSectionProps {
  route?: string | null;
}

// 카테고리별 왼쪽 색 띠 (계획 페이지 색상과 맞춤)
const getCategoryColor = (category?: string | null) => {
  const c = category || "";
  if (c.includes("관광")) return "#2f6fdf";
  if (c.includes("카페")) return "#f2a516";
  if (c.includes("맛집") || c.includes("음식")) return "#e2552b";
  if (c.includes("숙소")) return "#7b5cd6";
  if (c.includes("쇼핑")) return "#2e9e5b";
  if (c.includes("교통")) return "#888888";
  return "#000000";
};

function RouteSection({ route }: RouteSectionProps) {
  const days = parseRoute(route);
  // 선택한 DAY 번호 (null이면 첫째 날)
  const [activeDay, setActiveDay] = useState<number | null>(null);

  if (days.length === 0) return null;

  // 선택한 날이 없으면 첫째 날
  const currentDay = days.some((d) => d.day === activeDay) ? (activeDay as number) : days[0].day;

  // 현재 DAY의 장소 목록
  const rows = days.find((d) => d.day === currentDay)?.items || [];

  return (
    <div className="detail-route">
      <h2 className="detail-route-title">계획한 동선</h2>

      {/* DAY 탭 */}
      <div className="detail-route-tabs">
        {days.map((d) => (
          <button
            key={d.day}
            type="button"
            className={`detail-route-tab ${currentDay === d.day ? "active" : ""}`}
            onClick={() => setActiveDay(d.day)}
          >
            DAY {d.day}
          </button>
        ))}
      </div>

      {/* 장소 목록 */}
      {rows.map((item, idx) => (
        <div key={`${currentDay}-${item.order}-${idx}`}>
          <div
            className="detail-route-row"
            style={{ borderLeftColor: getCategoryColor(item.category) }}
          >
            <span className="detail-route-order">
              {String(item.order).padStart(2, "0")}
            </span>
            {item.time && <span className="detail-route-time">{item.time}</span>}
            <span className="detail-route-name">{item.title}</span>
            {item.category && (
              <span
                className="detail-route-category"
                style={{ color: getCategoryColor(item.category) }}
              >
                {item.category}
              </span>
            )}
          </div>

          {/* 다음 장소까지 이동시간 표시 (마지막 장소 제외) */}
          {item.travelMinutes != null && idx < rows.length - 1 && (
            <div className="detail-route-move">↓ 이동 약 {item.travelMinutes}분</div>
          )}
        </div>
      ))}

      {/* 요약 줄 */}
      <div className="detail-route-total">
        <span>총 방문</span>
        <span>
          {`DAY ${currentDay} · ${rows.length}곳`}
        </span>
      </div>
    </div>
  );
}

export default RouteSection;
