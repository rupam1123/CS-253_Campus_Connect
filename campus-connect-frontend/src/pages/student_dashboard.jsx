import DashboardLayout from "../layouts/dashboard_layout";
import {
 BookOpen,
 Briefcase,
 MessageSquareWarning,
 ArrowRight,
 Clock,
} from "lucide-react";

function StudentDashboard() {
 // Mock Data for the dashboard widgets
 const recentApplications = [
  {
   id: 1,
   title: "AI-Driven Healthcare Analytics",
   prof: "Dr. Smith",
   status: "Pending",
   date: "Oct 12",
  },
  {
   id: 2,
   title: "Blockchain for Supply Chain",
   prof: "Dr. Davis",
   status: "Accepted",
   date: "Oct 08",
  },
  {
   id: 3,
   title: "Smart City IoT",
   prof: "Dr. Patel",
   status: "Rejected",
   date: "Sep 29",
  },
 ];

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
      Welcome back, Arjun!
     </h2>
     <p className="text-slate-500 mt-1">
      Here is what's happening with your courses and projects today.
     </p>
    </div>

    {/* TOP STATS ROW */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
     {/* Stat Card 1 */}
     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-5 hover:border-indigo-300 transition-colors group">
      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
       <BookOpen size={28} />
      </div>
      <div>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
        Enrolled Courses
       </p>
       <h3 className="text-3xl font-black text-slate-800">4</h3>
      </div>
     </div>

     {/* Stat Card 2 */}
     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-5 hover:border-indigo-300 transition-colors group">
      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
       <Briefcase size={28} />
      </div>
      <div>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
        Active Applications
       </p>
       <h3 className="text-3xl font-black text-slate-800">3</h3>
      </div>
     </div>

     {/* Stat Card 3 */}
     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-5 hover:border-orange-300 transition-colors group">
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

    {/* BOTTOM TWO COLUMNS */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
     {/* RECENT APPLICATIONS */}
     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
       <h3 className="text-lg font-bold text-slate-800">Recent Applications</h3>
       <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
        View All <ArrowRight size={16} />
       </button>
      </div>
      <div className="flex-1 p-6 space-y-4">
       {recentApplications.map((app) => (
        <div
         key={app.id}
         className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
        >
         <div>
          <h4 className="font-bold text-slate-800 text-sm">{app.title}</h4>
          <p className="text-xs text-slate-500 font-medium mt-1">
           {app.prof} • {app.date}
          </p>
         </div>
         <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
           app.status === "Accepted"
            ? "bg-green-50 text-green-700 border-green-200"
            : app.status === "Rejected"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-yellow-50 text-yellow-700 border-yellow-200"
          }`}
         >
          {app.status}
         </span>
        </div>
       ))}
      </div>
     </div>

     {/* PENDING ACTION: FEEDBACK */}
     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
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
