import React, { useState, useEffect } from "react";
import AddPlaceModal from "./AddPlaceModal";
import AiScheduleModal from "./AiScheduleModal";
import { useWorkspaceCore } from "../../hooks/useWorkspaceCore";
import "../../styles/workspace/center.css";
import "../../styles/workspace/modals.css";

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

interface DayAllViewProps {
  tripTitle: string;
  startDate: string;
  endDate: string;
}

const DayAllView: React.FC<DayAllViewProps> = ({
  tripTitle,
  startDate,
  endDate,
}) => {
  const { selectTab } = useWorkspaceCore();
  
  // 한국 여행지 기본 데이터
  const defaultKoreaPlaces: Place[] = [
    {
      id: "korea_1",
      name: "경복궁",
      category: "관광",
      address: "서울특별시 종로구 사직로 161",
      imageUrl: "https://www.kh.or.kr/jnrepo/namo/img/images/000045/20230405103334542_MPZHA77B.jpg",
      rating: 4.7,
      description: "조선시대 대표 궁궐, 한복 입고 관람 추천",
      memo: "한복 대여 가능, 오전 방문 추천"
    },
    {
      id: "korea_2",
      name: "광장시장",
      category: "맛집",
      address: "서울특별시 종로구 창경궁로 88",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTf1w8-0coGKyUXGRJdiV0oRCkLJEKaHfFeww&s",
      rating: 4.6,
      description: "서울의 대표 전통 시장, 빈대떡과 마약김밥 필수",
      memo: "빈대떡, 마약김밥, 육회 꼭 먹기"
    },
    {
      id: "korea_3",
      name: "북촌한옥마을",
      category: "관광",
      address: "서울특별시 종로구 계동길 37",
      imageUrl: "https://i.namu.wiki/i/DEvKxYg-TEz6O53jeZyS9kndJSgSQnFysm3T-R70yXIyWi9-HknJZXoK1ghHFMwB365TyyMj7MlIebAKMrLSFA.webp",
      rating: 4.5,
      description: "전통 한옥이 보존된 마을, 사진 명소",
      memo: ""
    },
    {
      id: "korea_4",
      name: "을지로 원조노가리",
      category: "맛집",
      address: "서울특별시 중구 을지로13길 12",
      imageUrl: "https://pds.joongang.co.kr/news/component/htmlphoto_mmdata/201904/20/72822356-9226-428d-bd7b-c449f49de69c.jpg",
      rating: 4.5,
      description: "노가리와 맥주로 유명한 을지로 대표 포장마차 거리 맛집",
      memo: "저녁 시간대 방문 추천, 웨이팅 잦음"
    },
    {
      id: "korea_5",
      name: "테일러커피 연남점",
      category: "카페",
      address: "서울특별시 마포구 연남로1길 17",
      imageUrl: "https://d12zq4w4guyljn.cloudfront.net/750_750_20251128083337890_photo_16116f4f550e.webp",
      rating: 4.8,
      description: "스페셜티 커피로 유명한 연남동 대표 카페, 원두 선택 가능",
      memo: "오후 시간대 방문 추천, 디저트도 괜찮음"
    },
    {
      id: "korea_6",
      name: "명동 쇼핑거리",
      category: "쇼핑",
      address: "서울특별시 중구 명동길",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/%EB%AA%85%EB%8F%998%EA%B8%B8_%EA%B1%B0%EB%A6%AC_%282020.03%29.jpg/1200px-%EB%AA%85%EB%8F%998%EA%B8%B8_%EA%B1%B0%EB%A6%AC_%282020.03%29.jpg",
      rating: 4.3,
      description: "한국 화장품과 패션 쇼핑의 메카",
      memo: "화장품 세일 많음"
    },
    {
      id: "korea_7",
      name: "N서울타워",
      category: "관광",
      address: "서울특별시 용산구 남산공원길 105",
      imageUrl: "https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp",
      rating: 4.6,
      description: "서울 야경 명소, 남산케이블카 탑승 가능",
      memo: "석양 시간대 방문 추천"
    }
  ];

  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [category, setCategory] = useState("all");

  // LocalStorage에서 저장된 장소 불러오기 (없으면 기본값 사용)
  useEffect(() => {
    const saved = localStorage.getItem("saved_places");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 빈 배열이면 기본값 사용
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedPlaces(parsed);
        } else {
          setSavedPlaces(defaultKoreaPlaces);
          localStorage.setItem("saved_places", JSON.stringify(defaultKoreaPlaces));
        }
      } catch (e) {
        console.error("Failed to load saved places:", e);
        setSavedPlaces(defaultKoreaPlaces);
        localStorage.setItem("saved_places", JSON.stringify(defaultKoreaPlaces));
      }
    } else {
      // localStorage에 아무것도 없으면 기본값 설정
      setSavedPlaces(defaultKoreaPlaces);
      localStorage.setItem("saved_places", JSON.stringify(defaultKoreaPlaces));
    }
  }, []);

  // 저장된 장소 변경 시 LocalStorage 업데이트
  useEffect(() => {
    localStorage.setItem("saved_places", JSON.stringify(savedPlaces));
  }, [savedPlaces]);

  // 장소 추가 (모달에서 호출)
  const handleAddPlace = (place: Place) => {
    if (savedPlaces.some((p) => p.id === place.id)) {
      alert("이미 추가된 장소입니다!");
      return;
    }
    setSavedPlaces([...savedPlaces, place]);
  };

  // 장소 삭제
  const removePlace = (placeId: string) => {
    if (confirm("이 장소를 삭제하시겠습니까?")) {
      setSavedPlaces(savedPlaces.filter((p) => p.id !== placeId));
    }
  };

  // 메모 수정
  const updateMemo = (placeId: string, memo: string) => {
    setSavedPlaces(
      savedPlaces.map((p) => (p.id === placeId ? { ...p, memo } : p))
    );
  };

  // AI 일정 생성 버튼 클릭
  const handleOpenAiModal = () => {
    if (savedPlaces.length === 0) {
      alert("장소를 먼저 추가해주세요!");
      return;
    }
    setIsAiModalOpen(true);
  };

  // AI 일정 생성 실행
  const handleGenerateSchedule = (settings: any) => {
    console.log("AI 일정 생성 설정:", settings);
    console.log("선택된 장소:", savedPlaces);
    
    // 타임라인 노드 타입 (장소 정보 포함)
    interface TimelineNode {
      time: string;
      title: string;
      desc: string;
      placeInfo?: {
        name: string;
        imageUrl?: string;
        address?: string;
        rating?: number;
        category?: string;
        description?: string;
        memo?: string;
      };
    }
    
    // 임시로 AI 생성된 일정 데이터 (실제로는 API에서 받아옴)
    const generatedSchedule: Record<string, TimelineNode[]> = {
      "DAY 1": [
        { 
          time: "09:00", 
          title: savedPlaces[0]?.name || "경복궁", 
          desc: savedPlaces[0]?.description || "조선시대 대표 궁궐 관람",
          placeInfo: savedPlaces[0] ? {
            name: savedPlaces[0].name,
            imageUrl: savedPlaces[0].imageUrl,
            address: savedPlaces[0].address,
            rating: savedPlaces[0].rating,
            category: savedPlaces[0].category,
            description: savedPlaces[0].description,
            memo: savedPlaces[0].memo,
          } : undefined
        },
        { 
          time: "11:30", 
          title: savedPlaces[1]?.name || "광장시장", 
          desc: savedPlaces[1]?.description || "빈대떡과 마약김밥 점심",
          placeInfo: savedPlaces[1] ? {
            name: savedPlaces[1].name,
            imageUrl: savedPlaces[1].imageUrl,
            address: savedPlaces[1].address,
            rating: savedPlaces[1].rating,
            category: savedPlaces[1].category,
            description: savedPlaces[1].description,
            memo: savedPlaces[1].memo,
          } : undefined
        },
        { 
          time: "14:00", 
          title: savedPlaces[2]?.name || "북촌한옥마을", 
          desc: savedPlaces[2]?.description || "전통 한옥 마을 산책",
          placeInfo: savedPlaces[2] ? {
            name: savedPlaces[2].name,
            imageUrl: savedPlaces[2].imageUrl,
            address: savedPlaces[2].address,
            rating: savedPlaces[2].rating,
            category: savedPlaces[2].category,
            description: savedPlaces[2].description,
            memo: savedPlaces[2].memo,
          } : undefined
        },
        { 
          time: "16:00", 
          title: savedPlaces[4]?.name || "카페 온지음", 
          desc: savedPlaces[4]?.description || "한옥 카페에서 휴식",
          placeInfo: savedPlaces[4] ? {
            name: savedPlaces[4].name,
            imageUrl: savedPlaces[4].imageUrl,
            address: savedPlaces[4].address,
            rating: savedPlaces[4].rating,
            category: savedPlaces[4].category,
            description: savedPlaces[4].description,
            memo: savedPlaces[4].memo,
          } : undefined
        },
        { 
          time: "18:30", 
          title: "저녁 식사", 
          desc: "명동에서 맛집 탐방" 
        },
      ],
      "DAY 2": [
        { 
          time: "10:00", 
          title: savedPlaces[3]?.name || "통인시장", 
          desc: savedPlaces[3]?.description || "도시락카페에서 아침",
          placeInfo: savedPlaces[3] ? {
            name: savedPlaces[3].name,
            imageUrl: savedPlaces[3].imageUrl,
            address: savedPlaces[3].address,
            rating: savedPlaces[3].rating,
            category: savedPlaces[3].category,
            description: savedPlaces[3].description,
            memo: savedPlaces[3].memo,
          } : undefined
        },
        { 
          time: "12:30", 
          title: savedPlaces[5]?.name || "명동 쇼핑거리", 
          desc: savedPlaces[5]?.description || "화장품 쇼핑",
          placeInfo: savedPlaces[5] ? {
            name: savedPlaces[5].name,
            imageUrl: savedPlaces[5].imageUrl,
            address: savedPlaces[5].address,
            rating: savedPlaces[5].rating,
            category: savedPlaces[5].category,
            description: savedPlaces[5].description,
            memo: savedPlaces[5].memo,
          } : undefined
        },
        { 
          time: "15:00", 
          title: "카페 타임", 
          desc: "명동 주변 카페에서 휴식" 
        },
        { 
          time: "17:30", 
          title: savedPlaces[6]?.name || "N서울타워", 
          desc: savedPlaces[6]?.description || "석양과 야경 감상",
          placeInfo: savedPlaces[6] ? {
            name: savedPlaces[6].name,
            imageUrl: savedPlaces[6].imageUrl,
            address: savedPlaces[6].address,
            rating: savedPlaces[6].rating,
            category: savedPlaces[6].category,
            description: savedPlaces[6].description,
            memo: savedPlaces[6].memo,
          } : undefined
        },
        { 
          time: "20:00", 
          title: "여행 마무리", 
          desc: "남산 근처에서 저녁 식사" 
        },
      ]
    };
    
    // localStorage의 timeline 데이터 가져오기
    const existingData = localStorage.getItem("tripmoa_timeline_data");
    let timelineData: Record<string, TimelineNode[]> = existingData ? JSON.parse(existingData) : {};
    
    // 생성된 일정을 localStorage에 저장
    Object.keys(generatedSchedule).forEach(dayKey => {
      timelineData[dayKey] = generatedSchedule[dayKey];
    });
    
    localStorage.setItem("tripmoa_timeline_data", JSON.stringify(timelineData));
    
    // dateLogs에 DAY 1, DAY 2가 없으면 추가
    const existingDateLogs = localStorage.getItem("tripmoa_date_logs");
    let dateLogs = existingDateLogs ? JSON.parse(existingDateLogs) : [];
    
    ["DAY 1", "DAY 2"].forEach(day => {
      if (!dateLogs.includes(day)) {
        dateLogs.push(day);
      }
    });
    
    localStorage.setItem("tripmoa_date_logs", JSON.stringify(dateLogs));
    
    alert("AI 일정이 생성되었습니다! DAY 1 탭에서 확인하세요.");
    setIsAiModalOpen(false);
    
    // 페이지 새로고침하여 사이드바에 DAY 1, DAY 2 표시
    window.location.reload();
  };

  // 카테고리 필터링
  const filteredPlaces =
    category === "all"
      ? savedPlaces
      : savedPlaces.filter((p) => p.category === category);

  // 카테고리별 아이콘
  const getCategoryIcon = (cat: string) => {
    const icons: { [key: string]: string } = {
      맛집: "🍴",
      카페: "☕",
      관광: "🏛️",
      쇼핑: "🛍️",
      숙소: "🏨",
    };
    return icons[cat] || "📍";
  };

  return (
    <>
      <div className="my-places-view">
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
              MY SAVED PLACES ({savedPlaces.length})
            </h2>
            <p
              style={{
                color: "#666",
                marginTop: "5px",
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
              }}
            >
              {startDate} - {endDate}
            </p>
          </div>

          {/* 버튼 그룹 */}
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <button
              style={{
                padding: "10px 20px",
                background: "#fff",
                color: "#000",
                border: "2px solid #000",
                fontWeight: "bold",
                fontSize: "14px",
                cursor: "pointer",
                transition: "0.2s",
                borderRadius: "4px",
              }}
              onClick={() => setIsAddModalOpen(true)}
            >
              + 새 장소 추가
            </button>

            {savedPlaces.length > 0 && (
              <button
                className="btn-generate-schedule"
                onClick={handleOpenAiModal}
                style={{
                  padding: "10px 20px",
                  background: "#000",
                  color: "#fff",
                  border: "2px solid #000",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                ✨ AI 일정 생성
              </button>
            )}
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div
          className="filter-group"
          style={{ marginBottom: "20px", gap: "8px" }}
        >
          {["all", "맛집", "카페", "관광", "쇼핑", "숙소"].map((cat) => (
            <button
              key={cat}
              className={`filter-tag ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat === "all" ? "전체" : cat}
            </button>
          ))}
        </div>

        {/* 장소 리스트 */}
        {filteredPlaces.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#999",
            }}
          >
            <p style={{ fontSize: "16px", marginBottom: "10px" }}>
              📍 아직 추가된 장소가 없습니다
            </p>
            <p style={{ fontSize: "14px" }}>
              '새 장소 추가' 버튼을 눌러 여행지를 추가해보세요!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                className="tl-box"
                style={{
                  padding: "20px",
                  display: "flex",
                  gap: "15px",
                  alignItems: "flex-start",
                }}
              >
                {/* 이미지 */}
                {place.imageUrl && (
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "#eee",
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

                {/* 정보 */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        background: "#000",
                        color: "#fff",
                        padding: "3px 10px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        borderRadius: "4px",
                      }}
                    >
                      {getCategoryIcon(place.category)} {place.category}
                    </span>
                    {place.rating && (
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#ff9800",
                          fontWeight: "bold",
                        }}
                      >
                        ⭐ {place.rating}
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      margin: "0 0 6px 0",
                    }}
                  >
                    {place.name}
                  </h3>

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      margin: "0 0 10px 0",
                    }}
                  >
                    📍 {place.address}
                  </p>

                  {place.description && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#888",
                        margin: "0 0 10px 0",
                      }}
                    >
                      {place.description}
                    </p>
                  )}

                  {/* 메모 영역 */}
                  <div style={{ marginTop: "10px" }}>
                    <textarea
                      placeholder="💭 메모를 작성하세요..."
                      value={place.memo || ""}
                      onChange={(e) => updateMemo(place.id, e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: "60px",
                        padding: "10px",
                        border: "2px solid #eee",
                        borderRadius: "6px",
                        fontSize: "13px",
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => removePlace(place.id)}
                  style={{
                    padding: "8px 15px",
                    background: "#fff",
                    color: "#ff5252",
                    border: "2px solid #ff5252",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#ff5252";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.color = "#ff5252";
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 장소 추가 모달 */}
      {isAddModalOpen && (
        <AddPlaceModal
          onClose={() => setIsAddModalOpen(false)}
          onAddPlace={handleAddPlace}
          existingPlaces={savedPlaces}
        />
      )}

      {/* AI 일정 생성 모달 */}
      {isAiModalOpen && (
        <AiScheduleModal
          onClose={() => setIsAiModalOpen(false)}
          onGenerate={handleGenerateSchedule}
          savedPlaces={savedPlaces}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </>
  );
};

export default DayAllView;