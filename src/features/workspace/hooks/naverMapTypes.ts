// src/features/workspace/hooks/naverMapTypes.ts
//
// 네이버 지도 JS SDK는 공식 타입 정의가 없다. Map/Marker/InfoWindow/Polyline/LatLng 등을
// window.naver.maps.* 로 동적으로 생성해서 쓰는데, 이 객체들을 개별적으로 좁게 타이핑하면
// 실제 SDK 사용법(예: new window.naver.maps.LatLng(lat, lng))과 계속 어긋나 유지보수가 어렵다.
// 대신 "네이버 SDK가 돌려준 객체"라는 의미만 담은 타입 별칭 하나로 통일해서 쓴다 —
// any를 없앤 건 아니지만, any가 나타나는 곳을 이 파일 한 곳으로 모아 둔다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NaverMapObject = any;
