import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../api/auth.api";
import { useAuth } from "../../features/user/pages/AuthContext";
import { useAccessGuard } from "../hooks/useAccessGuard";
import { ActionPromptModal } from "./ActionPromptModal";

const MENU_ID = "tm-menu";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, authReady, profile } = useAuth();
  const { requireLogin, showLoginModal, closeLoginModal, moveToLogin } = useAccessGuard();

  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);

  const path = location.pathname;
  const isMyTrip = path.startsWith("/mytrips") || path.startsWith("/workspace");
  const isMate = path.startsWith("/mate");
  const isStory = path.startsWith("/travelstory");
  const menuOpen = menuOpenedAt === path;

  const closeMenu = useCallback((restoreFocus = true) => {
    setMenuOpenedAt(null);
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  const handleMyTripClick = (e: MouseEvent<HTMLAnchorElement>) => {
    setMenuOpenedAt(null);
    if (!requireLogin()) e.preventDefault();
  };

  const handleMyPageClick = () => {
    setMenuOpenedAt(null);
    navigate("/setting", { state: { closeTo: location.pathname + location.search } });
  };

  const handleLogout = async () => {
    setMenuOpenedAt(null);
    await logout();
    navigate("/", { replace: true });
  };

  const avatar = profile && (
    <span
      className="tm-avatar tm-avatar--sm app-header__avatar"
      style={{
        background: profile.profileType === "CUSTOM" ? "transparent" : profile.avatarColor || "#FFE5E5",
      }}
      aria-hidden="true"
    >
      {profile.profileType === "CUSTOM" && profile.profileImage ? (
        <img src={profile.profileImage} alt="" />
      ) : (
        profile.avatarEmoji || "😊"
      )}
    </span>
  );

  return (
    <>
      <header className="tm-header">
        <div className="tm-header__in">
          <Link to="/" className="tm-logo" aria-label="TRIPMOA 홈">TRIPMOA</Link>

          <nav className="tm-nav" aria-label="주요 메뉴">
            <Link
              to="/mytrips"
              className={`tm-nav__item ${isMyTrip ? "is-on" : ""}`}
              aria-current={isMyTrip ? "page" : undefined}
              onClick={handleMyTripClick}
            >
              내 여행
            </Link>
            <Link
              to="/mate"
              className={`tm-nav__item ${isMate ? "is-on" : ""}`}
              aria-current={isMate ? "page" : undefined}
            >
              동행 찾기
            </Link>
            <Link
              to="/travelstory"
              className={`tm-nav__item ${isStory ? "is-on" : ""}`}
              aria-current={isStory ? "page" : undefined}
            >
              여행기
            </Link>
          </nav>

          <div className="tm-header__right">
            {!authReady ? (
              <span className="app-header__account app-header__placeholder" aria-hidden="true" />
            ) : !isAuthenticated ? (
              <Link to="/login" className="tm-btn app-header__account">로그인</Link>
            ) : (
              <button type="button" className="tm-btn app-header__account" onClick={handleMyPageClick}>
                {avatar}
                마이페이지
              </button>
            )}
            <button
              ref={menuButtonRef}
              type="button"
              className="tm-menu-btn"
              aria-expanded={menuOpen}
              aria-controls={MENU_ID}
              onClick={() => setMenuOpenedAt(path)}
            >
              MENU ＋
            </button>
          </div>
        </div>
      </header>

      <div
        id={MENU_ID}
        className={`tm-menu-overlay ${menuOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="전체 메뉴"
        hidden={!menuOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeMenu();
        }}
      >
        <div className="tm-menu-overlay__in">
          <div className="tm-menu-overlay__head">
            <b>TRIPMOA</b>
            <button ref={menuCloseRef} type="button" className="tm-menu-close" onClick={() => closeMenu()}>
              닫기 ✕
            </button>
          </div>

          <div className="tm-menu-group">MY TRIP</div>
          <Link to="/mytrips" className="tm-menu-link" onClick={handleMyTripClick}>내 여행</Link>

          <div className="tm-menu-group">COMMUNITY</div>
          <Link to="/mate" className="tm-menu-link" onClick={() => setMenuOpenedAt(null)}>동행 찾기</Link>
          <Link to="/travelstory" className="tm-menu-link" onClick={() => setMenuOpenedAt(null)}>여행기</Link>

          <div className="tm-menu-group">ME</div>
          {isAuthenticated ? (
            <>
              <button type="button" className="tm-menu-link" onClick={handleMyPageClick}>마이페이지</button>
              <Link to="/notice" className="tm-menu-link" onClick={() => setMenuOpenedAt(null)}>공지사항</Link>
              <Link to="/faq" className="tm-menu-link" onClick={() => setMenuOpenedAt(null)}>FAQ</Link>
              <button type="button" className="tm-menu-link" onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <Link to="/login" className="tm-menu-link" onClick={() => setMenuOpenedAt(null)}>로그인</Link>
          )}
        </div>
      </div>

      <ActionPromptModal
        open={showLoginModal}
        title="로그인이 필요합니다"
        headline="로그인 후 이용할 수 있어요"
        description="내 여행은 로그인한 사용자만 이용할 수 있습니다."
        cancelText="취소"
        confirmText="로그인"
        onClose={closeLoginModal}
        onConfirm={moveToLogin}
      />
    </>
  );
}
