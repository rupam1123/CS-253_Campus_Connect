import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import DashboardLayout from "../layouts/dashboard_layout";
import { getErrorMessage } from "../lib/api.js";
import { getStoredUser } from "../lib/session.js";
import {
 ArrowRight,
 BookMarked,
 BookOpen,
 Briefcase,
 Clock,
 MessageSquareWarning,
 RefreshCcw,
} from "lucide-react";

function StudentDashboard() {
 const [showCourses, setShowCourses] = useState(false);
 const navigate = useNavigate();
 const user = getStoredUser();
 const userId = user?.id;
 const userName = user?.name || "Student";

 const {
  data: dashboardData,
  error: dashboardError,
  isLoading: dashboardLoading,
 } = useSWR(userId ? `/api/applications/dashboard/${userId}` : null);
 const {
  data: courseData,
  error: coursesError,
  isLoading: coursesLoading,
 } = useSWR(userId ? `/api/courses/${userId}` : null);
 const {
  data: timelineData,
  error: timelineError,
 } = useSWR(userId ? "/api/courses/student/timeline" : null);

 const courses = courseData?.courses || [];
 const pendingCount = dashboardData?.data?.pendingCount || 0;
 const recentApplications = dashboardData?.data?.recentApplications || [];
 const errorMessage = dashboardError || coursesError || timelineError;
 const pendingFeedback = (timelineData?.courses || []).flatMap((course) =>
  (course.lectures || [])
   .filter((lecture) => lecture.status === "live" && !lecture.hasSubmittedRating)
   .map((lecture) => ({
    id: `${course.id}-${lecture.id}`,
    courseId: course.id,
    lectureId: lecture.id,
    course: `${course.code} / ${course.name}`,
    lecture: lecture.title,
    date: `${lecture.lectureDate} | ${lecture.startTime} - ${lecture.endTime}`,
   })),
 );
 const firstPendingFeedback = pendingFeedback[0] || null;

 const openFeedbackHub = (feedbackItem = firstPendingFeedback) => {
  navigate("/feedback", {
   state: feedbackItem
    ? {
       courseId: feedbackItem.courseId,
       lectureId: feedbackItem.lectureId,
      }
    : undefined,
  });
 };

 return (
  <DashboardLayout>
   <div className="space-y-8">
    <div className="glass-panel rounded-[28px] p-6 sm:p-8">
     <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">
      Student Hub
     </p>
     <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
      Welcome back, {userName}
     </h2>
     <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
      Your project pipeline, course activity, and feedback tasks are all
      collected here so you can move through campus work without hopping
      between disconnected screens.
     </p>
    </div>

    {errorMessage && (
     <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
      {getErrorMessage(errorMessage, "Unable to load your dashboard data.")}
     </div>
    )}

    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
     <button
      type="button"
      onClick={() => setShowCourses((current) => !current)}
      className="glass-panel group rounded-[28px] p-6 text-left transition hover:-translate-y-1"
     >
      <div className="flex items-center gap-4">
       <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 transition group-hover:bg-sky-600 group-hover:text-white">
        <BookOpen size={28} />
       </div>
       <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
         Enrolled Courses
        </p>
        <h3 className="mt-1 text-3xl font-black text-slate-900">
         {coursesLoading ? "..." : courses.length}
        </h3>
       </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">
       Tap to {showCourses ? "hide" : "expand"} your current course list.
      </p>
     </button>

     <div className="glass-panel rounded-[28px] p-6">
      <div className="flex items-center gap-4">
       <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
        <Briefcase size={28} />
       </div>
       <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
         Pending Projects
        </p>
        <h3 className="mt-1 text-3xl font-black text-slate-900">
         {dashboardLoading ? "..." : pendingCount}
        </h3>
       </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">
       Applications still waiting for professor action.
      </p>
     </div>

     <button
      type="button"
      onClick={() => openFeedbackHub()}
      className="glass-panel rounded-[28px] p-6 text-left transition hover:-translate-y-1"
     >
      <div className="flex items-center gap-4">
       <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-500">
        <MessageSquareWarning size={28} />
       </div>
       <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
         Pending Feedback
        </p>
        <h3 className="mt-1 text-3xl font-black text-slate-900">
         {pendingFeedback.length}
        </h3>
       </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">
       Click to jump directly into the live feedback hub.
      </p>
     </button>
    </div>

    {showCourses && (
     <div className="glass-panel rounded-[28px] p-6">
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-5">
       <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
        <BookMarked size={20} />
       </div>
       <div>
        <h3 className="text-xl font-black text-slate-900">
         Your Enrolled Courses
        </h3>
        <p className="text-sm text-slate-500">
         Keep track of what you&apos;re actively enrolled in.
        </p>
       </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
       {courses.length > 0 ? (
        courses.map((course) => (
         <div
          key={course}
          className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 shadow-sm"
         >
          <div className="flex items-center gap-3">
           <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
           <span className="text-sm font-bold text-slate-800">{course}</span>
          </div>
         </div>
        ))
       ) : (
        <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center text-sm font-medium text-slate-500">
         {coursesLoading
          ? "Loading courses..."
          : "No enrolled courses are available yet."}
        </p>
       )}
      </div>
     </div>
    )}

    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
     <div className="glass-panel rounded-[28px] p-6">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
       <div>
        <h3 className="text-xl font-black text-slate-900">
         Recent Applications
        </h3>
        <p className="text-sm text-slate-500">
         Your latest project submissions and their status.
        </p>
       </div>
       <button
        type="button"
        onClick={() => navigate("/projects")}
        className="flex items-center gap-1 text-sm font-bold text-sky-600 transition hover:text-sky-700"
       >
        Explore Projects <ArrowRight size={16} />
       </button>
      </div>

      <div className="mt-6 space-y-4">
       {dashboardLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-8 text-center text-sm font-medium text-slate-500">
         Loading application activity...
        </div>
       ) : recentApplications.length > 0 ? (
        recentApplications.map((application) => (
         <div
          key={application.id}
          className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm"
         >
          <div className="flex items-center justify-between gap-4">
           <div>
            <h4 className="text-sm font-black text-slate-900">
             {application.title}
            </h4>
            <p className="mt-1 text-xs font-medium text-slate-500">
             {application.prof} | {application.date}
            </p>
           </div>
           <span
            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
             application.status?.toLowerCase() === "accepted"
              ? "bg-emerald-100 text-emerald-700"
              : application.status?.toLowerCase() === "rejected"
               ? "bg-rose-100 text-rose-700"
               : "bg-amber-100 text-amber-700"
            }`}
           >
            {application.status || "Pending"}
           </span>
          </div>
         </div>
        ))
       ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center text-sm font-medium text-slate-500">
         You haven&apos;t applied to any projects yet. Browse openings to get
         started.
        </div>
       )}
      </div>
     </div>

     <div className="glass-panel rounded-[28px] p-6">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
       <div>
        <h3 className="text-xl font-black text-slate-900">Action Required</h3>
        <p className="text-sm text-slate-500">
         Live lecture ratings that are currently open.
        </p>
       </div>
       <button
        type="button"
        onClick={() => openFeedbackHub()}
        className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-700 transition hover:bg-amber-200"
       >
        <RefreshCcw size={14} />
        Review Now
       </button>
      </div>

      <div className="mt-6 space-y-4">
       {pendingFeedback.length > 0 ? (
        pendingFeedback.map((feedback) => (
         <div
          key={feedback.id}
          className="rounded-2xl border-l-4 border-amber-400 bg-white/85 p-4 shadow-sm"
         >
          <div className="flex items-start justify-between gap-4">
           <div>
            <h4 className="text-sm font-black text-slate-900">
             {feedback.course}
            </h4>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
             <Clock size={12} />
             {feedback.lecture} ({feedback.date})
            </p>
           </div>
           <button
            type="button"
            onClick={() => openFeedbackHub(feedback)}
            className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-amber-300"
           >
            Open
           </button>
          </div>
         </div>
        ))
       ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center text-sm font-medium text-slate-500">
         You&apos;re all caught up on feedback.
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
