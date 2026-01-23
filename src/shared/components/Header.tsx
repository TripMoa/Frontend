import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../../features/user/hooks/useUserSetting";
import { logout } from "../../api/auth.api";

export default function Header() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  // 로그인 상태 확인
  const isLoggedIn = !!localStorage.getItem("accessToken");

  const handleLogoClick = () => navigate("/");

  // MY PLAN 클릭 핸들러
  const handlePlanClick = () => {
    if (!isLoggedIn) {
      // 비로그인 시 알림창을 띄우고 로그인 페이지로 이동
      alert("로그인 이후 이용 가능합니다.");
      navigate("/login");
    } else {
      // 로그인 상태면 마이트립 페이지로 이동
      navigate("/mytrips");
    }
  };

  // 로그인 핸들러
  const handleLogin = () => {
    navigate("/login");
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  // 설정 버튼 클릭 핸들러
  const handleSettingsClick = () => {
    navigate("/setting");
  };

  return (
    <header>
      <div className="logo" onClick={handleLogoClick}>
        TRIPMOA <span>SYS.</span>
      </div>

      <nav>
        <ul>
          {/* MY PLAN */}
          <li className="nav-group">
            <button
              className="nav-item"
              type="button"
              onClick={handlePlanClick}
            >
              MY PLAN ❯
            </button>
          </li>

          {/* COMMUNITY */}
          <li className="nav-group">
            <button className="nav-item" type="button">
              COMMUNITY ▼
            </button>
            <div className="dropdown-menu">
              <a href="/travelstory">{">>"} DATA LOGS</a>
              <a href="/mate">{">>"} MATE FINDER</a>
            </div>
          </li>

          {/* LOGIN / PROFILE */}
          <li className="nav-group">
            {!isLoggedIn ? (
              <button className="btn-login" type="button" onClick={handleLogin}>
                LOGIN
              </button>
            ) : (
              isLoggedIn &&
              profile && (
                <>
                  <button className="nav-item btn-profile" type="button">
                    <div
                      className="profile-circle"
                      style={{
                        background: profile.profileImage
                          ? "transparent"
                          : profile.avatarColor,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {profile.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt="Profile"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "1.2rem" }}>
                          {profile.avatarEmoji}
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="dropdown-menu dropdown-right">
                    <button
                      onClick={handleSettingsClick}
                      className="dropdown-item-btn"
                    >
                      {">>"} SETTINGS
                    </button>
                    <button
                      onClick={handleLogout}
                      className="dropdown-item-btn"
                    >
                      {">>"} LOGOUT
                    </button>
                  </div>
                </>
              )
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
