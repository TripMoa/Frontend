import type { StoryExpenses } from "../../../api/stories.api";
import "../styles/DetailPage.css";

// TRAVEL LOG 카테고리 
const TRAVEL_LOG_CATEGORIES: { key: keyof StoryExpenses; label: string }[] = [
  { key: "food", label: "식비 (FOOD)" },
  { key: "transportation", label: "교통 (TRANS)" },
  { key: "accommodation", label: "숙소 (STAY)" },
  { key: "shopping", label: "쇼핑 (SHOP)" },
  { key: "attraction", label: "관광/티켓 (TICKET)" },
  { key: "etc", label: "기타 (ETC)" },
];

// 직접 입력 후기
const LEGACY_CATEGORIES: { key: keyof StoryExpenses; label: string }[] = [
  { key: "transportation", label: "교통비" },
  { key: "accommodation", label: "숙박비" },
  { key: "food", label: "식비" },
  { key: "attraction", label: "관광/입장료" },
  { key: "shopping", label: "쇼핑/기타" },
];

const won = (n: number) => `${n.toLocaleString()}원`;

/* 여행 경비 요약
 - TRAVEL LOG: 0원 아닌 카테고리 + 총 지출 (+ 1인당 평균)
 - 직접 입력 후기: 기존 5칸 + 총 합계 */
function ExpenseSummary({ expenses }: { expenses: StoryExpenses }) {
  const memberCount = expenses.memberCount;
  const total = expenses.total || 0;

  if (memberCount == null) {
    return (
      <>
        {LEGACY_CATEGORIES.map(({ key, label }) => (
          <div key={key} className="detail-expense-row">
            <span>{label}</span>
            <span>{won(Number(expenses[key]) || 0)}</span>
          </div>
        ))}
        <div className="detail-expenses-total">
          <span>총 합계</span>
          <span>{won(total)}</span>
        </div>
      </>
    );
  }

  const isGroup = memberCount > 1;
  const rows = TRAVEL_LOG_CATEGORIES.filter(({ key }) => (Number(expenses[key]) || 0) > 0);

  if (total === 0) {
    return (
      <div className="detail-expense-row">
        <span>TRAVEL LOG에 기록된 경비가 없어요</span>
        <span />
      </div>
    );
  }

  return (
    <>
      {isGroup && (
        <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px", color: "rgba(0,0,0,0.6)" }}>
          공동 지출 기준 · {memberCount}명
        </div>
      )}
      {rows.map(({ key, label }) => (
        <div key={key} className="detail-expense-row">
          <span>{label}</span>
          <span>{won(Number(expenses[key]) || 0)}</span>
        </div>
      ))}
      <div className="detail-expenses-total">
        <span>총 지출</span>
        <span>{won(total)}</span>
      </div>
      {isGroup && (
        <div className="detail-expense-row" style={{ marginTop: "6px", marginBottom: 0 }}>
          <span>1인당 평균</span>
          <span>{won(Math.round(total / memberCount))}</span>
        </div>
      )}
    </>
  );
}

export default ExpenseSummary;
