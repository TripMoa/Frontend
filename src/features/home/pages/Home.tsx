import "../styles/Home.css";

export default function Home() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert("여행 계획 생성 시작!");
  };

  return (
    <section className="page-section">
      <div className="container">
        {/* HERO */}
        <section className="hero-section">
          <div className="deco-tag">SYSTEM: READY</div>
          <h1 className="hero-title">
            Where is your
            <br />
            Next Destination?
          </h1>
          <p className="hero-desc">// 새로운 여행 작전 계획을 수립하십시오.</p>

          <form className="plan-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">TARGET LOCATION (여행지)</label>
              <input
                type="text"
                className="input-field"
                placeholder="예: 도쿄, 제주도, 뉴욕..."
              />
            </div>
            <div className="input-group">
              <label className="input-label">DEP. DATE (출발)</label>
              <input type="date" className="input-field" />
            </div>
            <div className="input-group">
              <label className="input-label">ARR. DATE (복귀)</label>
              <input type="date" className="input-field" />
            </div>
            <button type="submit" className="generate-btn">
              GENERATE {">"}
            </button>
          </form>
        </section>

        {/* MODULE 01 */}
        <div className="feature-row">
          <div className="feat-content">
            <span className="feat-tag">MODULE 01. SYNC</span>
            <h2 className="feat-title">
              함께 그리는
              <br />
              실시간 여행 지도
            </h2>
            <p className="feat-desc">
              친구를 초대해 동시에 계획을 세워보세요.
              <br />
              마치 게임처럼, 친구의 수정 사항이 실시간으로 눈앞에 펼쳐집니다.
            </p>
          </div>

          <div className="feat-visual">
            <div className="mock-box">
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "10px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                OSAKA_PLAN.map
              </div>
              <div className="mock-line"></div>
              <div className="mock-line short"></div>
              <div style={{ display: "flex", gap: "5px", marginTop: "15px" }}>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    background: "#000",
                    borderRadius: "50%",
                  }}
                ></div>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    background: "#aaa",
                    borderRadius: "50%",
                  }}
                ></div>
                <div
                  style={{
                    fontSize: "12px",
                    lineHeight: "20px",
                    fontWeight: "bold",
                  }}
                >
                  + User Joined
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODULE 02 */}
        <div className="feature-row reverse">
          <div className="feat-content">
            <span className="feat-tag">MODULE 02. AI-OPT</span>
            <h2 className="feat-title">
              AI가 찾아주는
              <br />
              최적의 루트
            </h2>
            <p className="feat-desc">
              가고 싶은 장소만 콕콕 집어주세요.
              <br />
              AI가 이동 시간과 거리를 계산해 가장 효율적인 여행 동선을 만들어
              드립니다.
            </p>
          </div>

          <div className="feat-visual">
            <div className="mock-box" style={{ width: "65%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                  borderBottom: "2px solid #000",
                  paddingBottom: "5px",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  AI_ROUTING...
                </span>
                <span
                  style={{
                    background: "#000",
                    color: "#fff",
                    fontSize: "10px",
                    padding: "2px 5px",
                  }}
                >
                  PROCESSING
                </span>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span
                    style={{ width: "8px", height: "8px", background: "#000" }}
                  ></span>
                  HOTEL (START)
                </div>
                <div
                  style={{
                    borderLeft: "2px dotted #aaa",
                    height: "15px",
                    marginLeft: "3px",
                  }}
                ></div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      border: "2px solid #000",
                      boxSizing: "border-box",
                    }}
                  ></span>
                  MUSEUM
                </div>
                <div
                  style={{
                    borderLeft: "2px dotted #aaa",
                    height: "15px",
                    marginLeft: "3px",
                  }}
                ></div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      border: "2px solid #000",
                      boxSizing: "border-box",
                    }}
                  ></span>
                  CAFE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODULE 03 */}
        <div className="feature-row">
          <div className="feat-content">
            <span className="feat-tag">MODULE 03. CALC</span>
            <h2 className="feat-title">
              1원 단위까지 확실한
              <br />
              자동 정산
            </h2>
            <p className="feat-desc">
              &quot;누가 얼마 냈지?&quot; 고민하지 마세요.
              <br />
              지출 내역만 입력하면 인원수에 맞춰 복잡한 계산을 자동으로
              끝내드립니다.
            </p>
          </div>

          <div className="feat-visual">
            <div className="mock-box" style={{ width: "60%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "2px dashed #000",
                  paddingBottom: "10px",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontWeight: "bold" }}>TOTAL</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: "bold",
                    fontSize: "18px",
                  }}
                >
                  ₩ 450,000
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                }}
              >
                <span>ME</span>
                <span style={{ color: "red" }}>- 12,500</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                }}
              >
                <span>FRIEND</span>
                <span style={{ color: "blue" }}>+ 12,500</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
