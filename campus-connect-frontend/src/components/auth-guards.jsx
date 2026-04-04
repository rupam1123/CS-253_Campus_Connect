import { Navigate } from "react-router-dom";
import {
 getDefaultDashboardPath,
 getStoredRole,
 isAuthenticated,
} from "../lib/session";

export function GuestGuard({ children }) {
 const role = getStoredRole();

 if (isAuthenticated()) {
  return <Navigate to={getDefaultDashboardPath(role)} replace />;
 }

 return children;
}

export function ProtectedRoute({ allowedRoles, children }) {
 const role = getStoredRole();

 if (!isAuthenticated()) {
  return <Navigate to="/" replace />;
 }

 if (allowedRoles && !allowedRoles.includes(role)) {
  return <Navigate to={getDefaultDashboardPath(role)} replace />;
 }

 return children;
}
