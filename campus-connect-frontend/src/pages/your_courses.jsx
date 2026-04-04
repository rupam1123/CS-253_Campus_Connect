import { useState } from "react";
import useSWR from "swr";
import DashboardLayout from "../layouts/dashboard_layout";
import { fetchJson, getErrorMessage } from "../lib/api.js";
import {
 BookOpen,
 CalendarClock,
 CheckCircle2,
 ChevronDown,
 Clock3,
 MessageSquareText,
 Send,
 Sparkles,
 Star,
 Users,
} from "lucide-react";

function YourCourses() {
 const [selectedCourseId, setSelectedCourseId] = useState(null);
 const [selectedLectureId, setSelectedLectureId] = useState(null);
 const [commentDrafts, setCommentDrafts] = useState({});
 const [commentError, setCommentError] = useState("");
 const [isSubmittingComment, setIsSubmittingComment] = useState(false);

 const {
  data: managedCoursesData,
  error: coursesError,
  isLoading: coursesLoading,
 } = useSWR("/api/courses/professor/managed");

 const courses = managedCoursesData?.courses || [];
 const hasSelectedCourse = courses.some((course) => course.id === selectedCourseId);
 const activeCourseId = hasSelectedCourse ? selectedCourseId : (courses[0]?.id ?? null);

 const {
  data: detailData,
  error: detailError,
  isLoading: detailLoading,
 } = useSWR(activeCourseId ? `/api/courses/professor/${activeCourseId}` : null);

 const selectedCourse = detailData?.course || null;
 const lectures = detailData?.lectures || [];
 const hasSelectedLecture = lectures.some((lecture) => lecture.id === selectedLectureId);
 const defaultLectureId =
  lectures.find((lecture) => lecture.status === "live")?.id ||
  lectures.find((lecture) => lecture.status === "completed")?.id ||
  null;
 const activeLectureId = hasSelectedLecture ? selectedLectureId : defaultLectureId;
 const selectedLecture =
  lectures.find((lecture) => lecture.id === activeLectureId) || null;

 const {
  data: hubData,
  error: hubError,
  isLoading: hubLoading,
  mutate: mutateHub,
 } = useSWR(
  activeCourseId && activeLectureId
   ? `/api/courses/${activeCourseId}/lectures/${activeLectureId}/live`
   : null,
 );

 const commentDraft = activeLectureId ? commentDrafts[activeLectureId] || "" : "";
 const comments = hubData?.comments || [];
 const feedbackSummary = hubData?.feedbackSummary || {
  ratingCount: 0,
  averages: {
   overall: 0,
   clarity: 0,
   pace: 0,
   engagement: 0,
   contentQuality: 0,
  },
 };
 const feedbackEntries = hubData?.feedbackEntries || [];
 const canComment = Boolean(hubData?.viewer?.canComment);
 const viewerId = hubData?.viewer?.id || null;
 const liveLectureCount = lectures.filter((lecture) => lecture.status === "live").length;

 const updateCommentDraft = (value) => {
  if (!activeLectureId) {
   return;
  }

  setCommentDrafts((current) => ({
   ...current,
   [activeLectureId]: value,
  }));
 };

 const handleCommentSubmit = async (event) => {
  event.preventDefault();

  if (!activeCourseId || !activeLectureId) {
   return;
  }

  const trimmedComment = commentDraft.trim();

  if (!trimmedComment) {
   setCommentError("Write a live instructor note before posting.");
   return;
  }

  setCommentError("");
  setIsSubmittingComment(true);

  try {
   const response = await fetchJson(
    `/api/courses/${activeCourseId}/lectures/${activeLectureId}/live-comments`,
    {
     method: "POST",
     body: { content: trimmedComment },
    },
   );

   updateCommentDraft("");
   await mutateHub(
    (current) =>
     current
      ? {
         ...current,
         comments: [...(current.comments || []), response.comment],
        }
      : current,
    false,
   );
   await mutateHub();
  } catch (error) {
   setCommentError(
    getErrorMessage(error, "Unable to post that instructor update right now."),
   );
  } finally {
   setIsSubmittingComment(false);
  }
 };

 return (
  <DashboardLayout>
   <div className="space-y-6">
    {(coursesError || detailError || hubError) && (
     <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
      {getErrorMessage(
       coursesError || detailError || hubError,
       "Unable to load your course workspace right now.",
      )}
     </div>
    )}

    {coursesLoading ? (
     <div className="glass-panel rounded-[32px] px-6 py-14 text-center text-sm font-medium text-slate-500">
      Loading your managed courses...
     </div>
    ) : courses.length === 0 ? (
     <div className="glass-panel rounded-[32px] px-6 py-16 text-center">
      <BookOpen size={44} className="mx-auto text-slate-300" />
      <h3 className="mt-5 text-xl font-black text-slate-900">
       No course tiles yet
      </h3>
      <p className="mt-2 text-sm text-slate-500">
       Create a course in Manage Course to generate its lecture timeline.
      </p>
     </div>
    ) : (
     <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
       <section className="glass-panel rounded-[28px] p-5">
       <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-600">
        Course Navigator
       </p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">
         Switch courses, then tap a lecture tile
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
         Compact course pills keep the live room visible while you move through
         the schedule.
        </p>

        <div className="mt-5">
         <CoursePillSelector
          activeCourseId={activeCourseId}
          courses={courses}
          onSelect={(nextCourseId) => {
           setSelectedCourseId(nextCourseId || null);
           setSelectedLectureId(null);
           setCommentError("");
          }}
         />
        </div>

        {selectedCourse && (
         <div className="mt-5 grid grid-cols-2 gap-3">
          <QuickStat label="Live" value={liveLectureCount} />
          <QuickStat label="Lectures" value={lectures.length} />
          <QuickStat label="Students" value={detailData?.students?.length || 0} />
          <QuickStat label="Staff" value={detailData?.staff?.length || 0} />
         </div>
        )}
       </section>

       <section className="glass-panel rounded-[28px] p-4">
        <div className="flex items-center justify-between gap-3">
         <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
           Lecture Tiles
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-900">
           {selectedCourse?.code || "Course timeline"}
          </h3>
         </div>
         <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          {lectures.length}
         </span>
        </div>

        <div className="scrollbar-none mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
         {detailLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
           Loading course timeline...
          </div>
         ) : lectures.length > 0 ? (
          lectures.map((lecture) => (
           <button
            key={lecture.id}
            type="button"
            onClick={() => lecture.isAccessible && setSelectedLectureId(lecture.id)}
            className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
             activeLectureId === lecture.id
              ? "border-sky-400 bg-sky-50 shadow-[0_18px_32px_rgba(14,165,233,0.12)]"
              : "border-slate-200 bg-white/80 hover:border-sky-200 hover:bg-white"
            } ${lecture.isAccessible ? "" : "cursor-not-allowed opacity-70"}`}
           >
            <div className="flex items-center justify-between gap-3">
             <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Lecture {lecture.lectureNumber}
             </p>
             <StatusPill status={lecture.status} />
            </div>
            <p className="mt-2 break-words text-sm font-black text-slate-900">
             {lecture.title}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
             {lecture.lectureDate}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
             {formatTimeRange(lecture.startTime, lecture.endTime)}
            </p>
           </button>
          ))
         ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
           No lecture tiles found for this course.
          </div>
         )}
        </div>
       </section>
      </aside>

      <div className="space-y-5">
       {!selectedLecture ? (
        <div className="glass-panel rounded-[32px] px-6 py-16 text-center">
         <MessageSquareText size={44} className="mx-auto text-slate-300" />
         <h3 className="mt-5 text-xl font-black text-slate-900">
          Select a live or completed lecture tile
         </h3>
         <p className="mt-2 text-sm text-slate-500">
          The live feedback stream and rating pulse will appear here.
         </p>
        </div>
       ) : (
        <>
         <section className="mesh-card overflow-hidden rounded-[30px] p-0">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
           <div className="px-6 py-6">
            <div className="flex flex-wrap items-center gap-2">
             <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
              {hubData?.lecture?.courseCode || selectedCourse.code}
             </span>
             <StatusPill status={hubData?.lecture?.status || selectedLecture.status} />
            </div>
            <h3 className="mt-4 break-words text-3xl font-black text-slate-900">
             {hubData?.lecture?.title || selectedLecture.title}
            </h3>
            <p className="mt-2 text-sm text-slate-500">{selectedCourse.name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
             <MetaBadge label={hubData?.lecture?.lectureDate || selectedLecture.lectureDate} />
             <MetaBadge
              label={formatTimeRange(
               hubData?.lecture?.startTime || selectedLecture.startTime,
               hubData?.lecture?.endTime || selectedLecture.endTime,
              )}
             />
            </div>
           </div>

           <div className="glass-panel-dark border-t border-white/10 px-6 py-6 text-white lg:border-l lg:border-t-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
             Instructor Mode
            </p>
            <p className="mt-3 text-lg font-black">
             {selectedLecture.status === "live"
              ? "Named notes are live right now."
              : "Archive view stays readable after class."}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
             <DarkMetric
              icon={<CalendarClock size={15} />}
              label="Lectures"
              value={lectures.length}
             />
             <DarkMetric
              icon={<Users size={15} />}
              label="Ratings"
              value={feedbackSummary.ratingCount}
             />
             <DarkMetric
              icon={<CheckCircle2 size={15} />}
              label="Live"
              value={selectedLecture.status === "live" ? 1 : 0}
             />
            </div>
           </div>
          </div>
         </section>

         <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <section className="glass-panel rounded-[28px] p-5">
           <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-500">
             <Star size={18} />
            </div>
            <div>
             <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Rating Pulse
             </p>
             <h4 className="mt-1 text-xl font-black text-slate-900">
              Lecture sentiment
             </h4>
            </div>
           </div>

           <div className="mt-5 grid grid-cols-2 gap-3">
            <QuickMetric
             label="Average"
             value={`${feedbackSummary.averages.overall.toFixed(1)}/5`}
            />
            <QuickMetric
             label="Ratings"
             value={String(feedbackSummary.ratingCount)}
            />
           </div>

           <div className="mt-5 space-y-3">
            <AverageBar
             label="Content"
             value={feedbackSummary.averages.contentQuality}
            />
            <AverageBar label="Clarity" value={feedbackSummary.averages.clarity} />
            <AverageBar
             label="Engagement"
             value={feedbackSummary.averages.engagement}
            />
            <AverageBar label="Pace" value={feedbackSummary.averages.pace} />
            <AverageBar label="Overall" value={feedbackSummary.averages.overall} />
           </div>

           <details className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/75 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
             <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
               Recent Ratings
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
               Expand student pulse
              </p>
             </div>
             <ChevronDown size={16} className="text-slate-400" />
            </summary>

            <div className="mt-4 space-y-2">
             {hubLoading ? (
              <p className="text-sm font-medium text-slate-500">
               Loading student ratings...
              </p>
             ) : feedbackEntries.length > 0 ? (
              feedbackEntries.slice(0, 6).map((entry) => (
               <div
                key={entry.id}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
               >
                <div className="flex items-center justify-between gap-3">
                 <p className="text-sm font-black text-slate-900">
                  {entry.viewerLabel || "Anonymous student"}
                 </p>
                 <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                  {entry.overall}/5
                 </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                 Clarity {entry.clarity}/5 | Engagement {entry.engagement}/5
                </p>
               </div>
              ))
             ) : (
              <p className="text-sm font-medium text-slate-500">
               No lecture ratings have been submitted yet.
              </p>
             )}
            </div>
           </details>
          </section>

          <section className="glass-panel overflow-hidden rounded-[30px] p-0">
           <div className="border-b border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.24),_transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.75),rgba(240,249,255,0.64))] px-4 py-3 backdrop-blur-2xl sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
             <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
               Live Comment Stream
              </p>
              <h4 className="mt-1 text-[15px] font-black text-slate-900 sm:text-base">
               {selectedLecture.status === "live"
                ? "Live class chat"
                : "Lecture archive"}
              </h4>
              <p className="mt-1 text-xs font-medium text-slate-500">
               Professor replies stay named, while student handles stay anonymous.
              </p>
             </div>
             <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm">
              Instructor visible
             </span>
            </div>
           </div>

           <div className="scrollbar-none h-[420px] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,rgba(247,250,252,0.82),rgba(236,244,255,0.76))] px-3 py-3 sm:px-4 sm:py-4">
            {hubLoading ? (
             <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm font-medium text-slate-500">
              Loading the lecture feedback stream...
             </div>
            ) : comments.length > 0 ? (
             <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5">
              {comments.map((comment) => (
               <CommentCard key={comment.id} comment={comment} viewerId={viewerId} />
              ))}
             </div>
            ) : (
             <div className="mx-auto max-w-2xl rounded-[24px] border border-dashed border-slate-300 bg-white/92 px-5 py-14 text-center shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <MessageSquareText size={42} className="mx-auto text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-500">
               No live comments have been posted for this lecture yet.
              </p>
             </div>
            )}
           </div>

           <div className="border-t border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,250,252,0.92))] px-4 py-3 backdrop-blur-xl sm:px-5">
            {canComment ? (
             <form onSubmit={handleCommentSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
               <span className="rounded-full border border-slate-200/80 bg-white/88 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 shadow-sm">
                Posting as {hubData?.viewer?.displayName || "Instructor"}
               </span>
               <span className="rounded-full border border-slate-200/80 bg-white/72 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Visible with your real name
               </span>
              </div>

              <div className="flex items-end gap-3 rounded-[24px] border border-white/80 bg-white/74 p-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
               <textarea
                value={commentDraft}
                onChange={(event) => updateCommentDraft(event.target.value)}
                placeholder="Drop a named instructor update, clarification, or acknowledgment..."
                className="h-[68px] min-h-[68px] flex-1 resize-none rounded-[18px] bg-transparent px-2 py-2 text-[13px] font-medium leading-6 text-slate-700 outline-none"
               />

               <button
                type="submit"
                disabled={isSubmittingComment}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 text-white shadow-[0_16px_30px_rgba(20,184,166,0.22)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:scale-100 disabled:bg-slate-300"
               >
                <Send size={18} />
               </button>
              </div>

              {commentError && <p className="text-xs font-semibold text-rose-600">{commentError}</p>}
             </form>
            ) : (
             <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
              This lecture has ended. The live stream is now read-only.
             </div>
            )}
           </div>
          </section>
         </div>
        </>
       )}
      </div>
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
    const isActive = course.id === activeCourseId;

    return (
     <button
      key={course.id}
      type="button"
      onClick={() => onSelect(course.id)}
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
        className={`max-w-[170px] truncate text-xs font-semibold ${
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

function QuickStat({ label, value }) {
 return (
  <div className="rounded-[22px] border border-white/80 bg-white/75 px-3 py-3">
   <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
    {label}
   </p>
   <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
  </div>
 );
}

function QuickMetric({ label, value }) {
 return (
  <div className="rounded-[22px] border border-white/80 bg-white/75 px-4 py-4">
   <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
    {label}
   </p>
   <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
  </div>
 );
}

function DarkMetric({ icon, label, value }) {
 return (
  <div className="rounded-[22px] border border-white/10 bg-white/5 px-3 py-3">
   <div className="flex items-center gap-2 text-slate-300">
    {icon}
    <span className="text-[10px] font-black uppercase tracking-[0.16em]">
     {label}
    </span>
   </div>
   <p className="mt-2 text-xl font-black text-white">{value}</p>
  </div>
 );
}

function MetaBadge({ label }) {
 return (
  <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
   {label}
  </span>
 );
}

function AverageBar({ label, value }) {
 const percentage = `${Math.max(0, Math.min(100, (value / 5) * 100))}%`;

 return (
  <div>
   <div className="flex items-center justify-between gap-3">
    <p className="text-sm font-bold text-slate-700">{label}</p>
    <span className="text-sm font-black text-slate-900">{value.toFixed(1)}</span>
   </div>
   <div className="mt-2 h-2.5 rounded-full bg-slate-100">
    <div
     className="h-full rounded-full bg-gradient-to-r from-teal-500 via-sky-500 to-amber-400"
     style={{ width: percentage }}
    />
   </div>
  </div>
 );
}

function StatusPill({ status }) {
 const statusMap = {
  live: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-200 text-slate-700",
  upcoming: "bg-amber-100 text-amber-700",
 };

 return (
  <span
   className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
    statusMap[status] || statusMap.upcoming
   }`}
  >
   {status}
  </span>
 );
}

function CommentCard({ comment, viewerId }) {
 const authorLabel =
  comment.viewerLabel ||
  (comment.isAnonymous ? `@${comment.displayName}` : comment.displayName);
 const isStaff = comment.isStaff;
 const isOwn =
  viewerId !== null &&
  viewerId !== undefined &&
  Number(comment.authorId) === Number(viewerId);
 const avatarLabel = isOwn ? "YOU" : isStaff ? "PF" : "AN";

 return (
  <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
   <div
    className={`flex max-w-[84%] items-end gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
   >
    <div
     className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-black uppercase tracking-[0.12em] ${
      isOwn
       ? "bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-500 text-white shadow-[0_16px_30px_rgba(37,99,235,0.26)]"
       : isStaff
        ? "bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 text-white shadow-[0_16px_30px_rgba(20,184,166,0.22)]"
        : "border border-slate-200 bg-white text-slate-700 shadow-[0_14px_24px_rgba(15,23,42,0.08)]"
     }`}
    >
     {avatarLabel}
    </div>

    <div className="min-w-0">
     <div
      className={`mb-1.5 flex flex-wrap items-center gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
     >
      <span
       className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${
        isOwn
         ? "bg-slate-950/80 text-white"
         : isStaff
          ? "bg-sky-950/80 text-white"
          : "border border-slate-200 bg-white text-slate-500"
       }`}
      >
       {isOwn ? "You" : comment.roleLabel}
      </span>
      <p className="text-[13px] font-black text-slate-800">
       {authorLabel}
      </p>
      <span className="text-[11px] font-semibold text-slate-400">
       {formatDateTime(comment.createdAt)}
      </span>
     </div>

     <div
      className={`rounded-[22px] px-4 py-3 shadow-[0_14px_28px_rgba(15,23,42,0.08)] ${
       isOwn
        ? "bg-[linear-gradient(135deg,#0284c7,#06b6d4,#4f46e5)] text-white"
        : isStaff
         ? "border border-cyan-200/80 bg-[linear-gradient(135deg,rgba(20,184,166,0.18),rgba(6,182,212,0.12))] text-slate-800 backdrop-blur"
         : "border border-white/80 bg-white/92 text-slate-800 backdrop-blur"
      }`}
     >
      <p
       className={`break-words text-[13px] leading-6 ${
        isOwn ? "text-white" : isStaff ? "text-slate-800" : "text-slate-700"
       }`}
      >
       {comment.content}
      </p>
     </div>
    </div>
   </div>
  </div>
 );
}

function formatTimeRange(startTime, endTime) {
 const startLabel = startTime || "--:--";
 const endLabel = endTime || "--:--";
 return `${startLabel} - ${endLabel}`;
}

function formatDateTime(value) {
 if (!value) {
  return "Just now";
 }

 return new Date(value).toLocaleString([], {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
 });
}

export default YourCourses;
