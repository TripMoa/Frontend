import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  const handlePlanClick = () => {
    navigate("/mytrips"); // My Plan 클릭 시 바로 이동
  };

  const handleLoginClick = () => {
    // 원본 동작 없음 (유지)
  };

  return (
    <header>
      <div className="logo" onClick={handleLogoClick}>
        TRIPMOA <span>SYS.</span>
      </div>

      <nav>
        <ul>
          {/* 순서 변경 1: MY PLAN (토글 제거) */}
          <li className="nav-group">
            <button
              className="nav-item"
              type="button"
              onClick={handlePlanClick}
            >
              MY PLAN ❯
            </button>
          </li>

          {/* 순서 변경 2: COMMUNITY (드롭다운 유지) */}
          <li className="nav-group">
            <button className="nav-item" type="button">
              COMMUNITY ▼
            </button>
            <div className="dropdown-menu">
              <a href="/community">{">>"} DATA LOGS</a>
              <a href="/mate">{">>"} MATE FINDER</a>
            </div>
          </li>
        </ul>
      </nav>

      <button className="btn-login" type="button" onClick={handleLoginClick}>
        LOGIN
      </button>
    </header>
  );
}
