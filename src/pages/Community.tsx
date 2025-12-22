import "../styles/Community.css";

export default function Community() {
  return (
    <section className="page-section">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="sec-title">VERIFIED DATA</h2>
            <p className="sec-desc">검증된 여행 작전 로그를 확인하십시오.</p>
          </div>

          <div style={{ fontFamily: "var(--font-mono)" }}>
            <button
              style={{ fontWeight: "bold", borderBottom: "2px solid #000" }}
            >
              ALL
            </button>
            <button style={{ color: "#999", marginLeft: "15px" }}>JAPAN</button>
            <button style={{ color: "#999", marginLeft: "15px" }}>
              EUROPE
            </button>
          </div>
        </div>

        <div className="card-grid">
          <div className="data-card">
            <div className="dc-img">
              <span className="dc-badge">OSAKA</span>
              <img src="https://picsum.photos/seed/osaka/400/300" />
            </div>
            <div className="dc-body">
              <div className="dc-meta">
                <span>ID: JP-505</span>
                <span>LIKES: 1.2K</span>
              </div>
              <h3 className="dc-title">오사카 식도락 3일</h3>
              <p className="dc-text">
                현지인 맛집 위주 동선. 웨이팅 회피 전략 포함.
              </p>
              <div className="dc-foot">
                <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                  BY. GOURMET
                </span>
                <button className="btn-sm">DOWNLOAD</button>
              </div>
            </div>
          </div>

          <div className="data-card">
            <div className="dc-img">
              <span className="dc-badge">PARIS</span>
              <img src="https://picsum.photos/seed/paris/400/300" />
            </div>
            <div className="dc-body">
              <div className="dc-meta">
                <span>ID: FR-007</span>
                <span>LIKES: 850</span>
              </div>
              <h3 className="dc-title">파리 에펠탑 피크닉</h3>
              <p className="dc-text">소매치기 방어 전술 및 인생샷 스팟 좌표.</p>
              <div className="dc-foot">
                <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                  BY. ROMANCE
                </span>
                <button className="btn-sm">DOWNLOAD</button>
              </div>
            </div>
          </div>

          <div className="data-card">
            <div className="dc-img">
              <span className="dc-badge">JEJU</span>
              <img src="https://picsum.photos/seed/jeju/400/300" />
            </div>
            <div className="dc-body">
              <div className="dc-meta">
                <span>ID: KR-064</span>
                <span>LIKES: 520</span>
              </div>
              <h3 className="dc-title">제주 동쪽 감성 투어</h3>
              <p className="dc-text">노키즈존 정보 및 주차 공간 첩보 수록.</p>
              <div className="dc-foot">
                <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                  BY. HEALER
                </span>
                <button className="btn-sm">DOWNLOAD</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
