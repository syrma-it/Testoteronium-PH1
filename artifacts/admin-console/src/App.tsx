import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import SetupPage from "./components/SetupPage";
import TrackedAssets from "./components/TrackedAssets";
import ManualAssets from "./components/ManualAssets";
import FetchingAssets from "./components/FetchingAssets";
import GeneratePatch from "./components/GeneratePatch";
import EnrollPage from "./components/EnrollPage";
import "./index.css";

const BASE = import.meta.env.BASE_URL;

export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/setup/tracked" element={<TrackedAssets />} />
        <Route path="/setup/manual" element={<ManualAssets />} />
        <Route path="/setup/fetching" element={<FetchingAssets />} />
        <Route path="/setup/patch" element={<GeneratePatch />} />
        <Route path="/enroll/:token" element={<EnrollPage />} />
      </Routes>
    </BrowserRouter>
  );
}
