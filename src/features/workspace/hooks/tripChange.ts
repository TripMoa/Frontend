// src/features/workspace/hooks/tripChange.ts
//
// 서버가 /sub/trip/{tripId} 로 보내는 "여행에서 무언가 바뀌었다" 알림의 모양과, 그걸 사람이 읽는 한 줄로 바꾸는 규칙.
// 알림에는 바뀐 데이터가 아니라 신호만 들어 있다 — 받은 쪽이 REST로 다시 조회한다.

export type TripChangeDomain = "SCHEDULE" | "PLACE";

export type TripChangeAction =
  | "ITEM_ADDED"
  | "ITEM_UPDATED"
  | "ITEM_DELETED"
  | "ITEM_MOVED"
  | "ITEMS_REORDERED"
  | "ITEM_PLAN_CHANGED"
  | "ITEM_MEMO_CHANGED"
  | "ITEM_PLACE_REPLACED"
  | "DAY_CREATED"
  | "DAY_SETTINGS_CHANGED"
  | "DAY_AUTO_COMPUTE_CHANGED"
  | "DAY_RECOMPUTED"
  | "GENERATE_START"
  | "SCHEDULE_GENERATED"
  | "GENERATE_FAILED"
  | "SCHEDULE_RESTORED"
  | "PLACE_ADDED"
  | "PLACE_UPDATED"
  | "PLACE_DELETED";

export interface TripChangeMessage {
  domain: TripChangeDomain;
  action: TripChangeAction;
  /** 바뀐 일차(Schedule) id들. 비어 있으면 "전체를 다시 불러와야 한다"는 뜻 */
  scheduleIds: number[];
  itemTitle: string | null;
  actorUserId: number | null;
  actorNickname: string | null;
  /** 변경을 일으킨 요청의 X-Client-Id — 내 탭이 보낸 것이면 무시한다 */
  originId: string | null;
  at: number;
}

/**
 * 다른 멤버가 AI 일정을 만드는 중일 때의 잠금 정보 (없으면 null).
 * 생성은 일정 전체를 통째로 새로 만들어 덮어쓰므로, 끝날 때까지 구조 편집(추가·삭제·이동·순서·계획·설정·장소 바꾸기)과
 * 새 AI 생성은 서버가 거절한다 — 화면은 그걸 미리 막고 이유를 보여준다. 메모는 계속 쓸 수 있다.
 */
export interface GenerationLock {
  actorNickname: string | null;
}

/** 알림 한 건을 화면 상태에 반영하는 방법 */
export interface TripChangeEffect {
  /** 저장된 장소 목록을 다시 불러온다 */
  places: boolean;
  /** 일정 전체를 다시 불러온다 (일차 id가 바뀌었거나 어느 일차인지 모를 때) */
  allSchedules: boolean;
  /** 다시 불러올 일차 id들 (allSchedules 가 true 면 의미 없음) */
  scheduleIds: number[];
}

export function effectOf(m: TripChangeMessage): TripChangeEffect {
  if (m.domain === "PLACE") return { places: true, allSchedules: false, scheduleIds: [] };

  // 생성이 "시작"되거나 "실패"했을 때는 데이터가 바뀌지 않았다 (시작은 구조 편집만 막는다)
  if (m.action === "GENERATE_START" || m.action === "GENERATE_FAILED") {
    return { places: false, allSchedules: false, scheduleIds: [] };
  }
  if (m.action === "SCHEDULE_GENERATED" || m.action === "SCHEDULE_RESTORED" || m.scheduleIds.length === 0) {
    return { places: false, allSchedules: true, scheduleIds: [] };
  }
  return { places: false, allSchedules: false, scheduleIds: m.scheduleIds };
}

/**
 * 알림을 토스트 한 줄로. 알릴 필요가 없는 변경(일차 생성·재계산·생성 시작/실패)은 null.
 * dayOf: 일차 id → "DAY 2" 같은 이름 (모르면 null)
 */
export function describeChange(m: TripChangeMessage, dayOf: (scheduleId: number) => string | null): string | null {
  const who = m.actorNickname ? `${m.actorNickname}님이` : "다른 멤버가";
  const quoted = m.itemTitle ? `'${m.itemTitle}'` : null;
  // "'성산일출봉' 장소" / (이름을 모르면) "장소" — 둘 다 "장소"로 끝나 뒤에 "를/에" 가 자연스럽게 붙는다
  const obj = quoted ? `${quoted} 장소` : "장소";
  const day = m.scheduleIds.length > 0 ? dayOf(m.scheduleIds[0]) : null;
  const dayText = day ?? "일정";

  switch (m.action) {
    case "ITEM_ADDED":
      return `${who} ${dayText}에 ${obj}를 추가했어요`;
    case "ITEM_DELETED":
      return `${who} ${obj}를 일정에서 뺐어요`;
    case "ITEM_UPDATED":
      return `${who} ${obj}를 수정했어요`;
    case "ITEM_MOVED": {
      const to = m.scheduleIds.length > 1 ? dayOf(m.scheduleIds[1]) : null;
      return `${who} ${obj}를 ${to ?? "다른 날"}로 옮겼어요`;
    }
    case "ITEMS_REORDERED":
      return `${who} ${dayText} 순서를 바꿨어요`;
    case "ITEM_PLAN_CHANGED":
      return `${who} ${quoted ?? "장소"}의 머무는 시간·시각을 바꿨어요`;
    case "ITEM_MEMO_CHANGED":
      return `${who} ${quoted ?? "장소"}에 메모를 남겼어요`;
    case "ITEM_PLACE_REPLACED":
      return quoted ? `${who} 장소를 ${quoted}(으)로 바꿨어요` : `${who} 장소를 바꿨어요`;
    case "DAY_SETTINGS_CHANGED":
      return `${who} ${dayText} 시간 설정을 바꿨어요`;
    case "DAY_AUTO_COMPUTE_CHANGED":
      return `${who} ${dayText} 자동 시간 계산을 바꿨어요`;
    case "SCHEDULE_GENERATED":
      return "AI 일정이 새로 만들어졌어요";
    case "SCHEDULE_RESTORED":
      return `${who} AI 일정을 이전 상태로 되돌렸어요`;
    case "PLACE_ADDED":
      return quoted ? `${who} 저장한 장소에 ${quoted}을(를) 추가했어요` : `${who} 저장한 장소를 추가했어요`;
    case "PLACE_UPDATED":
      return quoted ? `${who} 저장한 장소 ${quoted}을(를) 수정했어요` : `${who} 저장한 장소를 수정했어요`;
    case "PLACE_DELETED":
      return quoted ? `${who} 저장한 장소 ${quoted}을(를) 삭제했어요` : `${who} 저장한 장소를 삭제했어요`;
    default:
      return null;
  }
}
