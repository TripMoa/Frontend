// src/features/workspace/hooks/dayTabs.ts
//
// 사이드바 일차 탭 계산 (순수 함수 — 화면 없이 테스트할 수 있게 분리)

// "YYYY-MM-DD" ~ "YYYY-MM-DD" 의 여행 일수 (시작일·종료일 포함). 날짜가 비었거나 잘못되면 null
export const countTripDays = (start: string, end: string): number | null => {
  const s = /^(\d{4})-(\d{2})-(\d{2})/.exec(start ?? "");
  const e = /^(\d{4})-(\d{2})-(\d{2})/.exec(end ?? "");
  if (!s || !e) return null;
  const diff =
    (Date.UTC(+e[1], +e[2] - 1, +e[3]) - Date.UTC(+s[1], +s[2] - 1, +s[3])) /
    86400000;
  return diff >= 0 ? Math.round(diff) + 1 : null;
};

const MAX_TAB_DAYS = 60; // 서버가 받는 일차 상한과 같다

const dayNumber = (key: string): number | null => {
  const m = /^DAY (\d+)$/.exec(key);
  return m ? Number(m[1]) : null;
};

/** 노드가 하나라도 있는 일차의 키 — 서버에 빈 일차 행이 남아 있어도(노드를 다 지운 일차) 여기서는 뺀다 */
export function dayKeysWithItems(allDays: Record<string, unknown[]>): string[] {
  return Object.entries(allDays)
    .filter(([, items]) => items.length > 0)
    .map(([key]) => key);
}

/**
 * 사이드바 탭과 "다른 날로 이동" 목록에 보여줄 일차 = 여행 기간의 DAY 1..N + 노드가 있는 일차, 번호순.
 *
 * - 기간 안의 일차는 비어 있어도 보인다(직접 일정을 넣을 수 있고, 다른 날에서 옮겨 올 수도 있다).
 * - 기간을 줄였을 때 기간 밖 일차는 "노드가 남아 있으면" 유지하고, 다 지우거나 옮겨서 비면 빠진다.
 *   (서버의 빈 일차 행은 그대로 두고 화면에서만 뺀다. 예전에는 한 번 생긴 탭이 재생성 전까지 남았다.)
 * - 아직 서버에 행이 없는 일차로 옮기면 이동 함수가 그때 만든다(useTimeline.ensureScheduleId).
 */
export function computeDayTabs(startDate: string, endDate: string, daysWithItems: string[]): string[] {
  const days = countTripDays(startDate, endDate);
  const tripTabs = days ? Array.from({ length: Math.min(days, MAX_TAB_DAYS) }, (_, i) => `DAY ${i + 1}`) : [];
  return [...new Set([...tripTabs, ...daysWithItems])].sort((a, b) => {
    const na = dayNumber(a);
    const nb = dayNumber(b);
    if (na != null && nb != null) return na - nb;
    if (na != null) return -1;
    if (nb != null) return 1;
    return 0;
  });
}
