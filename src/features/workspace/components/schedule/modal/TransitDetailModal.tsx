// src/features/workspace/components/schedule/modal/TransitDetailModal.tsx
//
// 일정 화면에서 구간(이동 배지)을 눌렀을 때 보여주는 "실제 대중교통 경로" 패널.
// ODsay 결과는 이 화면에서만 보여주고 저장하지 않는다(브라우저 저장소에도 넣지 않음) — 닫으면 사라지고 다시 열면 다시 조회한다.
// ODsay 이용 조건: 결과가 보이는 곳에 "powered by www.ODsay.com" 문구를 그대로 표기한다(수정·다른 로고와 결합 금지).

import React from "react";
import "../../../styles/modals.css";

export interface TransitStep {
  type: "walk" | "subway" | "bus";
  minutes: number;
  distance_m: number;
  line?: string;
  start?: string;
  end?: string;
  stations?: number;
  interval_min?: number;
  direction?: string;
  door?: string;
  exit_no?: string;
}

export interface TransitRoute {
  path_type?: number;
  total_time: number;
  payment: number;
  transfers: number;
  walk_minutes: number;
  walk_meters: number;
  station_count: number;
  first_station: string;
  last_station: string;
  steps: TransitStep[];
}

export type TransitResult =
  | { success: true; search_type: "intra" | "intercity"; routes: TransitRoute[] }
  | { success: false; reason: string; message: string };

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  fromName: string;
  toName: string;
  from: LatLng;
  to: LatLng;
  /** 일정에 잡혀 있는 추정 이동 시간(분) */
  estimateMinutes?: number;
  status: "loading" | "done" | "error";
  result?: TransitResult;
  errorMessage?: string;
  onClose: () => void;
}

const ICON: Record<TransitStep["type"], string> = { walk: "🚶", subway: "🚇", bus: "🚌" };

// 지도 앱 링크의 이름 부분 — 구분자(쉼표·슬래시)가 들어가면 링크가 깨지므로 공백으로 바꾼다
const linkName = (name: string) => encodeURIComponent(name.replace(/[,/]/g, " ").trim() || "장소");

const buildMapLinks = (fromName: string, from: LatLng, toName: string, to: LatLng) => ({
  naver: `https://map.naver.com/p/directions/${from.lng},${from.lat},${linkName(fromName)}/${to.lng},${to.lat},${linkName(toName)}/-/transit`,
  kakao: `https://map.kakao.com/link/by/traffic/${linkName(fromName)},${from.lat},${from.lng}/${linkName(toName)},${to.lat},${to.lng}`,
});

const stepText = (s: TransitStep): string => {
  if (s.type === "walk") return `도보 ${s.minutes}분${s.distance_m > 0 ? ` (${s.distance_m.toLocaleString()}m)` : ""}`;
  const head = `${s.line || (s.type === "subway" ? "지하철" : "버스")} ${s.start ?? ""} → ${s.end ?? ""}`.trim();
  const tail = [s.stations ? `${s.stations}정거장` : "", `${s.minutes}분`].filter(Boolean).join(", ");
  return `${head} (${tail})`;
};

const stepSub = (s: TransitStep): string => {
  const parts: string[] = [];
  if (s.direction) parts.push(`${s.direction} 방면`);
  if (s.exit_no) parts.push(`${s.exit_no}번 출구`);
  if (s.door) parts.push(`문 ${s.door}`);
  if (s.interval_min) parts.push(`배차 ${s.interval_min}분`);
  return parts.join(" · ");
};

const TransitDetailModal: React.FC<Props> = ({
  fromName, toName, from, to, estimateMinutes, status, result, errorMessage, onClose,
}) => {
  const links = buildMapLinks(fromName, from, toName, to);
  const failed = status === "error" || (status === "done" && result && !result.success);
  const failMessage =
    status === "error"
      ? errorMessage
      : result && !result.success
      ? result.message
      : undefined;

  return (
    <div className="modal-overlay active" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-window"
        style={{ width: "92%", maxWidth: "520px", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; 이동 경로</span>
          <button className="mh-close" onClick={onClose}>CLOSE [X]</button>
        </div>

        <div className="modal-body" style={{ padding: "16px 20px", overflowY: "auto" }}>
          <p style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "14px" }}>
            🚇 {fromName} → {toName}
          </p>
          {estimateMinutes != null && estimateMinutes > 0 && (
            <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#888" }}>
              일정에 잡힌 이동 시간(추정): 약 {estimateMinutes}분
            </p>
          )}

          {status === "loading" && (
            <p style={{ fontSize: "13px", color: "#555", padding: "24px 0", textAlign: "center" }}>
              실시간 경로를 불러오는 중이에요…
            </p>
          )}

          {failed && (
            <p style={{
              fontSize: "13px", color: "#795548", background: "#fff8e1",
              border: "1px solid #ffd54f", borderRadius: "6px", padding: "10px 12px", lineHeight: 1.6,
            }}>
              {failMessage || "실시간 경로를 가져오지 못했어요."}
            </p>
          )}

          {status === "done" && result && result.success && (
            <>
              {result.search_type === "intercity" && (
                <p style={{
                  fontSize: "12px", color: "#795548", background: "#fff8e1", border: "1px solid #ffd54f",
                  borderRadius: "6px", padding: "8px 10px", margin: "0 0 12px", lineHeight: 1.5,
                }}>
                  도시 간 이동이라 터미널·역 사이 경로만 나와요. 출발지→터미널, 터미널→도착지 구간은 따로 확인해주세요.
                </p>
              )}
              {result.routes.map((r, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #ddd", borderRadius: "8px", padding: "12px 14px",
                    marginBottom: "10px", background: i === 0 ? "#f7fbff" : "#fff",
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "8px" }}>
                    {"①②③"[i] ?? i + 1} {r.total_time}분
                    <span style={{ fontWeight: "normal", color: "#555" }}>
                      {" "}· {r.payment.toLocaleString()}원 · 환승 {r.transfers}회 · 도보 {r.walk_minutes}분
                    </span>
                    {i === 0 && (
                      <span style={{ marginLeft: "8px", fontSize: "11px", color: "#1976d2" }}>가장 빠른 경로</span>
                    )}
                  </div>
                  {r.steps.map((s, si) => (
                    <div key={si} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#333", marginBottom: "4px" }}>
                      <span style={{ width: "18px", flexShrink: 0 }}>{ICON[s.type]}</span>
                      <div style={{ minWidth: 0 }}>
                        <div>{stepText(s)}</div>
                        {stepSub(s) && <div style={{ color: "#999", fontSize: "11px" }}>{stepSub(s)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: "8px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #eee",
          }}>
            <span style={{ fontSize: "11px", color: "#999" }}>
              {status === "done" && result?.success ? "powered by www.ODsay.com" : ""}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <a
                href={links.naver} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: "#1976d2" }}
              >
                네이버 지도에서 열기
              </a>
              <a
                href={links.kakao} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: "#1976d2" }}
              >
                카카오맵에서 열기
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransitDetailModal;
