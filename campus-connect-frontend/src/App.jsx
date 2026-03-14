import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Signup from "./pages/signup.jsx";
import StudentDashboard from "./pages/student_dashboard.jsx";
import ProfessorDashboard from "./pages/professor_dashboard.jsx";
import Projects from "./pages/projects.jsx";
import Forum from "./pages/forum.jsx";
import Feedback from "./pages/feedback.jsx";
import ProfessorProjects from "./pages/professor_project.jsx";

function App() {
 return (
  <BrowserRouter>
   <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/student-dashboard" element={<StudentDashboard />} />
    <Route path="/professor-dashboard" element={<ProfessorDashboard />} />
    <Route path="/projects" element={<Projects />} />
    <Route path="/forum" element={<Forum />} />
    <Route path="/feedback" element={<Feedback />} />
    <Route path="/professor-projects" element={<ProfessorProjects />} />
   </Routes>
  </BrowserRouter>
 );
}

export default App;
