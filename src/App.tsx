import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import DrillList from "@/pages/drills/DrillList";
import ArchiveCenter from "@/pages/drills/ArchiveCenter";
import PersonnelList from "@/pages/personnel/PersonnelList";
import ScenarioList from "@/pages/scenarios/ScenarioList";
import DeviceList from "@/pages/devices/DeviceList";
import ScoreList from "@/pages/scores/ScoreList";
import HazardList from "@/pages/hazards/HazardList";
import AnnouncementList from "@/pages/announcements/AnnouncementList";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="drills" element={<DrillList />} />
          <Route path="archives" element={<ArchiveCenter />} />
          <Route path="personnel" element={<PersonnelList />} />
          <Route path="scenarios" element={<ScenarioList />} />
          <Route path="devices" element={<DeviceList />} />
          <Route path="scores" element={<ScoreList />} />
          <Route path="hazards" element={<HazardList />} />
          <Route path="announcements" element={<AnnouncementList />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
