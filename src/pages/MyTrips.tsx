import { useState } from "react";
import "../styles/MyTrips.css";

type Visibility = "all" | "public" | "private";

export default function MyTrips() {
  const [filter, setFilter] = useState<Visibility>("all");

  const handleFilterClick = (type: Visibility) => {
    setFilter(type);
  };

  const handleFabClick = () => {
    // 원본 HTML의 openCreateModal()은 구현이 없음
    // 동작 보존 차원에서 "아무 것도 하지 않음"이 정석이나,
    // 사용자 피드백을 위해 최소 동작(alert)로 유지
    alert("NEW PLAN 생성 모달 (구현 예정)");
  };

  const isVisible = (v: Visibility) => filter === "all" || filter === v;

  return (
    <section className="page-section">
      {/* FAB */}
      <button className="fab-btn" onClick={handleFabClick}>
        <i className="fa-solid fa-plus"></i>
        <span className="fab-text">NEW PLAN</span>
      </button>

      <div className="container" id="trip-list-ui">
        <div className="section-header">
          <div>
            <h2 className="sec-title">MY PLAN BOARD</h2>
            <p className="sec-desc">수립된 여행 작전 목록입니다.</p>
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => handleFilterClick("all")}
            >
              ALL SECTORS
            </button>
            <button
              className={`filter-btn ${filter === "public" ? "active" : ""}`}
              onClick={() => handleFilterClick("public")}
            >
              PUBLIC
            </button>
            <button
              className={`filter-btn ${filter === "private" ? "active" : ""}`}
              onClick={() => handleFilterClick("private")}
            >
              PRIVATE
            </button>
          </div>
        </div>

        <div className="trip-grid">
          {/* CARD 1 */}
          {isVisible("private") && (
            <div
              className="mate-ticket trip-card"
              data-visibility="private"
              onClick={() => (window.location.href = "/workspace")}
            >
              <div
                className="mt-side"
                style={{
                  background: "#eee",
                  color: "#000",
                  borderRight: "2px solid #000",
                }}
              >
                <span style={{ fontWeight: "bold" }}>D-DAY</span>
                <span>10</span>
              </div>

              <div className="mt-center">
                <div className="top-badges">
                  <span
                    className="sys-tag"
                    style={{ background: "#000", color: "#fff" }}
                  >
                    PREPARING
                  </span>
                  <span className="sys-tag private">
                    <i className="fa-solid fa-lock"></i> PRIVATE
                  </span>
                </div>

                <h3 className="mt-tit">오사카 크리스마스 잠입</h3>
                <p className="mt-txt">2025.12.24 - 12.26 (2박 3일)</p>

                <div className="participants">
                  <span className="p-label">AGENTS:</span>
                  <div className="p-avatars">
                    <div
                      className="p-circle"
                      style={{ background: "#000", color: "#fff" }}
                    >
                      ME
                    </div>
                    <div className="p-circle">JIM</div>
                    <div className="p-circle">+1</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CARD 2 */}
          {isVisible("public") && (
            <div
              className="mate-ticket trip-card"
              data-visibility="public"
              style={{ opacity: 0.6 }}
              onClick={() => (window.location.href = "/workspace")}
            >
              <div
                className="mt-side"
                style={{
                  background: "#ddd",
                  color: "#555",
                  borderRight: "2px solid #000",
                }}
              >
                <span style={{ fontWeight: "bold" }}>STATUS</span>
                <span style={{ fontSize: "20px" }}>END</span>
              </div>

              <div className="mt-center">
                <div className="top-badges">
                  <span
                    className="sys-tag"
                    style={{
                      background: "#fff",
                      border: "1px solid #999",
                      color: "#555",
                    }}
                  >
                    COMPLETED
                  </span>
                  <span className="sys-tag public">
                    <i className="fa-solid fa-lock-open"></i> PUBLIC
                  </span>
                </div>

                <h3 className="mt-tit">가을 경주 힐링 작전</h3>
                <p className="mt-txt">2025.10.05 - 10.07</p>

                <div className="participants">
                  <span className="p-label">AGENTS:</span>
                  <div className="p-avatars">
                    <div
                      className="p-circle"
                      style={{ background: "#000", color: "#fff" }}
                    >
                      ME
                    </div>
                    <div className="p-circle">KIM</div>
                    <div className="p-circle">LEE</div>
                    <div className="p-circle">PARK</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
