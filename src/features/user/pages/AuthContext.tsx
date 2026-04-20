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

type AuthContextType = {
  isAuthenticated: boolean;
  authReady: boolean;
  userId: number | null;
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const didBootstrap = useRef(false);

  /**
   * 클라이언트 인증 상태 초기화 후 비로그인 상태 전환
   */
  const clearAuth = useCallback(() => {
    clearAuthState();
    setIsAuthenticated(false);
    setUserId(null);
  }, []);

  const clearLogoutMessage = useCallback(() => {
    setLogoutMessage(null);
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

    const runBootstrap = async () => {
      await refreshAuth();
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
        setLogoutMessage("회원 탈퇴가 완료되었습니다.");
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

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authReady,
        userId,
        logoutMessage,
        setUserId,
        setAuthenticated: setIsAuthenticated,
        refreshAuth,
        clearAuth,
        clearLogoutMessage,
      }}
    >
      {children}
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
