// src/features/workspace/components/schedule/mapStyle.ts
//
// 지도 위에 그리는 핀·말풍선·선의 모양을 한곳에서 만든다 (일정 전체 · 일차 · 장소 검색 모달이 같이 씀).
// 핀과 말풍선은 지도 SDK가 이 문서 안에 그대로 넣어 주므로 디자인 클래스(tm-cat 등)와 토큰(--tm-*)을 쓸 수 있고,
// 지도가 직접 그리는 선·테두리는 토큰의 실제 값을 읽어서 쓴다. 모양(CSS)은 styles/shell.css 의 .ws-pin / .ws-iw.

export const cssVar = (name: string, fallback: string): string => {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 배경색 위에서 읽히는 글자색 (밝은 노랑 위에는 검정, 어두운 색 위에는 흰색) */
const readableOn = (hex: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return cssVar("--tm-paper", "#ffffff");
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? cssVar("--tm-ink", "#111111") : cssVar("--tm-paper", "#ffffff");
};

/** 번호가 들어 있는 동그란 핀 — 카테고리 색 채움 + 검정 테두리 (핀 크기 28px, 중심이 좌표) */
export const pinHtml = (color: string, label: string | number): string =>
  `<div class="ws-pin" style="--tm-cat:${color};color:${readableOn(color)}"><span>${escapeHtml(String(label))}</span></div>`;

/** 지도를 눌렀을 때 잠깐 나오는 임시 핀 */
export const tempPinHtml = (): string => `<div class="ws-pin ws-pin--tmp"></div>`;

export const PIN_SIZE = 28;
export const TEMP_PIN_SIZE = 16;

/** 말풍선 안쪽 */
export const infoHtml = (
  place: { name: string; category: string; address?: string; rating?: number },
  color: string,
  time?: string,
): string =>
  `<div class="ws-iw">` +
  `<div class="ws-iw__top"><span class="tm-tag tm-cat" style="--tm-cat:${color}">${escapeHtml(place.category)}</span>` +
  (place.rating ? `<span class="ws-iw__rt">평점 ${place.rating}</span>` : "") +
  `</div>` +
  (time ? `<div class="ws-iw__time">${escapeHtml(time)}</div>` : "") +
  `<div class="ws-iw__name">${escapeHtml(place.name)}</div>` +
  (place.address ? `<div class="ws-iw__addr">${escapeHtml(place.address)}</div>` : "") +
  `</div>`;

/** 말풍선 상자 (테두리 1px 검정, 흰 바탕) — pixelOffset 은 쓰는 쪽에서 Point 로 붙인다 */
export const infoWindowBase = () => ({
  anchorSkew: true,
  backgroundColor: cssVar("--tm-paper", "#ffffff"),
  borderColor: cssVar("--tm-ink", "#111111"),
  borderWidth: 1,
});
