import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { SplashScreen } from "./components/SplashScreen";
import { PageLoader } from "./components/Spinner";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Rooms = lazy(() => import("./pages/Rooms"));
const Reservations = lazy(() => import("./pages/Reservations"));
const Guests = lazy(() => import("./pages/Guests"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Login = lazy(() => import("./pages/Login"));

const SPLASH_DURATION_MS = 2200;

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <AuthProvider>
      <SplashScreen visible={splashVisible} />
      <div
        className="transition-opacity duration-500 ease-out"
        style={{
          opacity: splashVisible ? 0 : 1,
          pointerEvents: splashVisible ? "none" : "auto",
        }}
      >
        <Suspense
          fallback={
            <div className="p-6">
              <PageLoader />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/guests" element={<Guests />} />
              <Route path="/calendar" element={<Calendar />} />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  );
}
