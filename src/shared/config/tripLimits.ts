// src/shared/config/tripLimits.ts
//
// 여행 하나에 함께할 수 있는 최대 인원(본인 포함). 서버의 Trip.MAX_MEMBERS 와 같은 값이어야 한다 —
// 화면은 이 값으로 미리 막고, 서버는 어떤 경로로 와도(생성·링크 참여·소유자 추가) 같은 값으로 다시 검사한다.
export const MAX_TRIP_MEMBERS = 10;
