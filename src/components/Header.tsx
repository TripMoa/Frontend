import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  // 로그인 상태 관리 (임시)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogoClick = () => navigate("/");
  const handlePlanClick = () => navigate("/mytrips");

  // 로그인/로그아웃 핸들러
  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate("/");
  };

  // 설정 버튼 클릭 시 알림창
  const handleSettingsClick = () => {
    alert("준비 중인 기능입니다.");
  };

  return (
    <header>
      <div className="logo" onClick={handleLogoClick}>
        TRIPMOA <span>SYS.</span>
      </div>

      <nav>
        <ul>
          {/* 1. MY PLAN (순서 변경 & 단일 버튼) */}
          <li className="nav-group">
            <button
              className="nav-item"
              type="button"
              onClick={handlePlanClick}
            >
              MY PLAN ❯
            </button>
          </li>

          {/* 2. COMMUNITY (드롭다운) */}
          <li className="nav-group">
            <button className="nav-item" type="button">
              COMMUNITY ▼
            </button>
            <div className="dropdown-menu">
              <a href="/community">{">>"} DATA LOGS</a>
              <a href="/travelstory">{">>"} DATA LOGS</a>
              <a href="/mate">{">>"} MATE FINDER</a>
            </div>
          </li>

          {/* 3. LOGIN / PROFILE SECTION */}
          <li className="nav-group">
            {!isLoggedIn ? (
              <button className="btn-login" type="button" onClick={handleLogin}>
                LOGIN
              </button>
            ) : (
              <>
                <button className="nav-item btn-profile" type="button">
                  <div className="profile-circle"></div>
                </button>
                {/* 오른쪽 정렬 클래스 적용 */}
                <div className="dropdown-menu dropdown-right">
                  {/* 페이지 이동 대신 함수 호출 */}
                  <button
                    onClick={handleSettingsClick}
                    className="dropdown-item-btn"
                  >
                    {">>"} SETTINGS
                  </button>
                  <button onClick={handleLogout} className="dropdown-item-btn">
                    {">>"} LOGOUT
                  </button>
                </div>
              </>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
