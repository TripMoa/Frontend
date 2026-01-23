import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./shared/components/Layout";

import Home from "./pages/Home";
import MyTrips from "./pages/MyTrips";
import Mate from "./features/mate/pages/Mate";
import MateDetail from "./features/mate/pages/MateDetail";
import { Workspace } from "./features/workspace/pages";
import TravelStory from "./features/travelStory/pages/TravelStory";
import Login from "./features/user/pages/Login";
import UserSettings from "./features/user/pages/UserSetting";
import OAuthSuccess from "./features/user/pages/OAuthSuccess";
import ProtectedRoute from "./features/user/pages/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* 레이아웃 없는 페이지 */}
      <Route path="/login" element={<Login />} />
      <Route path="/oauth2/redirect" element={<OAuthSuccess />} />

      {/* 보호된 라우트: 설정 페이지 */}
      <Route element={<ProtectedRoute />}>
        <Route path="/setting" element={<UserSettings />} />
      </Route>

      {/* 레이아웃 있는 페이지 */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/mate" element={<Mate />} />
        <Route path="/mate/:postId" element={<MateDetail />} />
        <Route path="/travelstory" element={<TravelStory />} />

        {/* 보호된 라우트: 설정 페이지 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/mytrips" element={<MyTrips />} />
          <Route path="/workspace" element={<Workspace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
