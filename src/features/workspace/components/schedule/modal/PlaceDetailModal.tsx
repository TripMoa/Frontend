//src\features\workspace\components\schedule\modal\PlaceDetailModal.tsx
import React from "react";
import "../../../styles/modals.css";
import "../../../styles/placedetailmodal.css";
import { CATEGORY_COLOR, getCategoryIcon } from "../../../hooks/schedule.constants";

interface PlaceInfo {
  name: string;
  time?: string;
  imageUrl?: string;
  address?: string;
  rating?: number;
  category?: string;
  description?: string;
}

interface PlaceDetailModalProps {
  placeInfo: PlaceInfo;
  onClose: () => void;
  onViewOnMap?: () => void;
}



const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ placeInfo, onClose, onViewOnMap }) => {
  const color = CATEGORY_COLOR[placeInfo.category ?? ""] || "#333";
  const icon = placeInfo.category ? getCategoryIcon(placeInfo.category) : "📍";

  const stars = placeInfo.rating
    ? Array.from({ length: 5 }, (_, i) =>
        i < Math.round(placeInfo.rating!) ? "★" : "☆"
      ).join("")
    : null;

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-window"
        style={{ width: "90%", maxWidth: "580px", maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 기존 AddPlaceModal/AiScheduleModal과 동일한 스타일 */}
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; 장소 상세 정보</span>
          <button className="mh-close" onClick={onClose}>
            CLOSE [X]
          </button>
        </div>

        {/* 이미지 */}
        {placeInfo.imageUrl ? (
          <img
            src={placeInfo.imageUrl}
            alt={placeInfo.name}
            style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "120px",
            background: "#f5f5f5",
            borderBottom: "2px solid #eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
          }}>
            {icon}
          </div>
        )}

        {/* 바디 */}
        <div
          className="modal-body"
          style={{
            background: "#fff",
            padding: "24px 28px",
            overflowY: "auto",
            maxHeight: "calc(88vh - 200px)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* 카테고리 배지 + 시간 */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {placeInfo.category && (
              <span style={{
                background: color,
                color: "#fff",
                padding: "3px 10px",
                fontSize: "12px",
                fontWeight: "bold",
                borderRadius: "4px",
              }}>
                {icon} {placeInfo.category}
              </span>
            )}
            {placeInfo.time && (
              <span style={{
                fontSize: "12px",
                color: "#999",
                fontFamily: "var(--font-mono)",
              }}>
                🕐 {placeInfo.time}
              </span>
            )}
            {stars && (
              <span style={{ fontSize: "13px", color: "#ff9800", fontWeight: "bold", marginLeft: "auto" }}>
                {stars} {placeInfo.rating}
              </span>
            )}
          </div>

          {/* 장소명 */}
          <h2 style={{
            fontSize: "20px",
            fontWeight: 800,
            margin: 0,
            color: "#000",
            lineHeight: 1.3,
          }}>
            {placeInfo.name}
          </h2>

          {/* 주소 */}
          {placeInfo.address && (
            <div style={{
              padding: "12px 16px",
              background: "#f5f5f5",
              border: "2px solid #eee",
              borderLeft: `4px solid ${color}`,
            }}>
              <p style={{ fontSize: "11px", fontWeight: "bold", color: "#999", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                📍 주소
              </p>
              <p style={{ fontSize: "13px", color: "#333", margin: 0 }}>
                {placeInfo.address}
              </p>
            </div>
          )}

          {/* 설명 */}
          {placeInfo.description && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: "bold", color: "#999", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                ℹ️ 설명
              </p>
              <p style={{ fontSize: "13px", color: "#555", margin: 0, lineHeight: 1.7 }}>
                {placeInfo.description}
              </p>
            </div>
          )}

        </div>

        {/* 푸터 */}
        <div style={{
          padding: "16px 28px",
          borderTop: "2px solid #eee",
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              background: "#fff",
              color: "#000",
              border: "2px solid #000",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              borderRadius: "4px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f0f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            닫기
          </button>
          <button
            onClick={onViewOnMap ?? undefined}
            disabled={!onViewOnMap}
            title={!onViewOnMap ? "지도 연동이 지원되지 않는 장소입니다" : undefined}
            style={{
              padding: "10px 24px",
              background: onViewOnMap ? "#000" : "#f5f5f5",
              color: onViewOnMap ? "#fff" : "#bbb",
              border: `2px solid ${onViewOnMap ? "#000" : "#ddd"}`,
              fontWeight: "bold",
              fontSize: "14px",
              cursor: onViewOnMap ? "pointer" : "not-allowed",
              borderRadius: "4px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (onViewOnMap) e.currentTarget.style.background = "#333"; }}
            onMouseLeave={(e) => { if (onViewOnMap) e.currentTarget.style.background = "#000"; }}
          >
            지도에서 보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailModal;