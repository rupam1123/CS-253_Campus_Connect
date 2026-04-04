import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GuestGuard, ProtectedRoute } from "./components/auth-guards.jsx";
import { getDefaultDashboardPath, getStoredRole } from "./lib/session.js";

const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/signup.jsx"));
const StudentDashboard = lazy(() => import("./pages/student_dashboard.jsx"));
const ProfessorDashboard = lazy(() => import("./pages/professor_dashboard.jsx"));
const Projects = lazy(() => import("./pages/projects.jsx"));
const Forum = lazy(() => import("./pages/forum.jsx"));
const Feedback = lazy(() => import("./pages/feedback.jsx"));
const ProfessorProjects = lazy(() => import("./pages/professor_project.jsx"));
const ManageCourse = lazy(() => import("./pages/manage_course.jsx"));
const YourCourses = lazy(() => import("./pages/your_courses.jsx"));

function RouteLoader() {
 return (
  <div className="min-h-screen bg-app-shell text-slate-700 flex items-center justify-center px-6">
   <div className="max-w-sm w-full rounded-3xl border border-white/70 bg-white/80 backdrop-blur p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
     <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-teal-500 via-sky-500 to-amber-400"></div>
    </div>
    <p className="mt-5 text-sm font-semibold text-slate-600">
     Loading your Campus Connect workspace...
    </p>
   </div>
  </div>
 );
}

function App() {
 const role = getStoredRole();

 return (
  <BrowserRouter>
   <Suspense fallback={<RouteLoader />}>
    <Routes>
     <Route
      path="/"
      element={
       <GuestGuard>
        <Login />
       </GuestGuard>
      }
     />
     <Route
      path="/signup"
      element={
       <GuestGuard>
        <Signup />
       </GuestGuard>
      }
     />
     <Route
      path="/student-dashboard"
      element={
       <ProtectedRoute allowedRoles={["student"]}>
        <StudentDashboard />
       </ProtectedRoute>
      }
     />
     <Route
      path="/professor-dashboard"
      element={
       <ProtectedRoute allowedRoles={["professor"]}>
        <ProfessorDashboard />
       </ProtectedRoute>
      }
     />
     <Route
      path="/projects"
      element={
       <ProtectedRoute allowedRoles={["student"]}>
        <Projects />
       </ProtectedRoute>
      }
     />
     <Route
      path="/forum"
      element={
       <ProtectedRoute allowedRoles={["student", "professor"]}>
        <Forum />
       </ProtectedRoute>
      }
     />
     <Route
      path="/feedback"
      element={
       <ProtectedRoute allowedRoles={["student"]}>
        <Feedback />
       </ProtectedRoute>
      }
     />
     <Route
      path="/professor-projects"
      element={
       <ProtectedRoute allowedRoles={["professor"]}>
        <ProfessorProjects />
       </ProtectedRoute>
      }
     />
     <Route
      path="/manage-course"
      element={
       <ProtectedRoute allowedRoles={["professor"]}>
        <ManageCourse />
       </ProtectedRoute>
      }
     />
     <Route
      path="/your-courses"
      element={
       <ProtectedRoute allowedRoles={["professor"]}>
        <YourCourses />
       </ProtectedRoute>
      }
     />
     <Route
      path="*"
      element={<Navigate to={getDefaultDashboardPath(role)} replace />}
     />
    </Routes>
   </Suspense>
  </BrowserRouter>
 );
}

export default App;
