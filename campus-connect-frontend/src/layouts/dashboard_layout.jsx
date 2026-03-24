import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
 LayoutDashboard,
 Briefcase,
 MessageSquare,
 BarChart3,
 LogOut,
 GraduationCap,
 User,
 Settings,
 BarChart3Icon,
 IndentDecrease,
 TvIcon,
 LineSquiggleIcon,
 ChartSpline,
} from "lucide-react";

function DashboardLayout({ children }) {
 // ✅ useState MUST be inside the component function
 const [isProfileOpen, setIsProfileOpen] = useState(false);

 const location = useLocation();
 const navigate = useNavigate();
 const role = localStorage.getItem("role") || "professor";

 const user = JSON.parse(localStorage.getItem("user"));
 const userName = user.email;
 const username = userName.slice(0, -11);
 const avatarUrl = `https://ui-avatars.com/api/?name=${role}+${username}&background=4f46e5&color=fff&bold=true&rounded=true`;

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
  {
   name: "Analytics",
   path: "/professor-dashboard",
   icon: <ChartSpline size={20} />,
  },
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

 const menu = role === "student" ? studentMenu : professorMenu;

 const handleLogout = () => {
  localStorage.clear();
  navigate("/");
 };

 return (
  <div className="flex h-screen bg-slate-50 font-sans">
   {/* SIDEBAR */}
   <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl shrink-0">
    {/* LOGO & BRANDING AREA */}
    <div className="p-6 mb-2">
     <div className="flex items-center gap-3">
      <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
       <GraduationCap size={26} strokeWidth={2.5} />
      </div>
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
          ? "bg-indigo-600 text-white border-white shadow-lg shadow-indigo-900/50"
          : "border-transparent hover:bg-slate-800 hover:text-white"
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
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-40">
     <div>
      <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-0.5">
       Workspace
      </h1>
      <p className="text-xl font-extrabold text-slate-800">{title}</p>
     </div>

     {/* MODERN USER PROFILE WRAPPER */}
     <div className="relative">
      {/* 1. The Clickable Pill */}
      <button
       onClick={() => setIsProfileOpen(!isProfileOpen)}
       className="flex items-center gap-3 bg-white hover:bg-slate-100 border border-slate-400 hover:border-indigo-800 px-3 py-2 rounded-full transition-all duration-200 shadow-sm group focus:outline-none focus:ring-3 focus:ring-indigo-500/50"
      >
       <div className="flex flex-col items-end mr-1">
        <span className="text-sm font-extrabold text-slate-800 tracking-tight group-hover:text-indigo-700 transition-colors">
         {username}
        </span>
        <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest mt-0.5">
         {role}
        </span>
       </div>
       <div className="relative">
        <img
         src={avatarUrl}
         alt="Avatar"
         className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-2 ring-transparent group-hover:ring-indigo-500 transition-all"
        />
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
       </div>
       {/* The Arrow - Spins when open */}
       <svg
        className={`w-4 h-4 text-slate-600 group-hover:text-indigo-500 mr-1 transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
       >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
       </svg>
      </button>

      {/* 2. The Dropdown Menu */}
      {isProfileOpen && (
       <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Dropdown Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
         <p className="text-sm font-black text-slate-800 truncate">
          {username}
         </p>
         <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
          {userName}
         </p>
        </div>

        {/* Dropdown Logout Action */}
        <div className="p-2 border-t border-slate-200 bg-slate-50/50">
         <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black text-red-600 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all"
         >
          <LogOut size={18} />
          Sign Out
         </button>
        </div>
       </div>
      )}
     </div>
    </header>

    {/* CONTENT */}
    <main className="flex-1 overflow-y-auto bg-slate-50 relative z-0">
     <div className="max-w-7xl mx-auto p-8">{children}</div>
    </main>
   </div>
  </div>
 );
}

export default DashboardLayout;
