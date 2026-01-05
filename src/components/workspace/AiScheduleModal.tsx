import React, { useState } from "react";
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

interface AiScheduleSettings {
  startTime: string; // 여행 시작 시간 (HH:MM)
  endTime: string; // 여행 종료 시간 (HH:MM)
  transportMode: "walk" | "public" | "car"; // 이동 수단
  stayDuration: number; // 장소당 평균 체류 시간 (분)
  includeMeals: boolean; // 식사 시간 포함 여부
  mealDuration: number; // 식사 시간 (분)
  includeBreaks: boolean; // 휴식 시간 포함 여부
  breakDuration: number; // 휴식 시간 (분)
  priority: "efficiency" | "relaxed" | "balanced"; // 일정 우선순위
  preferences: string; // 추가 선호사항
}

interface AiScheduleModalProps {
  onClose: () => void;
  onGenerate: (settings: AiScheduleSettings) => void;
  savedPlaces: Place[];
  startDate: string;
  endDate: string;
}

const AiScheduleModal: React.FC<AiScheduleModalProps> = ({
  onClose,
  onGenerate,
  savedPlaces,
  startDate,
  endDate,
}) => {
  const [settings, setSettings] = useState<AiScheduleSettings>({
    startTime: "09:00",
    endTime: "20:00",
    transportMode: "public",
    stayDuration: 60,
    includeMeals: true,
    mealDuration: 60,
    includeBreaks: true,
    breakDuration: 30,
    priority: "balanced",
    preferences: "",
  });

  const handleSubmit = () => {
    // 유효성 검사
    if (settings.startTime >= settings.endTime) {
      alert("종료 시간은 시작 시간보다 늦어야 합니다!");
      return;
    }

    onGenerate(settings);
  };

  const updateSetting = <K extends keyof AiScheduleSettings>(
    key: K,
    value: AiScheduleSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
        style={{ width: "90%", maxWidth: "700px", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="modal-header">
          <span className="mh-title">&gt;&gt; AI 일정 생성 설정</span>
          <button className="mh-close" onClick={onClose}>
            CLOSE [X]
          </button>
        </div>

        {/* 바디 */}
        <div
          className="modal-body"
          style={{
            padding: "30px",
            overflowY: "auto",
            maxHeight: "calc(90vh - 140px)",
          }}
        >
          {/* 선택된 장소 정보 */}
          <div
            style={{
              background: "#f5f5f5",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "25px",
              border: "2px solid #ddd",
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: "bold",
                fontSize: "14px",
                color: "#333",
              }}
            >
              📍 선택된 장소: {savedPlaces.length}개
            </p>
            <p
              style={{
                margin: "5px 0 0 0",
                fontSize: "13px",
                color: "#666",
              }}
            >
              {startDate} ~ {endDate}
            </p>
          </div>

          {/* 설정 폼 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {/* 시간 설정 */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "10px",
                  color: "#333",
                }}
              >
                ⏰ 여행 시간대
              </label>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={settings.startTime}
                    onChange={(e) => updateSetting("startTime", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <span style={{ fontWeight: "bold", color: "#999" }}>~</span>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={settings.endTime}
                    onChange={(e) => updateSetting("endTime", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 이동 수단 */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "10px",
                  color: "#333",
                }}
              >
                🚗 이동 수단
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  { value: "walk", label: "도보 🚶", desc: "가까운 거리 위주" },
                  { value: "public", label: "대중교통 🚇", desc: "지하철/버스" },
                  { value: "car", label: "자동차 🚗", desc: "렌터카/택시" },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() =>
                      updateSetting(
                        "transportMode",
                        mode.value as "walk" | "public" | "car"
                      )
                    }
                    style={{
                      flex: 1,
                      padding: "12px",
                      background:
                        settings.transportMode === mode.value ? "#000" : "#fff",
                      color:
                        settings.transportMode === mode.value ? "#fff" : "#000",
                      border: "2px solid #000",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "0.2s",
                      textAlign: "center",
                    }}
                  >
                    <div>{mode.label}</div>
                    <div
                      style={{
                        fontSize: "11px",
                        marginTop: "3px",
                        opacity: 0.8,
                      }}
                    >
                      {mode.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 장소당 체류 시간 */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "10px",
                  color: "#333",
                }}
              >
                ⏱️ 장소당 평균 체류 시간
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="15"
                  value={settings.stayDuration}
                  onChange={(e) =>
                    updateSetting("stayDuration", Number(e.target.value))
                  }
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    minWidth: "80px",
                    textAlign: "right",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  {settings.stayDuration}분
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "#999",
                  marginTop: "5px",
                }}
              >
                <span>빠르게 (30분)</span>
                <span>여유롭게 (180분)</span>
              </div>
            </div>

            {/* 식사 시간 포함 */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.includeMeals}
                  onChange={(e) =>
                    updateSetting("includeMeals", e.target.checked)
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                  }}
                />
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  🍽️ 식사 시간 포함
                </span>
              </label>
              {settings.includeMeals && (
                <div
                  style={{
                    marginTop: "10px",
                    marginLeft: "28px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <label style={{ fontSize: "13px", color: "#666" }}>
                    식사당 시간:
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="120"
                    step="15"
                    value={settings.mealDuration}
                    onChange={(e) =>
                      updateSetting("mealDuration", Number(e.target.value))
                    }
                    style={{
                      width: "80px",
                      padding: "8px",
                      border: "2px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "#666" }}>분</span>
                </div>
              )}
            </div>

            {/* 휴식 시간 포함 */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.includeBreaks}
                  onChange={(e) =>
                    updateSetting("includeBreaks", e.target.checked)
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                  }}
                />
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  ☕ 휴식 시간 포함
                </span>
              </label>
              {settings.includeBreaks && (
                <div
                  style={{
                    marginTop: "10px",
                    marginLeft: "28px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <label style={{ fontSize: "13px", color: "#666" }}>
                    휴식 시간:
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="60"
                    step="15"
                    value={settings.breakDuration}
                    onChange={(e) =>
                      updateSetting("breakDuration", Number(e.target.value))
                    }
                    style={{
                      width: "80px",
                      padding: "8px",
                      border: "2px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "#666" }}>분</span>
                </div>
              )}
            </div>

            {/* 일정 스타일 */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "10px",
                  color: "#333",
                }}
              >
                🎯 일정 스타일
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  {
                    value: "efficiency",
                    label: "효율적",
                    desc: "많은 곳을 방문",
                  },
                  {
                    value: "balanced",
                    label: "균형잡힌",
                    desc: "적당한 페이스",
                  },
                  { value: "relaxed", label: "여유로운", desc: "느긋하게 즐기기" },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() =>
                      updateSetting(
                        "priority",
                        mode.value as "efficiency" | "balanced" | "relaxed"
                      )
                    }
                    style={{
                      flex: 1,
                      padding: "12px",
                      background:
                        settings.priority === mode.value ? "#000" : "#fff",
                      color: settings.priority === mode.value ? "#fff" : "#000",
                      border: "2px solid #000",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "0.2s",
                      textAlign: "center",
                    }}
                  >
                    <div>{mode.label}</div>
                    <div
                      style={{
                        fontSize: "11px",
                        marginTop: "3px",
                        opacity: 0.8,
                      }}
                    >
                      {mode.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 추가 선호사항 */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "10px",
                  color: "#333",
                }}
              >
                💬 추가 선호사항 (선택)
              </label>
              <textarea
                placeholder="예: 아침은 가볍게, 저녁은 여유롭게 먹고 싶어요.
실내 관광지를 우선적으로 배치해주세요."
                value={settings.preferences}
                onChange={(e) => updateSetting("preferences", e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "12px",
                  border: "2px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "13px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div
          style={{
            padding: "20px 30px",
            borderTop: "2px solid #eee",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "12px 25px",
              background: "#fff",
              color: "#000",
              border: "2px solid #000",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "12px 25px",
              background: "#000",
              color: "#fff",
              border: "2px solid #000",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            ✨ AI 일정 생성하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiScheduleModal;