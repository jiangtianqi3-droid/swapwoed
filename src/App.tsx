import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Route, Routes, useLocation, useNavigate, type Location } from "react-router-dom";
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

type RouteState = {
  backgroundLocation?: Location;
};

const routeAnimationClass = (pathname: string) => {
  if (pathname === "/summary") return "route-summary";
  if (pathname === "/" || pathname.startsWith("/study")) return "route-study";
  return "route-standard";
};

function AppRoutes() {
  const location = useLocation();
  const state = location.state as RouteState | null;
  const isSettingsOverlay = location.pathname === "/settings" && Boolean(state?.backgroundLocation);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [phase, setPhase] = useState<"entering" | "idle" | "exiting">("entering");
  const [keepSettingsOverlay, setKeepSettingsOverlay] = useState(false);
  const [settingsOverlayClosing, setSettingsOverlayClosing] = useState(false);

  useEffect(() => {
    if (isSettingsOverlay) return;
    if (location.key === displayLocation.key) {
      const enterTimer = window.setTimeout(() => setPhase("idle"), 260);
      return () => window.clearTimeout(enterTimer);
    }

    setPhase("exiting");
    const exitTimer = window.setTimeout(() => {
      setDisplayLocation(location);
      setPhase("entering");
    }, 170);

    return () => window.clearTimeout(exitTimer);
  }, [displayLocation.key, isSettingsOverlay, location]);

  useEffect(() => {
    if (phase !== "entering") return;
    const timer = window.setTimeout(() => setPhase("idle"), 260);
    return () => window.clearTimeout(timer);
  }, [phase, displayLocation.key]);

  const routeLocation = isSettingsOverlay ? state?.backgroundLocation ?? displayLocation : displayLocation;

  useEffect(() => {
    if (isSettingsOverlay) {
      setKeepSettingsOverlay(true);
      setSettingsOverlayClosing(false);
      return;
    }

    if (!keepSettingsOverlay) return;
    setSettingsOverlayClosing(true);
    const timer = window.setTimeout(() => {
      setKeepSettingsOverlay(false);
      setSettingsOverlayClosing(false);
    }, 230);
    return () => window.clearTimeout(timer);
  }, [isSettingsOverlay, keepSettingsOverlay]);

  useEffect(() => {
    if (isSettingsOverlay) {
      document.body.classList.remove("study-scroll-locked");
      return;
    }
    if (routeLocation.pathname === "/" || routeLocation.pathname.startsWith("/study")) {
      document.body.classList.add("study-scroll-locked");
    }
  }, [isSettingsOverlay, routeLocation.pathname]);

  return (
    <>
      <div className={`page-route-shell ${routeAnimationClass(routeLocation.pathname)} is-${phase}`}>
        <Routes location={routeLocation}>
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
      </div>

      {isSettingsOverlay || keepSettingsOverlay ? (
        <div className={`settings-route-overlay ${settingsOverlayClosing ? "is-closing" : ""}`}>
          <SettingsPage />
        </div>
      ) : null}
    </>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <AndroidBackHandler />
      <main className="app-main">
        <AppRoutes />
      </main>
    </div>
  );
}
