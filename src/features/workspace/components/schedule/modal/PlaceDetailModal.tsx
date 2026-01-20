//src\features\workspace\components\schedule\modal\PlaceDetailModal.tsx
import React from "react";
import "../../../styles/modals.css";

interface PlaceInfo {
  name: string;
  time?: string;
  imageUrl?: string;
  address?: string;
  rating?: number;
  category?: string;
  description?: string;
  memo?: string;
}

interface PlaceDetailModalProps {
  placeInfo: PlaceInfo;
  onClose: () => void;
}

const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  placeInfo,
  onClose,
}) => {
  // 카테고리별 아이콘
  const getCategoryIcon = (cat?: string) => {
    const icons: { [key: string]: string } = {
      맛집: "🍴",
      카페: "☕",
      관광: "🏛️",
      쇼핑: "🛍️",
      숙소: "🏨",
    };
    return cat ? icons[cat] || "📍" : "📍";
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-window"
        style={{ width: "90%", maxWidth: "600px", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; 장소 상세 정보</span>
          <button className="mh-close" onClick={onClose}>
            CLOSE [X]
          </button>
        </div>

        {/* 바디 */}
        <div
          className="modal-body"
          style={{
            padding: "0",
            overflowY: "auto",
            maxHeight: "calc(85vh - 80px)",
          }}
        >
          {/* 이미지 */}
          {placeInfo.imageUrl && (
            <div
              style={{
                width: "100%",
                height: "300px",
                overflow: "hidden",
                // background: "#f0f0f0",
              }}
            >
              <img
                src={placeInfo.imageUrl}
                alt={placeInfo.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          {/* 정보 섹션 */}
          <div style={{ padding: "30px" }}>
            {/* 카테고리 & 평점 */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "15px",
                alignItems: "center",
              }}
            >
              {placeInfo.category && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "5px 12px",
                    background: "#000",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "bold",
                    borderRadius: "6px",
                  }}
                >
                  {getCategoryIcon(placeInfo.category)} {placeInfo.category}
                </span>
              )}

              {placeInfo.rating && (
                <span
                  style={{
                    fontSize: "15px",
                    color: "#ff9800",
                    fontWeight: "bold",
                  }}
                >
                  ⭐ {placeInfo.rating}
                </span>
              )}
            </div>

            {/* 장소명 */}
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                margin: "0 0 10px 0",
                color: "#000",
              }}
            >
              {placeInfo.name}
            </h2>

            {/* 시간 */}
            {placeInfo.time && (
              <div
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "15px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                🕐 {placeInfo.time}
              </div>
            )}

            {/* 주소 */}
            {placeInfo.address && (
              <div
                style={{
                  padding: "15px",
                  background: "#f8f8f8",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#999",
                    marginBottom: "5px",
                  }}
                >
                  📍 주소
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  {placeInfo.address}
                </div>
              </div>
            )}

            {/* 설명 */}
            {placeInfo.description && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "#333",
                    marginBottom: "8px",
                  }}
                >
                  ℹ️ 설명
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#555",
                    lineHeight: "1.6",
                  }}
                >
                  {placeInfo.description}
                </div>
              </div>
            )}

            {/* 메모 */}
            {placeInfo.memo && (
              <div
                style={{
                  padding: "15px",
                  background: "#fffbea",
                  borderRadius: "8px",
                  border: "2px solid #ffd700",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "#333",
                    marginBottom: "8px",
                  }}
                >
                  💭 메모
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#555",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {placeInfo.memo}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div
          style={{
            padding: "15px 30px",
            borderTop: "2px solid #eee",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 25px",
              background: "#000",
              color: "#fff",
              border: "2px solid #000",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailModal;