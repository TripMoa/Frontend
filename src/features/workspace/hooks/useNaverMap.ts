// src/features/workspace/hooks/useNaverMap.ts
import { useState, useEffect } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

const SCRIPT_ID = "naver-map-script";

export const useNaverMap = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapKey = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!mapKey) return;

    // 이미 로드된 경우
    if (window.naver?.maps) {
      setMapLoaded(true);
      return;
    }

    // 스크립트 태그가 이미 있는 경우 (다른 컴포넌트가 먼저 로드)
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => setMapLoaded(true));
      // 이미 로드 완료됐을 수도 있음
      if (window.naver?.maps) setMapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${mapKey}`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, [mapKey]);

  return { mapLoaded, mapKey };
};