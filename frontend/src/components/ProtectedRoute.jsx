import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { organizer } = useAuth();
  if (!organizer) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
