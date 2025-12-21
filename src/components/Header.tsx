import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
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
          <li className="nav-group">
            <button className="nav-item" type="button">
              COMMUNITY ▼
            </button>
            <div className="dropdown-menu">
              <a href="/community">{">>"} DATA LOGS</a>
              <a href="/mate">{">>"} MATE FINDER</a>
            </div>
          </li>

          <li className="nav-group">
            <button className="nav-item" type="button">
              MY PLAN ▼
            </button>
            <div className="dropdown-menu">
              <a href="/mytrips">{">>"} ALL</a>
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
