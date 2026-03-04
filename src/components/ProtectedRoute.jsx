import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "./Spinner";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, isSupabaseEnabled } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <PageLoader />
      </div>
    );
  }

  if (isSupabaseEnabled && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
