import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import MyTrips from "./pages/MyTrips";
import Community from "./pages/Community";
import Mate from "./pages/Mate";
import Workspace from "./pages/Workspace";
import TravelStory from './pages/TravelStory';
import Login from "./pages/Login";
import UserSettings from "./pages/UserSetting";

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
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/travelstory" element={<TravelStory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
