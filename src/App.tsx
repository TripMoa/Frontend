import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";

import Community from "./pages/Community";
import Home from "./pages/Home";
import MyTrips from "./pages/MyTrips";
import Mate from "./pages/Mate";
import Workspace from "./pages/Workspace";
import TravelStory from "./pages/TravelStory";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
      <Route path="/community" element={<Community/>} />
        <Route path="/" element={<Home />} />
        <Route path="/mytrips" element={<MyTrips />} />
        <Route path="/travelstory" element={<TravelStory/>} />
        <Route path="/mate" element={<Mate />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
