import { Navigate, Outlet } from "react-router-dom";

// 보호된 라우트를 위한 컴포넌트
const ProtectedRoute = () => {
  // 로컬 스토리지 액세스 토큰 확인
  const isLoggedIn = !!localStorage.getItem("accessToken");

  if (!isLoggedIn) {
    alert("로그인 이후 이용 가능합니다.");
    // 로그인 페이지로 강제 이동
    return <Navigate to="/login" replace />;
  }

  // 로그인 상태면 원래 가려던 페이지를 보여줌
  return <Outlet />;
};

export default ProtectedRoute;
