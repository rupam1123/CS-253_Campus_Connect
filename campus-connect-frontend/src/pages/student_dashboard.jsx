import { useState, useEffect } from "react"; // Added imports
import DashboardLayout from "../layouts/dashboard_layout";
import {
 BookOpen,
 Briefcase,
 MessageSquareWarning,
 ArrowRight,
 Clock,
 BookMarked, // Added icon for the course list
} from "lucide-react";

function StudentDashboard() {
 // --- STATE FOR COURSES ---
 const [courses, setCourses] = useState([]);
 const [showCourses, setShowCourses] = useState(false);

 const [pendingCount, setPendingCount] = useState(0);
 const [appHistory, setAppHistory] = useState([]);

 // 1. Get the user string from local storage and parse it into an object
 const user = JSON.parse(localStorage.getItem("user"));

 // 2. Safely grab the name (with a fallback just in case it's empty)
 const userName = user.name || "Professor";
 // Safely grab the user_id (adjust "user_id" if your object uses "id" instead)
 const userId = user.id;

 // console.log("Whole user object:", user); // Add this temporarily to see exactly what is inside!
 // console.log("Extracted ID:", userId);
 // --- FETCH COURSES FROM BACKEND ---
 //  useEffect(() => {
 //   if (userId) {
 //    // Adjust the URL/port based on your backend configuration
 //    fetch(`http://localhost:5001/api/courses/${userId}`)
 //     .then((res) => res.json())
 //     .then((data) => {
 //      if (data.courses) {
 //       setCourses(data.courses);
 //      }
 //     })
 //     .catch((err) => console.error("Failed to fetch courses:", err));
 //   }
 //  }, [userId]);
 // --- FETCH DASHBOARD DATA (Pending Count & Recent Apps) ---
 useEffect(() => {
  if (userId) {
   fetch(`${import.meta.env.VITE_API_URL}/api/applications/dashboard/${userId}`)
    .then((res) => res.json())
    .then((data) => {
     if (data.success) {
      setPendingCount(data.data.pendingCount);
      setAppHistory(data.data.recentApplications);
     }
    })
    .catch((err) => console.error("Failed to fetch dashboard data:", err));
  }
  if (userId) {
   // Adjust the URL/port based on your backend configuration
   fetch(`${import.meta.env.VITE_API_URL}/api/courses/${userId}`)
    .then((res) => res.json())
    .then((data) => {
     if (data.courses) {
      setCourses(data.courses);
     }
    })
    .catch((err) => console.error("Failed to fetch courses:", err));
  }
 }, [userId]);

 // Mock Data for the dashboard widgets
 const recentApplications = [];

 const pendingFeedback = [
  {
   id: 1,
   course: "Operating Systems",
   lecture: "Virtual Memory",
   date: "Today",
  },
  {
   id: 2,
   course: "Data Structures",
   lecture: "Red-Black Trees",
   date: "Yesterday",
  },
 ];

 return (
  <DashboardLayout>
   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* HEADER SECTION */}
    <div>
     <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
      Welcome back, {userName} !!
     </h2>
     <p className="text-slate-500 mt-1">
      Here is what's happening with your courses and projects today.
     </p>
    </div>

    {/* TOP STATS ROW */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
     {/* Stat Card 1 - MODIFIED TO BE CLICKABLE */}
     <div
      onClick={() => setShowCourses(!showCourses)}
      className="cursor-pointer bg-white rounded-2xl shadow-sm border border-slate-400 p-6 flex items-center gap-5 hover:border-indigo-300 transition-colors group"
     >
      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
       <BookOpen size={28} />
      </div>
      <div>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
        Enrolled Courses
       </p>
       {/* Dynamic Course Count */}
       <h3 className="text-3xl font-black text-slate-800">
        {courses.length > 0 ? courses.length : "0"}
       </h3>
      </div>
     </div>

     {/* Stat Card 2 */}
     <div className="bg-white rounded-2xl shadow-sm border border-slate-400 p-6 flex items-center gap-5 hover:border-blue-300 transition-colors group">
      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
       <Briefcase size={28} />
      </div>
      <div>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
        Pending Projects
       </p>
       <h3 className="text-3xl font-black text-slate-800">{pendingCount}</h3>
      </div>
     </div>

     {/* Stat Card 3 */}
     <div className="bg-white rounded-2xl shadow-sm border border-slate-400 p-6 flex items-center gap-5 hover:border-orange-300 transition-colors group">
      <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
       <MessageSquareWarning size={28} />
      </div>
      <div>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
        Pending Feedback
       </p>
       <h3 className="text-3xl font-black text-slate-800">2</h3>
      </div>
     </div>
    </div>

    {/* --- NEW SECTION: ENROLLED COURSES LIST (Toggled on click) --- */}
    {showCourses && (
     <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
      <div className="p-6 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center">
       <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
        <BookMarked size={20} className="text-indigo-600" />
        Your Enrolled Courses
       </h3>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
       {courses.length > 0 ? (
        courses.map((course, index) => (
         <div
          key={index}
          className="p-4 bg-slate-50 rounded-xl border border-slate-400 flex items-center gap-3"
         >
          <div className="w-2 h-2 rounded-full bg-indigo-500 "></div>
          <span className="font-bold text-slate-700 text-sm">{course}</span>
         </div>
        ))
       ) : (
        <p className="text-slate-500 text-sm col-span-full">
         No courses enrolled currently.
        </p>
       )}
      </div>
     </div>
    )}

    {/* BOTTOM TWO COLUMNS */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
     {/* RECENT APPLICATIONS */}
     <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
       <h3 className="text-lg font-bold text-slate-800">Recent Applications</h3>
       <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
        View All <ArrowRight size={16} />
       </button>
      </div>
      <div className="flex-1 p-6 space-y-4">
       {appHistory.map((app) => (
        <div
         key={app.id}
         className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-300 hover:border-slate-400 transition-colors"
        >
         <div>
          <h4 className="font-bold text-slate-800 text-sm">{app.title}</h4>
          <p className="text-xs text-slate-500 font-medium mt-1">
           {app.prof} • {app.date}
          </p>
         </div>
         <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
           app.status?.toLowerCase() === "accepted"
            ? "bg-green-50 text-green-700 border-green-200"
            : app.status?.toLowerCase() === "rejected"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-orange-50 text-orange-700 border-orange-200"
          }`}
         >
          {app.status}
         </span>
        </div>
       ))}
      </div>
     </div>

     {/* PENDING ACTION: FEEDBACK */}
     <div className="bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-orange-50/30">
       <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
        <h3 className="text-lg font-bold text-slate-800">Action Required</h3>
       </div>
      </div>
      <div className="flex-1 p-6 space-y-4">
       {pendingFeedback.map((fb) => (
        <div
         key={fb.id}
         className="flex items-start justify-between p-4 border-l-4 border-orange-400 bg-orange-50/30 rounded-r-xl"
        >
         <div>
          <h4 className="font-bold text-slate-800 text-sm">{fb.course}</h4>
          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
           <Clock size={12} /> Lecture: {fb.lecture} ({fb.date})
          </p>
         </div>
         <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm shadow-orange-200">
          Review
         </button>
        </div>
       ))}

       {pendingFeedback.length === 0 && (
        <div className="text-center py-8 text-slate-400">
         <p className="text-sm font-medium">
          You're all caught up on feedback!
         </p>
        </div>
       )}
      </div>
     </div>
    </div>
   </div>
  </DashboardLayout>
 );
}

export default StudentDashboard;
