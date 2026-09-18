import { Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import ToastStack from "./components/ToastStack.jsx";

import { useApp } from "./context/AppContext.jsx";

import DashboardPage from "./pages/Dashboard.jsx";
import AttendancePage from "./pages/Attendance.jsx";
import CgpaPage from "./pages/Cgpa.jsx";
import TimetablePage from "./pages/Timetable.jsx";
import NotesPage from "./pages/Notes.jsx";
import PapersPage from "./pages/Papers.jsx";
import SettingsPage from "./pages/Settings.jsx";

import LoginPage from "./pages/login.jsx";
import SignupPage from "./pages/signup.jsx";

function App() {
  const { prefs, setProfile } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(
    () =>
      localStorage.getItem("studenthub-sidebar") ===
      "collapsed"
  );

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("studenthub-token")
  );

  function toggleCollapse() {
    setCollapsed((current) => {
      const next = !current;

      localStorage.setItem(
        "studenthub-sidebar",
        next ? "collapsed" : "expanded"
      );

      return next;
    });
  }

  function handleLoginSuccess(user) {
    // Immediately update AppContext with the newly logged-in user
    setProfile({
      name: user.name || "",
      email: user.email || "",
      rollNumber: user.rollNumber || "",
      campus: user.college || "",
      program: user.program || "",
      year: user.yearSemester || "",
    });

    // Then show the logged-in application
    setIsLoggedIn(true);
  }

  // User is NOT logged in
  if (!isLoggedIn) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
            />
          }
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        <Route
          path="*"
          element={
            <Navigate to="/login" replace />
          }
        />
      </Routes>
    );
  }

  // User is logged in
  return (
    <div
      className={`app-shell ${
        collapsed ? "sidebar-collapsed" : ""
      } ${
        prefs.compactTables
          ? "compact-tables"
          : ""
      }`}
    >
      <Sidebar
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={toggleCollapse}
      />

      <div className="workspace">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="page">
          <Routes>
            <Route
              path="/"
              element={<DashboardPage />}
            />

            <Route
              path="/attendance"
              element={<AttendancePage />}
            />

            <Route
              path="/cgpa"
              element={<CgpaPage />}
            />

            <Route
              path="/timetable"
              element={<TimetablePage />}
            />

            <Route
              path="/notes"
              element={<NotesPage />}
            />

            <Route
              path="/papers"
              element={<PapersPage />}
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />

            <Route
              path="/login"
              element={
                <Navigate to="/" replace />
              }
            />

            <Route
              path="/signup"
              element={
                <Navigate to="/" replace />
              }
            />

            <Route
              path="*"
              element={
                <Navigate to="/" replace />
              }
            />
          </Routes>
        </main>
      </div>

      <ToastStack />
    </div>
  );
}

export default App;