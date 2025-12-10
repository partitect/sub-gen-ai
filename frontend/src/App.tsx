import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Onboarding from "./components/Onboarding";
import { ToastProvider } from "./contexts/ToastContext";
import { LicenseProvider } from "./contexts/LicenseContext";
import UploadPage from "./pages/UploadPage";
import EditorPage from "./pages/EditorPage";
import ExportPage from "./pages/ExportPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";
import OnboardingPage from "./pages/OnboardingPage";
import LicenseDialog from "./components/LicenseDialog";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Info pages (optional to keep)
// Info pages removed

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [modelChecked, setModelChecked] = useState(false);

  // Check if AI model is downloaded on app start
  useEffect(() => {
    const checkModel = async () => {
      // Skip check if already on onboarding page
      if (location.pathname === "/onboarding") {
        setModelChecked(true);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/model/status`);
        const data = await res.json();

        if (!data.ready) {
          // Model not downloaded, redirect to onboarding
          navigate("/onboarding", { replace: true });
        }
      } catch (error) {
        console.error("Failed to check model status:", error);
        // If backend not running yet, don't redirect
      }
      setModelChecked(true);
    };

    checkModel();
  }, [location.pathname, navigate]);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding && modelChecked && location.pathname !== "/onboarding") {
      setShowOnboarding(true);
    }
  }, [modelChecked, location.pathname]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  // Global function to open license dialog from anywhere
  useEffect(() => {
    (window as any).openLicenseDialog = () => setShowLicenseDialog(true);
    return () => {
      delete (window as any).openLicenseDialog;
    };
  }, []);

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      {/* License Dialog */}
      <LicenseDialog
        open={showLicenseDialog}
        onClose={() => setShowLicenseDialog(false)}
      />

      <Routes>
        {/* Model Download Onboarding */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Main App Routes - Desktop Mode */}
        {/* Home is Dashboard (Project List) */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        <Route path="/upload" element={<UploadPage />} />
        <Route path="/editor/:projectId" element={<EditorPage />} />
        <Route path="/export/:projectId" element={<ExportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />

        {/* Info Pages removed */}

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <LicenseProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </LicenseProvider>
  );
}
