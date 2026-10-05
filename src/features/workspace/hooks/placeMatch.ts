// src/features/workspace/hooks/placeMatch.ts
//
// 저장한 장소(DAY ALL)와 일정 노드가 "같은 장소인지" 판별하는 규칙 — 여러 화면이 같은 기준을 쓰도록 한 곳에 둔다.

export interface ItemRef {
  title: string;
  lat?: number;
  lng?: number;
}

export interface PlaceRef {
  name: string;
  lat?: number;
  lng?: number;
}

const COORD_EPS = 0.0002; // 약 20m — 제목을 고쳐도 같은 자리면 같은 장소로 본다

/** 이름이 같거나 좌표가 거의 같으면 같은 장소 */
export const itemMatchesPlace = (item: ItemRef, place: PlaceRef): boolean =>
  item.title === place.name ||
  (item.lat != null &&
    item.lng != null &&
    place.lat != null &&
    place.lng != null &&
    Math.abs(item.lat - place.lat) < COORD_EPS &&
    Math.abs(item.lng - place.lng) < COORD_EPS);
