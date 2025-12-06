import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Onboarding from "./components/Onboarding";
import { ToastProvider } from "./contexts/ToastContext";
import { LicenseProvider } from "./contexts/LicenseContext";
import UploadPage from "./pages/UploadPage";
import EditorPage from "./pages/EditorPage";
import ExportPage from "./pages/ExportPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import LicenseDialog from "./components/LicenseDialog";

// Info pages (optional to keep)
// Info pages removed

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

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
    <LicenseProvider>
      <ToastProvider>
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

        {/* License Dialog */}
        <LicenseDialog
          open={showLicenseDialog}
          onClose={() => setShowLicenseDialog(false)}
        />

        <Routes>
          {/* Main App Routes - Desktop Mode */}
          {/* Home is Dashboard (Project List) */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          <Route path="/upload" element={<UploadPage />} />
          <Route path="/editor/:projectId" element={<EditorPage />} />
          <Route path="/export/:projectId" element={<ExportPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Info Pages removed */}

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </LicenseProvider>
  );
}
