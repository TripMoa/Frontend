// src/shared/components/Header.tsx

import { useNavigate } from "react-router-dom";
import { logout } from "../../api/auth.api";
import { useAuth } from "../../features/user/pages/AuthContext";
import { useAccessGuard } from "../hooks/useAccessGuard";
import { ActionPromptModal } from "./ActionPromptModal";

function HeaderProfileMenu() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleSettingsClick = () => {
    navigate("/setting", {
      state: { closeTo: location.pathname + location.search },
    });
  };

  if (!profile) {
    return <div style={{ width: "40px", height: "40px" }} />;
  }

  return (
    <>
      <button className="nav-item btn-profile" type="button">
        <div
          className="profile-circle"
          style={{
            background:
              profile.profileType === "CUSTOM"
                ? "transparent"
                : profile.avatarColor || "#FFE5E5",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {profile.profileType === "CUSTOM" && profile.profileImage ? (
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
              {profile.avatarEmoji || "😊"}
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
  const { requireLogin, showLoginModal, closeLoginModal, moveToLogin } =
    useAccessGuard();
  const handleLogoClick = () => navigate("/");

  const handlePlanClick = () => {
    if (!requireLogin()) return;

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
            <ActionPromptModal
              open={showLoginModal}
              title="로그인이 필요합니다"
              headline="로그인 후 이용할 수 있어요"
              description="게시글 작성은 로그인한 사용자만 이용할 수 있습니다."
              cancelText="취소"
              confirmText="로그인"
              onClose={closeLoginModal}
              onConfirm={moveToLogin}
            />
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
