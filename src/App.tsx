import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import StudyPage from "./pages/StudyPage";
import WordBookPage from "./pages/WordBookPage";
import WeakWordsPage from "./pages/WeakWordsPage";
import StatisticsPage from "./pages/StatisticsPage";
import SettingsPage from "./pages/SettingsPage";
import StudySummaryPage from "./pages/StudySummaryPage";

function AndroidBackHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const promise = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (location.pathname !== "/") {
        if (canGoBack && window.history.length > 1) navigate(-1);
        else navigate("/", { replace: true });
        return;
      }

      CapacitorApp.exitApp();
    });

    return () => {
      promise.then((listener) => listener.remove());
    };
  }, [location.pathname, navigate]);

  return null;
}

export default function App() {
  return (
    <div className="app-shell">
      <AndroidBackHandler />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<StudyPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/study/:mode" element={<StudyPage />} />
          <Route path="/summary" element={<StudySummaryPage />} />
          <Route path="/books" element={<WordBookPage />} />
          <Route path="/weak" element={<WeakWordsPage />} />
          <Route path="/stats" element={<StatisticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
