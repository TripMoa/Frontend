// hooks/useAuthGuard.ts
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../chat/hooks/useCurrentUser";

export function useAuthGuard() {
  const { id } = useCurrentUser();
  const navigate = useNavigate();

  const withLoginCheck = (callback: () => void) => {
    if (!id) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    callback();
  };

  return { withLoginCheck };
}