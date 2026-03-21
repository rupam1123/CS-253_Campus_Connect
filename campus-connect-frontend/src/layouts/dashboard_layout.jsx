import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
 LayoutDashboard,
 Briefcase,
 MessageSquare,
 BarChart3,
 LogOut,
 GraduationCap,
} from "lucide-react";
function DashboardLayout({ children }) {
 const location = useLocation();
 const navigate = useNavigate();
 const role = localStorage.getItem("role") || "professor";
 //console.log("Current role in DashboardLayout:", role);
 const user = JSON.parse(localStorage.getItem("user"));
 const userName = user.email;
 const username = userName.slice(0, -11);

 const pageTitles = {
  "/student-dashboard": "Overview",
  "/professor-dashboard": "Analytics & Performance",
  "/professor-projects": "Project Management",
  "/projects": "Project Openings",
  "/forum": "Community Forum",
  "/feedback": "Course Feedback",
 };

 const title = pageTitles[location.pathname] || "Dashboard";

 const studentMenu = [
  {
   name: "Overview",
   path: "/student-dashboard",
   icon: <LayoutDashboard size={20} />,
  },
  { name: "Projects", path: "/projects", icon: <Briefcase size={20} /> },
  { name: "Forum", path: "/forum", icon: <MessageSquare size={20} /> },
  { name: "Feedback", path: "/feedback", icon: <BarChart3 size={20} /> },
 ];

 const professorMenu = [
  {
   name: "Analytics",
   path: "/professor-dashboard",
   icon: <BarChart3 size={20} />,
  },
  {
   name: "Manage Projects",
   path: "/professor-projects",
   icon: <Briefcase size={20} />,
  },
  { name: "Forum", path: "/forum", icon: <MessageSquare size={20} /> },
 ];
 //console.log("hiiii", role);
 const menu = role === "student" ? studentMenu : professorMenu;
 //console.log("Menu items based on role:", menu);
 const handleLogout = () => {
  localStorage.clear();
  navigate("/");
 };

 return (
  <div className="flex h-screen bg-slate-50 font-sans">
   {/* SIDEBAR - Increased width from w-64 to w-72 */}
   <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl shrink-0">
    {/* LOGO & BRANDING AREA */}
    <div className="p-6 mb-2">
     <div className="flex items-center gap-3">
      <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
       <GraduationCap size={26} strokeWidth={2.5} />
      </div>
      {/* Added truncate just in case, but w-72 should be plenty of space */}
      <span className="text-2xl font-black text-white tracking-tight truncate">
       Campus<span className="text-indigo-400">Connect</span>
      </span>
     </div>
    </div>

    <nav className="flex-1 px-4 space-y-1 mt-4">
     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-3">
      Main Menu
     </p>
     {menu.map((item) => (
      <NavLink
       key={item.path}
       to={item.path}
       className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group border-2 ${
         isActive
          ? "bg-indigo-600 text-white border-white shadow-lg shadow-indigo-900/50" // Added white border here
          : "border-transparent hover:bg-slate-800 hover:text-white" // Transparent border prevents layout shift
        }`
       }
      >
       <span className="opacity-70 group-hover:opacity-100">{item.icon}</span>
       <span className="font-medium">{item.name}</span>
      </NavLink>
     ))}
    </nav>

    {/* BOTTOM SECTION */}
    <div className="p-4 border-t border-slate-800">
     <button
      onClick={handleLogout}
      className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
     >
      <LogOut size={20} />
      <span className="font-medium">Logout</span>
     </button>
    </div>
   </aside>

   {/* MAIN CONTENT AREA */}
   <div className="flex-1 flex flex-col overflow-hidden">
    {/* TOP NAVBAR */}
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
     <div>
      <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-0.5">
       Workspace
      </h1>
      <p className="text-xl font-extrabold text-slate-800">{title}</p>
     </div>

     <div className="flex items-center gap-6">
      <div className="flex flex-col items-end">
       <span className="text-sm font-bold text-slate-900">{username}</span>
       <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase border border-indigo-100">
        {role}
       </span>
      </div>
      <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden bg-[url('https://ui-avatars.com/api/?name=Professor+Smith&background=4f46e5&color=fff')] bg-cover" />
     </div>
    </header>

    {/* CONTENT */}
    <main className="flex-1 overflow-y-auto bg-slate-50">
     <div className="max-w-7xl mx-auto p-8">{children}</div>
    </main>
   </div>
  </div>
 );
}

export default DashboardLayout;
