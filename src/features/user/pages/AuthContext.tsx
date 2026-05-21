// src/features/user/pages/AuthContext.tsx

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { getMyInfo } from "../../../api/auth.api";
import {
  clearAuthState,
  tryRefreshAuth,
  type AuthLogoutReason,
  notifyAuthLogout,
} from "../../../api/api";
import { getMySanctionStatus } from "../../../api/sanction.api";
import { markWarningPopupRead } from "../../../api/sanction.api";
import type { UserResponse } from "../../../types/auth.types";
import { ActionPromptModal } from "../../../shared/components/ActionPromptModal";

type AuthContextType = {
  isAuthenticated: boolean;
  authReady: boolean;
  userId: number | null;
  profile: UserResponse | null;
  setProfile: (profile: UserResponse | null) => void;
  logoutMessage: string | null;
  setAuthenticated: (value: boolean) => void;
  setUserId: (id: number | null) => void;
  refreshAuth: () => Promise<boolean>;
  clearAuth: () => void;
  clearLogoutMessage: () => void;
};

type AuthLogoutEventDetail = {
  reason?: AuthLogoutReason;
};

const LOGOUT_SYNC_KEY = "logout-event";

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_PATHS = ["/", "/login", "/travelstory", "/mate"];

const isPublicPath = () => {
  return PUBLIC_PATHS.some((path) => location.pathname === path);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const didBootstrap = useRef(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [logoutHeadline, setLogoutHeadline] = useState("계정 이용 제한");

  /**
   * 클라이언트 인증 상태 초기화 후 비로그인 상태 전환
   */
  const clearAuth = useCallback(() => {
    clearAuthState();
    setIsAuthenticated(false);
    setUserId(null);
    setProfile(null);
  }, []);

  const clearLogoutMessage = useCallback(() => {
    setLogoutMessage(null);
    setLogoutHeadline("계정 이용 제한");
  }, []);
  /**
   * refreshToken 쿠키 기준으로 인증 상태 복구
   */
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const refreshed = await tryRefreshAuth();

    if (!refreshed) {
      clearAuth();
      return false;
    }

    try {
      const response = await getMyInfo();
      setUserId(response.data.id);
      setProfile(response.data);
      setIsAuthenticated(true);
      return true;
    } catch {
      clearAuth();
      return false;
    }
  }, [clearAuth]);

  /**
   * 앱 최초 진입 시 1회 인증 부트스트랩
   */
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;

    const checkSanction = async () => {
      try {
        const res = await getMySanctionStatus();

        if (res.data.showWarningPopup) {
          setWarningMessage(res.data.warningMessage);
          setShowWarningModal(true);
        }
      } catch (e) {
        console.error("제재 상태 조회 실패", e);
      }
    };

    const runBootstrap = async () => {
      const success = await refreshAuth();

      if (success) {
        await checkSanction();
      }

      if (!success && isPublicPath()) {
        setLogoutMessage(null);
      }

      setAuthReady(true);
    };

    runBootstrap();
  }, [refreshAuth]);

  /**
   * auth:logout 이벤트 수신
   * - 현재 탭의 인증 상태 초기화
   * - 로그아웃 사유에 따라 사용자 안내 메시지 분기
   */
  useEffect(() => {
    const handleLogout = (event: Event) => {
      const customEvent = event as CustomEvent<AuthLogoutEventDetail>;
      const reason = customEvent.detail?.reason;

      clearAuth();

      if (reason === "refresh-expired") {
        if (isPublicPath()) {
          setLogoutMessage(null);
          return;
        }

        setLogoutHeadline("세션 만료");
        setLogoutMessage("세션이 만료되어 다시 로그인해주세요.");
        return;
      }

      if (reason === "remote-tab") {
        setLogoutMessage(
          "다른 탭에서 로그아웃되어 현재 탭도 로그아웃되었습니다.",
        );
        return;
      }

      if (reason === "withdraw") {
        setLogoutHeadline("회원 탈퇴 완료");
        setLogoutMessage("회원 탈퇴가 정상적으로 완료되었습니다.");
        return;
      }

      if (reason === "suspended") {
        setLogoutHeadline("계정 이용 제한");
        setLogoutMessage(
          `신고 정책으로 정지된 계정입니다.\n문의가 필요한 경우 고객센터 이메일로 문의해주세요.\n${import.meta.env.VITE_SUPPORT_EMAIL}`,
        );
        return;
      }

      setLogoutMessage(null);
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [clearAuth]);

  /**
   * 다른 탭에서 발생한 로그아웃을 감지하여 현재 탭도 동기화
   * storage 이벤트는 값을 쓴 탭이 아닌 "다른 탭"에서만 발생한다.
   */
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOGOUT_SYNC_KEY || !event.newValue) return;

      try {
        const parsed = JSON.parse(event.newValue) as {
          reason?: "manual" | "withdraw";
          timestamp?: number;
        };

        if (parsed.reason === "withdraw") {
          notifyAuthLogout("withdraw");
          return;
        }

        notifyAuthLogout("remote-tab");
      } catch {
        notifyAuthLogout("remote-tab");
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleCloseWarning = async () => {
    await markWarningPopupRead();
    setShowWarningModal(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authReady,
        userId,
        profile,
        setProfile,
        logoutMessage,
        setUserId,
        setAuthenticated: setIsAuthenticated,
        refreshAuth,
        clearAuth,
        clearLogoutMessage,
      }}
    >
      {children}

      <ActionPromptModal
        open={showWarningModal}
        title="서비스 이용 경고"
        headline="신고가 누적되었습니다"
        description={
          (warningMessage ??
            "신고가 누적되었습니다.\n반복될 경우 서비스 이용이 제한될 수 있습니다.") +
          "\n\n문의가 필요한 경우 마이페이지 > 신고 관리 탭에서\n이메일 문의 기능을 이용해주세요."
        }
        confirmText="확인했습니다"
        onClose={handleCloseWarning}
        onConfirm={handleCloseWarning}
      />

      <ActionPromptModal
        open={!!logoutMessage}
        title="서비스 이용 안내"
        headline={logoutHeadline}
        description={logoutMessage ?? ""}
        confirmText="확인"
        onClose={clearLogoutMessage}
        onConfirm={clearLogoutMessage}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
