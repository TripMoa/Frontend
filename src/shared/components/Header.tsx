// src/shared/components/Header.tsx

import { useNavigate } from "react-router-dom";
import { logout } from "../../api/auth.api";
import { useAuth } from "../../features/user/pages/AuthContext";
import { useUserProfile } from "../../features/user/hooks/useUserSetting";

function HeaderProfileMenu() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  const fallbackProfile = {
    avatarEmoji: "😊",
    avatarColor: "#FFE5E5",
    profileImage: null,
  };

  const displayProfile = profile ?? fallbackProfile;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleSettingsClick = () => {
    navigate("/setting");
  };

  return (
    <>
      <button className="nav-item btn-profile" type="button">
        <div
          className="profile-circle"
          style={{
            background: displayProfile.profileImage
              ? "transparent"
              : displayProfile.avatarColor,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {displayProfile.profileImage ? (
            <img
              src={displayProfile.profileImage}
              alt="Profile"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span style={{ fontSize: "1.2rem" }}>
              {displayProfile.avatarEmoji}
            </span>
          )}
        </div>
      </button>

      <div className="dropdown-menu dropdown-right">
        <button onClick={handleSettingsClick} className="dropdown-item-btn">
          {">>"} SETTINGS
        </button>
        <button onClick={handleLogout} className="dropdown-item-btn">
          {">>"} LOGOUT
        </button>
      </div>
    </>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, authReady } = useAuth();

  const handleLogoClick = () => navigate("/");

  const handlePlanClick = () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { message: "로그인 이후 이용 가능합니다.", from: "/mytrips" },
      });
      return;
    }

    navigate("/mytrips");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <header>
      <div className="logo" onClick={handleLogoClick}>
        TRIPMOA <span>SYS.</span>
      </div>

      <nav>
        <ul>
          <li className="nav-group">
            <button
              className="nav-item"
              type="button"
              onClick={handlePlanClick}
            >
              MY PLAN ❯
            </button>
          </li>

          <li className="nav-group">
            <button className="nav-item" type="button">
              COMMUNITY ▼
            </button>
            <div className="dropdown-menu">
              <a href="/travelstory">{">>"} DATA LOGS</a>
              <a href="/mate">{">>"} MATE FINDER</a>
            </div>
          </li>

          <li className="nav-group">
            {!authReady ? (
              <div style={{ width: "80px", height: "40px" }} />
            ) : !isAuthenticated ? (
              <button className="btn-login" type="button" onClick={handleLogin}>
                LOGIN
              </button>
            ) : (
              <HeaderProfileMenu />
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
