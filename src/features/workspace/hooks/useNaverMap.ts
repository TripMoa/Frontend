// src/features/workspace/hooks/useNaverMap.ts
import { useState, useEffect } from "react";

declare global {
  interface Window {
    // 네이버 지도 JS SDK는 공식 타입 정의가 없고, DayDetailView 등에서 Map/Marker/LatLng 등을
    // 동적으로 넓게 써서(예: window.naver.maps.LatLng(...)) 여기서 좁게 타입을 주면 그쪽이 다 깨진다.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    naver: any;
  }
}

const SCRIPT_ID = "naver-map-script";

export const useNaverMap = () => {
  // 마운트 시점에 이미 로드돼 있으면(다른 컴포넌트가 먼저 불러온 경우) 초기값에서부터 true로 —
  // 이펙트 본문에서 곧바로 setState를 부르지 않기 위해 지연 초기화로 처리한다.
  const [mapLoaded, setMapLoaded] = useState(() => !!window.naver?.maps);
  const mapKey = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!mapKey || mapLoaded) return;

    // 스크립트 태그가 이미 있는 경우 (다른 컴포넌트가 먼저 로드 시작)
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => setMapLoaded(true));
      // 태그를 붙이는 사이 이미 로드가 끝났을 수도 있음 — 이펙트 본문에서 바로 부르지 않고 미뤄서 호출
      if (window.naver?.maps) queueMicrotask(() => setMapLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${mapKey}`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, [mapKey, mapLoaded]);

  return { mapLoaded, mapKey };
};
