import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./shared/components/Layout";

import Home from "./pages/Home";
import MyTrips from "./pages/MyTrips";
import Community from "./pages/Community";
import Mate from "./features/mate/pages/Mate";
import MateDetail from "./features/mate/pages/MateDetail"
import { Workspace } from "./features/workspace/pages";
import TravelStory from './features/travelStory/pages/TravelStory';
import Login from "./features/user/pages/Login";
import UserSettings from "./features/user/pages/UserSetting";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setting" element={<UserSettings />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/mytrips" element={<MyTrips />} />
        <Route path="/community" element={<Community />} />
        <Route path="/mate" element={<Mate />} />
        <Route path="/mate/:postId" element={<MateDetail />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/travelstory" element={<TravelStory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
