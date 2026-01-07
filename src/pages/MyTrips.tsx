"use client";

import { useState, useEffect } from "react";
import "../styles/MyTrips.css";

type Visibility = "all" | "public" | "private";

interface Trip {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  visibility: "public" | "private";
  invitees: string[];
}

export default function MyTrips() {
  const [filter, setFilter] = useState<Visibility>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteeInput, setInviteeInput] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    visibility: "private" as "public" | "private",
    invitees: [] as string[],
  });

  // 1. 데이터 로드 및 로컬스토리지 연동
  useEffect(() => {
    const saved = localStorage.getItem("my-trips");
    if (saved) {
      setTrips(JSON.parse(saved));
    } else {
      const sample: Trip[] = [
        {
          id: 1,
          title: "오사카 크리스마스 잠입",
          startDate: "2025-12-24",
          endDate: "2025-12-26",
          visibility: "private",
          invitees: ["JIM", "+1"],
        },
      ];
      setTrips(sample);
      localStorage.setItem("my-trips", JSON.stringify(sample));
    }
  }, []);

  useEffect(() => {
    if (trips.length > 0) {
      localStorage.setItem("my-trips", JSON.stringify(trips));
    }
  }, [trips]);

  // 2. 여행 삭제 함수 추가
  const removeTrip = (id: number) => {
    if (window.confirm("이 작전을 폐기하시겠습니까?")) {
      const updatedTrips = trips.filter((t) => t.id !== id);
      setTrips(updatedTrips);
      localStorage.setItem("my-trips", JSON.stringify(updatedTrips));
    }
  };

  // 3. D-Day 및 정렬 계산 함수
  const getTripInfo = (startDate: string, endDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today > end) return { isEnd: true, dDayText: "END", sortVal: 99999 };

    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isEnd: false,
      dDayText: diffDays <= 0 ? "DAY" : `${diffDays}`,
      sortVal: diffDays,
    };
  };

  // 4. 정렬: 가까운 날짜 순 -> 종료 작전 하단
  const sortedTrips = [...trips].sort((a, b) => {
    const infoA = getTripInfo(a.startDate, a.endDate);
    const infoB = getTripInfo(b.startDate, b.endDate);
    return infoA.sortVal - infoB.sortVal;
  });

  const handleFabClick = () => setIsModalOpen(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrip = { id: Date.now(), ...formData };
    setTrips([newTrip, ...trips]);
    setIsModalOpen(false);
    setFormData({
      title: "",
      startDate: "",
      endDate: "",
      visibility: "private",
      invitees: [],
    });
  };

  return (
    <section className="page-section">
      <button className="fab-btn" onClick={handleFabClick}>
        <i className="fa-solid fa-plus"></i>
        <span className="fab-text">NEW PLAN</span>
      </button>

      {/* 모달 UI */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: "500px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">CREATE NEW MISSION</h3>
              <button
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="input-group">
                <label>여행 제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="작전명을 입력하세요"
                  required
                />
              </div>
              <div className="date-row">
                <div className="input-group">
                  <label>출발 날짜</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="input-group">
                  <label>복귀 날짜</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label>공개 여부</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      checked={formData.visibility === "public"}
                      onChange={() =>
                        setFormData({ ...formData, visibility: "public" })
                      }
                    />
                    <span>PUBLIC</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      checked={formData.visibility === "private"}
                      onChange={() =>
                        setFormData({ ...formData, visibility: "private" })
                      }
                    />
                    <span>PRIVATE</span>
                  </label>
                </div>
              </div>
              <div className="input-group">
                <label>초대할 에이전트</label>
                <div className="invite-input-wrapper">
                  <input
                    type="text"
                    value={inviteeInput}
                    onChange={(e) => setInviteeInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(),
                      (formData.invitees.includes(inviteeInput) ||
                        setFormData({
                          ...formData,
                          invitees: [...formData.invitees, inviteeInput],
                        })) &&
                        setInviteeInput(""))
                    }
                    placeholder="아이디 입력"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      (formData.invitees.includes(inviteeInput) ||
                        setFormData({
                          ...formData,
                          invitees: [...formData.invitees, inviteeInput],
                        })) &&
                      setInviteeInput("")
                    }
                    className="add-invite-btn"
                  >
                    ADD
                  </button>
                </div>
                <div className="invitee-list">
                  {formData.invitees.map((name) => (
                    <span key={name} className="invitee-tag">
                      {name}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            invitees: formData.invitees.filter(
                              (i) => i !== name
                            ),
                          })
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <button type="submit" className="submit-btn">
                작전 수립 시작
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="container" id="trip-list-ui">
        <div className="section-header-neob">
          <div className="header-content">
            <h2 className="sec-title">MY PLAN BOARD</h2>
            <p className="sec-desc">수립된 여행 작전 목록입니다.</p>
          </div>

          <div className="filter-wrapper-neob">
            <div className="filter-tabs">
              {(["all", "public", "private"] as Visibility[]).map((type) => (
                <button
                  key={type}
                  className={`filter-btn ${filter === type ? "active" : ""}`}
                  onClick={() => setFilter(type)}
                >
                  {type === "all" ? "ALL SECTORS" : type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="trip-grid">
          {sortedTrips
            .filter((trip) => filter === "all" || trip.visibility === filter)
            .map((trip) => {
              const { isEnd, dDayText } = getTripInfo(
                trip.startDate,
                trip.endDate
              );

              return (
                <div
                  key={trip.id}
                  className="mate-ticket trip-card"
                  style={{
                    opacity: isEnd ? 0.6 : 1,
                    cursor: "pointer",
                    position: "relative",
                    zIndex: 1,
                  }}
                  onClick={() => window.location.assign("/workspace")}
                >
                  {/* 왼쪽 사이드 영역 */}
                  <div
                    className="mt-side"
                    style={{
                      background: isEnd ? "#eee" : "#000",
                      color: isEnd ? "#999" : "#fff",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      {isEnd ? "STATUS" : "D-DAY"}
                    </span>
                    <span style={{ fontSize: "24px", fontWeight: "900" }}>
                      {dDayText}
                    </span>
                  </div>

                  {/* 메인 정보 영역 */}
                  <div
                    className="mt-center"
                    style={{ flex: 1, padding: "20px" }}
                  >
                    <div
                      className="top-badges"
                      style={{ justifyContent: "space-between" }}
                    >
                      <div style={{ display: "flex", gap: "5px" }}>
                        <span
                          className="sys-tag"
                          style={{
                            background: isEnd ? "#fff" : "#000",
                            color: isEnd ? "#555" : "#fff",
                            border: isEnd ? "1px solid #999" : "none",
                          }}
                        >
                          {isEnd ? "COMPLETED" : "PREPARING"}
                        </span>
                        <span className={`sys-tag ${trip.visibility}`}>
                          <i
                            className={`fa-solid ${
                              trip.visibility === "private"
                                ? "fa-lock"
                                : "fa-lock-open"
                            }`}
                          ></i>{" "}
                          {trip.visibility.toUpperCase()}
                        </span>
                      </div>

                      {/* 삭제 버튼 추가: stopPropagation으로 카드 클릭 이벤트 전파 차단 */}
                      <button
                        className="delete-trip-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTrip(trip.id);
                        }}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>

                    <h3 className="mt-tit">{trip.title}</h3>
                    <p className="mt-txt">
                      {trip.startDate} - {trip.endDate}
                    </p>

                    <div className="participants">
                      <span className="p-label">AGENTS:</span>
                      <div className="p-avatars">
                        <div
                          className="p-circle"
                          style={{ background: "#000", color: "#fff" }}
                        >
                          ME
                        </div>
                        {trip.invitees.map((name, i) => (
                          <div key={i} className="p-circle">
                            {name.substring(0, 3)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
