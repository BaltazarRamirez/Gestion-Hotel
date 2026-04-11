import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppBackground from "./AppBackground";
import { PageLoader } from "./Spinner";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, profileLoaded, isSupabaseEnabled } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center">
        <AppBackground />
        <div className="relative z-10">
          <PageLoader />
        </div>
      </div>
    );
  }

  if (isSupabaseEnabled && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isSupabaseEnabled && isAuthenticated && !profileLoaded) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center">
        <AppBackground />
        <div className="relative z-10">
          <PageLoader />
        </div>
      </div>
    );
  }

  return children;
}
