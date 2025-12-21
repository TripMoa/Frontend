import "../styles/Mate.css";

export default function Mate() {
  return (
    <section className="page-section">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="sec-title">RECRUIT AGENTS</h2>
            <p className="sec-desc">함께 작전을 수행할 동료를 찾으십시오.</p>
          </div>
          <button
            className="btn-sm"
            style={{ height: "35px", background: "#000", color: "#fff" }}
          >
            + POST NEW
          </button>
        </div>

        <div className="mate-list">
          <div className="mate-ticket">
            <div className="mt-side">
              <span>FEB</span>
              <span>14</span>
            </div>
            <div className="mt-center">
              <div className="tag-wrap">
                <span className="sys-tag">SAPPORO</span>
                <span className="sys-tag">20s ONLY</span>
              </div>
              <h3 className="mt-tit">비에이 투어 사진 작전</h3>
              <p className="mt-txt">
                인생샷 상호 촬영 지원 요청. 신속한 합류 바람.
              </p>
            </div>
            <div className="mt-end">
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "5px",
                }}
              >
                2 / 4
              </div>
              <button className="btn-apply">APPLY</button>
            </div>
          </div>

          <div className="mate-ticket">
            <div className="mt-side">
              <span>SAT</span>
              <span>THIS</span>
            </div>
            <div className="mt-center">
              <div className="tag-wrap">
                <span className="sys-tag">BUSAN</span>
                <span className="sys-tag">URGENT</span>
              </div>
              <h3 className="mt-tit">부산 전포 카페거리 정찰</h3>
              <p className="mt-txt">빵 매니아 요원 급구. 차량 지원 가능.</p>
            </div>
            <div className="mt-end">
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "5px",
                }}
              >
                3 / 4
              </div>
              <button className="btn-apply">APPLY</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
