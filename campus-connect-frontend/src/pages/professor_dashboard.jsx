import { useState } from "react";
import useSWR from "swr";
import DashboardLayout from "../layouts/dashboard_layout";
import { getErrorMessage } from "../lib/api.js";
import { Bar } from "react-chartjs-2";
import {
 Chart as ChartJS,
 CategoryScale,
 LinearScale,
 BarElement,
 Title,
 Tooltip,
 Legend,
} from "chart.js";
import { BarChart3, MessageSquareText } from "lucide-react";

ChartJS.register(
 CategoryScale,
 LinearScale,
 BarElement,
 Title,
 Tooltip,
 Legend,
);

const CHART_LABELS = [
 "Content Quality",
 "Teaching Delivery",
 "Clarity",
 "Engagement",
 "Lecture Pace",
];

function ProfessorDashboard() {
 const [selectedCourseId, setSelectedCourseId] = useState("");

 const {
  data: managedCoursesData,
  error: managedCoursesError,
  isLoading: managedCoursesLoading,
 } = useSWR("/api/courses/professor/managed");

 const managedCourses = managedCoursesData?.courses || [];
 const hasSelectedCourse = managedCourses.some(
  (course) => String(course.id) === selectedCourseId,
 );
 const activeCourseId = hasSelectedCourse
  ? selectedCourseId
  : String(managedCourses[0]?.id || "");
 const selectedCourse =
  managedCourses.find((course) => String(course.id) === activeCourseId) || null;
 const selectedCourseName = selectedCourse?.name || "";

 const {
  data: analyticsData,
  error: analyticsError,
  isLoading: analyticsLoading,
 } = useSWR(
  selectedCourseName
   ? `/api/professor/analytics/${encodeURIComponent(selectedCourseName)}`
   : null,
 );
 const {
  data: commentsData,
  error: commentsError,
  isLoading: commentsLoading,
 } = useSWR(
  selectedCourseName
   ? `/api/professor/comments/${encodeURIComponent(selectedCourseName)}`
   : null,
 );

 const chartDataArray = analyticsData?.chartData || [0, 0, 0, 0, 0];
 const comments = commentsData?.comments || [];
 const averageScore =
  chartDataArray.reduce((total, current) => total + current, 0) /
  chartDataArray.length;

 const chartData = {
  labels: CHART_LABELS,
  datasets: [
   {
    label: "Average Rating",
    data: chartDataArray,
    backgroundColor: [
     "#38bdf8",
     "#14b8a6",
     "#f59e0b",
     "#8b5cf6",
     "#ef4444",
    ],
    borderRadius: 14,
    maxBarThickness: 48,
   },
  ],
 };

 return (
  <DashboardLayout>
   <div className="space-y-8">
    <div className="glass-panel rounded-[28px] p-6 sm:p-8">
     <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">
      Professor Analytics
     </p>
     <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
      Monitor course sentiment with less guesswork
     </h2>
     <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
      Select one of your managed courses to review aggregate ratings and the
      most recent anonymous comments. This view stays read-only until reply
      persistence is supported end to end.
     </p>
    </div>

    {managedCoursesError && (
     <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
      {getErrorMessage(
       managedCoursesError,
       "Unable to load your managed courses right now.",
      )}
     </div>
    )}

    <div className="glass-panel rounded-[28px] p-6">
     <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
      Select Course
     </p>
     <p className="mt-2 text-sm leading-6 text-slate-500">
      Quick course pills keep the analytics panel cleaner than a dropdown.
     </p>

     {managedCourses.length > 0 ? (
      <div className="mt-4">
       <CoursePillSelector
        activeCourseId={activeCourseId}
        courses={managedCourses}
        onSelect={(courseId) => setSelectedCourseId(String(courseId))}
       />
      </div>
     ) : (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
       {managedCoursesLoading
        ? "Loading your managed courses..."
        : "Create a course in Manage Course first"}
      </div>
     )}
    </div>

    {selectedCourseName ? (
     <>
      {(analyticsError || commentsError) && (
       <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
        {getErrorMessage(
         analyticsError || commentsError,
         "Unable to load professor analytics right now.",
        )}
       </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
       <div className="glass-panel rounded-[28px] p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
         Course
        </p>
        <h3 className="mt-3 text-2xl font-black text-slate-900">
         {selectedCourse.code ? `${selectedCourse.code} - ${selectedCourseName}` : selectedCourseName}
        </h3>
       </div>
       <div className="glass-panel rounded-[28px] p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
         Average Score
        </p>
        <h3 className="mt-3 text-2xl font-black text-slate-900">
         {analyticsLoading ? "..." : averageScore.toFixed(1)} / 5
        </h3>
       </div>
       <div className="glass-panel rounded-[28px] p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
         Discussion Entries
        </p>
        <h3 className="mt-3 text-2xl font-black text-slate-900">
         {commentsLoading ? "..." : comments.length}
        </h3>
       </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
       <div className="glass-panel rounded-[32px] p-6 lg:col-span-2">
        <div className="flex items-center gap-3">
         <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
          <BarChart3 size={20} />
         </div>
         <div>
          <h3 className="text-xl font-black text-slate-900">
           Rating Breakdown
          </h3>
          <p className="text-sm text-slate-500">
           Average score per dimension for {selectedCourseName}.
          </p>
         </div>
        </div>

        <div className="mt-6 h-[380px]">
         <Bar
          data={chartData}
          options={{
           responsive: true,
           maintainAspectRatio: false,
           plugins: {
            legend: { display: false },
           },
           scales: {
            y: {
             beginAtZero: true,
             min: 0,
             max: 5,
             ticks: { stepSize: 1 },
             grid: {
              color: "rgba(148, 163, 184, 0.15)",
             },
            },
            x: {
             grid: { display: false },
            },
           },
          }}
         />
        </div>
       </div>

       <div className="glass-panel flex rounded-[32px] p-6">
        <div className="flex w-full flex-col">
         <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
           <MessageSquareText size={20} />
          </div>
          <div>
           <h3 className="text-xl font-black text-slate-900">
            Anonymous Comments
           </h3>
           <p className="text-sm text-slate-500">
            Most recent feedback threads for this course.
           </p>
          </div>
         </div>

         <div className="scrollbar-none mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
          {commentsLoading ? (
           <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-8 text-center text-sm font-medium text-slate-500">
            Loading discussion entries...
           </div>
          ) : comments.length > 0 ? (
           comments.map((comment) => (
            <div
             key={comment.id}
             className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm"
            >
             <p className="text-sm leading-7 text-slate-700">{comment.text}</p>
             <div className="mt-4 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              <span>Upvotes {comment.upvotes || 0}</span>
              <span>Downvotes {comment.downvotes || 0}</span>
             </div>
            </div>
           ))
          ) : (
           <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-5 py-10 text-center text-sm font-medium text-slate-500">
            No written comments have been submitted for this course yet.
           </div>
          )}
         </div>
        </div>
       </div>
      </div>
     </>
    ) : (
     <div className="glass-panel rounded-[32px] px-6 py-16 text-center">
      <BarChart3 size={48} className="mx-auto text-slate-300" />
      <h3 className="mt-5 text-xl font-black text-slate-900">
       Select a managed course to unlock analytics
      </h3>
      <p className="mt-2 text-sm text-slate-500">
       Once you create or choose a course, ratings and comment trends will
       appear here.
      </p>
     </div>
    )}
   </div>
  </DashboardLayout>
 );
}

function CoursePillSelector({ activeCourseId, courses, onSelect }) {
 return (
  <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
   {courses.map((course) => {
    const courseId = String(course.id);
    const isActive = courseId === activeCourseId;

    return (
     <button
      key={course.id}
      type="button"
      onClick={() => onSelect(courseId)}
      className={`group min-w-fit rounded-full border px-4 py-2 text-left transition ${
       isActive
        ? "border-sky-300/70 bg-[linear-gradient(135deg,rgba(56,189,248,0.92),rgba(45,212,191,0.85))] text-slate-950 shadow-[0_18px_34px_rgba(14,165,233,0.22)]"
        : "border-white/80 bg-white/76 text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:border-sky-200 hover:bg-white"
      }`}
     >
      <div className="flex items-center gap-2">
       <span className="text-[11px] font-black uppercase tracking-[0.16em]">
        {course.code || "Course"}
       </span>
       <span
        className={`max-w-[190px] truncate text-xs font-semibold ${
         isActive ? "text-slate-900/85" : "text-slate-500"
        }`}
       >
        {course.name}
       </span>
      </div>
     </button>
    );
   })}
  </div>
 );
}

export default ProfessorDashboard;
