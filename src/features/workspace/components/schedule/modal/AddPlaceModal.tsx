//src\features\workspace\components\schedule\modal\AddPlaceModal.tsx
import React, { useState } from "react";
import "../../../styles/modals.css";

interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  imageUrl?: string;
  rating?: number;
  description?: string;
  lat?: number;
  lng?: number;
  memo?: string;
}

interface AddPlaceModalProps {
  onClose: () => void;
  onAddPlace: (place: Place) => void;
  existingPlaces: Place[];
}

const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  onClose,
  onAddPlace,
  existingPlaces,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 검색 실행
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert("검색어를 입력해주세요!");
      return;
    }

    setIsSearching(true);

    // 더미 데이터 (실제로는 API 호출)
    setTimeout(() => {
      const dummyResults: Place[] = [
        {
          id: "search_1",
          name: "이태원 경리단길",
          category: "관광",
          address: "서울특별시 용산구 이태원로",
          imageUrl: "https://via.placeholder.com/400x300?text=Gyeonglidan",
          rating: 4.5,
          description: "트렌디한 카페와 레스토랑이 모인 거리",
        },
        {
          id: "search_2",
          name: "익선동 한옥거리",
          category: "관광",
          address: "서울특별시 종로구 돈화문로11다길",
          imageUrl: "https://via.placeholder.com/400x300?text=Ikseon",
          rating: 4.6,
          description: "전통 한옥을 개조한 카페와 상점들",
        },
        {
          id: "search_3",
          name: "망원시장",
          category: "맛집",
          address: "서울특별시 마포구 포은로8길 14",
          imageUrl: "https://via.placeholder.com/400x300?text=Mangwon+Market",
          rating: 4.4,
          description: "현지인들이 찾는 전통시장, 왕족발 맛집",
        },
        {
          id: "search_4",
          name: "성수동 카페거리",
          category: "카페",
          address: "서울특별시 성동구 연무장길",
          imageUrl: "https://via.placeholder.com/400x300?text=Seongsu+Cafe",
          rating: 4.7,
          description: "공장을 개조한 감성 카페들이 모인 핫플",
        },
        {
          id: "search_5",
          name: "동대문 디자인플라자(DDP)",
          category: "쇼핑",
          address: "서울특별시 중구 을지로 281",
          imageUrl: "https://via.placeholder.com/400x300?text=DDP",
          rating: 4.5,
          description: "자하 하디드가 설계한 복합문화공간",
        },
        {
          id: "search_6",
          name: "남산 야경",
          category: "관광",
          address: "서울특별시 중구 남산공원길",
          imageUrl: "https://via.placeholder.com/400x300?text=Namsan+Night",
          rating: 4.8,
          description: "서울의 야경을 한눈에 볼 수 있는 명소",
        },
      ];
      setSearchResults(dummyResults);
      setIsSearching(false);
    }, 800);
  };

  // Enter 키 검색
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 장소 추가
  const handleAdd = (place: Place) => {
    onAddPlace(place);
    alert(`${place.name}이(가) 추가되었습니다!`);
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
        style={{ width: "90%", maxWidth: "1200px", height: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; ADD NEW PLACE</span>
          <button className="mh-close" onClick={onClose}>
            CLOSE [X]
          </button>
        </div>

        {/* 검색바 */}
        <div
          style={{
            padding: "20px",
            borderBottom: "2px solid #eee",
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="🔍 장소, 지역을 검색하세요... (예: 오사카 라멘, 도톤보리)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                flex: 1,
                height: "45px",
                padding: "0 20px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "15px",
              }}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              style={{
                width: "100px",
                height: "45px",
                background: "#000",
                color: "#fff",
                border: "2px solid #000",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {isSearching ? "검색중..." : "검색"}
            </button>
          </div>
        </div>

        {/* 메인 바디 (리스트만) */}
        <div
          className="modal-body"
          style={{
            height: "calc(85vh - 160px)",
            overflow: "hidden",
          }}
        >
          {/* 검색 결과 */}
          <div
            style={{
              overflowY: "auto",
              padding: "20px",
              background: "#fafafa",
              height: "100%",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: "bold",
                fontSize: "14px",
                marginBottom: "15px",
                color: "#666",
              }}
            >
              검색결과 {searchResults.length}개
            </div>

            {searchResults.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#999",
                }}
              >
                <p>검색어를 입력하고</p>
                <p>장소를 찾아보세요! 🔍</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "15px",
                }}
              >
                {searchResults.map((place) => {
                  const isAdded = existingPlaces.some((p) => p.id === place.id);

                  return (
                    <div
                      key={place.id}
                      style={{
                        background: "#fff",
                        border: "2px solid #ddd",
                        borderRadius: "8px",
                        padding: "15px",
                        transition: "0.2s",
                        cursor: "pointer",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = "#000";
                        e.currentTarget.style.boxShadow =
                          "4px 4px 0px rgba(0, 0, 0, 0.1)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = "#ddd";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {place.imageUrl && (
                        <div
                          style={{
                            width: "100%",
                            height: "150px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            marginBottom: "12px",
                          }}
                        >
                          <img
                            src={place.imageUrl}
                            alt={place.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      )}

                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          background: "#000",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: "bold",
                          borderRadius: "4px",
                          marginBottom: "8px",
                        }}
                      >
                        {place.category}
                      </span>

                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          margin: "0 0 6px 0",
                        }}
                      >
                        {place.name}
                      </h4>

                      <p
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          margin: "0 0 8px 0",
                        }}
                      >
                        {place.address}
                      </p>

                      {place.rating && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#ff9800",
                            fontWeight: "bold",
                            display: "block",
                            marginBottom: "10px",
                          }}
                        >
                          ⭐ {place.rating}
                        </span>
                      )}

                      <button
                        onClick={() => handleAdd(place)}
                        disabled={isAdded}
                        style={{
                          width: "100%",
                          padding: "10px",
                          background: isAdded ? "#4caf50" : "#000",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: "bold",
                          fontSize: "13px",
                          cursor: isAdded ? "not-allowed" : "pointer",
                        }}
                      >
                        {isAdded ? "✓ 추가됨" : "+ 추가하기"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPlaceModal;