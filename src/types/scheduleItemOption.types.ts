// src/types/scheduleItemOption.types.ts
//
// Voucher/Expense 등 "일정 항목에 연결"하는 기능들이 공통으로 쓰는 옵션 타입.
// WorkspaceCenter가 useTimeline의 allDays로부터 만들어서 각 모달/뷰에 내려준다.

export interface ScheduleItemOption {
  id: number;
  day: string;
  time: string;
  title: string;
}
