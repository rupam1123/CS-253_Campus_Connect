import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useSWR from "swr";
import DashboardLayout from "../layouts/dashboard_layout";
import { fetchJson, getErrorMessage } from "../lib/api.js";
import {
 AlertCircle,
 CalendarDays,
 ChevronDown,
 Clock3,
 Maximize2,
 MessageSquareText,
 Minimize2,
 Send,
 Sparkles,
 Star,
 Waves,
} from "lucide-react";

const RATING_FIELDS = [
 { key: "contentQuality", label: "Content Quality" },
 { key: "clarity", label: "Clarity" },
 { key: "engagement", label: "Engagement" },
 { key: "pace", label: "Pace" },
 { key: "overall", label: "Overall" },
];

const EMPTY_RATING_DRAFT = {
 contentQuality: 0,
 clarity: 0,
 engagement: 0,
 pace: 0,
 overall: 0,
};

function Feedback() {
 const [selectedCourseId, setSelectedCourseId] = useState(null);
 const [selectedLectureId, setSelectedLectureId] = useState(null);
 const [commentDrafts, setCommentDrafts] = useState({});
 const [ratingDrafts, setRatingDrafts] = useState({});
 const [ratingNotice, setRatingNotice] = useState(null);
 const [commentError, setCommentError] = useState("");
 const [isSubmittingComment, setIsSubmittingComment] = useState(false);
 const [isSubmittingRating, setIsSubmittingRating] = useState(false);
 const [isFeedExpanded, setIsFeedExpanded] = useState(false);
 const location = useLocation();

 const {
  data: timelineData,
  error: timelineError,
  isLoading: timelineLoading,
  mutate: mutateTimeline,
 } = useSWR("/api/courses/student/timeline");

 const courses = timelineData?.courses || [];

 useEffect(() => {
  const nextCourseId = Number(location.state?.courseId);
  const nextLectureId = Number(location.state?.lectureId);

  if (nextCourseId) {
   setSelectedCourseId(nextCourseId);
  }

  if (nextLectureId) {
   setSelectedLectureId(nextLectureId);
  }
 }, [location.state]);

 const hasSelectedCourse = courses.some(
  (course) => course.id === selectedCourseId,
 );
 const activeCourseId = hasSelectedCourse
  ? selectedCourseId
  : (courses[0]?.id ?? null);
 const selectedCourse =
  courses.find((course) => course.id === activeCourseId) || null;
 const lectures = selectedCourse?.lectures || [];
 const hasSelectedLecture = lectures.some(
  (lecture) => lecture.id === selectedLectureId,
 );
 const defaultLectureId =
  lectures.find((lecture) => lecture.status === "live")?.id ||
  lectures.find((lecture) => lecture.status === "completed")?.id ||
  null;
 const activeLectureId = hasSelectedLecture
  ? selectedLectureId
  : defaultLectureId;
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

 useEffect(() => {
  setIsFeedExpanded(false);
 }, [activeLectureId]);

 const liveLectureCount = courses.reduce(
  (total, course) => total + (course.liveLectureCount || 0),
  0,
 );
 const pendingRatingsCount = courses.reduce(
  (total, course) => total + (course.pendingRatingsCount || 0),
  0,
 );
 const commentDraft = activeLectureId
  ? commentDrafts[activeLectureId] || ""
  : "";
 const ratingDraft = activeLectureId
  ? { ...EMPTY_RATING_DRAFT, ...(ratingDrafts[activeLectureId] || {}) }
  : EMPTY_RATING_DRAFT;
 const canComment = Boolean(hubData?.viewer?.canComment);
 const canRate = Boolean(hubData?.viewer?.canRate);
 const comments = hubData?.comments || [];
 const viewerId = hubData?.viewer?.id || null;
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

 useEffect(() => {
  if (!ratingNotice) {
   return undefined;
  }

  const timeoutId = window.setTimeout(() => setRatingNotice(null), 3200);
  return () => window.clearTimeout(timeoutId);
 }, [ratingNotice]);

 const updateCommentDraft = (value) => {
  if (!activeLectureId) {
   return;
  }

  setCommentDrafts((current) => ({
   ...current,
   [activeLectureId]: value,
  }));
 };

 const updateRatingDraft = (field, value) => {
  if (!activeLectureId) {
   return;
  }

  setRatingDrafts((current) => ({
   ...current,
   [activeLectureId]: {
    ...EMPTY_RATING_DRAFT,
    ...(current[activeLectureId] || {}),
    [field]: value,
   },
  }));
 };

 const handleCommentSubmit = async (event) => {
  event.preventDefault();

  if (!activeCourseId || !activeLectureId) {
   return;
  }

  const trimmedComment = commentDraft.trim();

  if (!trimmedComment) {
   setCommentError("Write a live comment before posting.");
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
    getErrorMessage(error, "Unable to post that live comment right now."),
   );
  } finally {
   setIsSubmittingComment(false);
  }
 };

 const handleRatingSubmit = async (event) => {
  event.preventDefault();

  if (!activeCourseId || !activeLectureId) {
   return;
  }

  if (RATING_FIELDS.some((field) => !(ratingDraft[field.key] > 0))) {
   setRatingNotice({
    type: "error",
    message: "Please rate all five categories before submitting.",
   });
   return;
  }

  setIsSubmittingRating(true);

  try {
   await fetchJson(
    `/api/courses/${activeCourseId}/lectures/${activeLectureId}/live-rating`,
    {
     method: "POST",
     body: ratingDraft,
    },
   );

   setRatingNotice({
    type: "success",
    message: "Your live lecture rating has been submitted.",
   });
   setRatingDrafts((current) => ({
    ...current,
    [activeLectureId]: EMPTY_RATING_DRAFT,
   }));
   await Promise.all([mutateHub(), mutateTimeline()]);
  } catch (error) {
   setRatingNotice({
    type: "error",
    message: getErrorMessage(error, "Unable to submit your rating right now."),
   });
  } finally {
   setIsSubmittingRating(false);
  }
 };

 return (
  <DashboardLayout>
   <div className="space-y-6">
    {ratingNotice && (
     <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl px-5 py-3.5 text-white shadow-2xl ${
       ratingNotice.type === "success" ? "bg-emerald-600" : "bg-rose-500"
      }`}
     >
      {ratingNotice.type === "success" ? (
       <Sparkles size={20} />
      ) : (
       <AlertCircle size={20} />
      )}
      <div>
       <p className="text-[10px] font-black uppercase tracking-[0.18em]">
        {ratingNotice.type === "success" ? "Saved" : "Error"}
       </p>
       <p className="text-sm font-semibold">{ratingNotice.message}</p>
      </div>
     </div>
    )}

    <section className="mesh-card overflow-hidden rounded-[30px] p-0">
     <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.18),_transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(240,249,255,0.7))] px-6 py-7">
       <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600">
        Live Feedback Studio
       </p>
       <h2 className="mt-2 text-3xl font-black text-slate-900">
        Quick, live, and locked to the right lecture
       </h2>
       <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
        Pending feedback from your dashboard lands here directly. Ratings stay
        one-time, comments stay live-only, and the feedback room can expand into
        a larger focus view without taking over the whole screen.
       </p>
      </div>

      <div className="glass-panel-dark border-t border-white/10 px-6 py-7 text-white lg:border-l lg:border-t-0">
       <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HeroMetric
         icon={<CalendarDays size={16} />}
         label="Courses"
         value={timelineLoading ? "..." : courses.length}
        />
        <HeroMetric
         icon={<Waves size={16} />}
         label="Live"
         value={timelineLoading ? "..." : liveLectureCount}
        />
        <HeroMetric
         icon={<Star size={16} />}
         label="Pending"
         value={timelineLoading ? "..." : pendingRatingsCount}
        />
       </div>
      </div>
     </div>
    </section>

    {(timelineError || hubError) && (
     <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
      {getErrorMessage(
       timelineError || hubError,
       "Unable to load your live feedback workspace.",
      )}
     </div>
    )}

    {timelineLoading ? (
     <div className="glass-panel rounded-[32px] px-6 py-14 text-center text-sm font-medium text-slate-500">
      Loading your lecture feedback timeline...
     </div>
    ) : courses.length === 0 ? (
     <div className="glass-panel rounded-[32px] px-6 py-16 text-center">
      <MessageSquareText size={44} className="mx-auto text-slate-300" />
      <h3 className="mt-5 text-xl font-black text-slate-900">
       No enrolled courses available yet
      </h3>
      <p className="mt-2 text-sm text-slate-500">
       Your live feedback workspace will appear here after you join a course.
      </p>
     </div>
    ) : (
     <div className="grid gap-5 xl:grid-cols-[292px_1fr]">
      <aside className="space-y-4">
       <section className="glass-panel rounded-[28px] p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">
         Live Controls
        </p>
        <h3 className="mt-2 text-[1.45rem] font-black text-slate-900">
         Switch courses, then tap a lecture tile
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
         Course changes stay as quick pill switches so the live room remains in
         view.
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
          <QuickStat label="Lectures" value={lectures.length} />
          <QuickStat
           label="Live"
           value={selectedCourse.liveLectureCount || 0}
          />
          <QuickStat
           label="Pending"
           value={selectedCourse.pendingRatingsCount || 0}
          />
          <QuickStat
           label="Window"
           value={formatCompactTimeRange(
            selectedCourse.startTime,
            selectedCourse.endTime,
           )}
          />
         </div>
        )}
       </section>

       <section className="glass-panel rounded-[28px] p-4">
        <div className="flex items-center justify-between gap-3">
         <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
           Lecture Timeline
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-900">
           {selectedCourse?.code || "Course timeline"}
          </h3>
         </div>
         <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          {lectures.length}
         </span>
        </div>

        <div className="scrollbar-none mt-4 max-h-[440px] space-y-2 overflow-y-auto pr-1">
         {lectures.map((lecture) => {
          const isActive = lecture.id === activeLectureId;
          const isClickable = lecture.isAccessible;

          return (
           <button
            key={lecture.id}
            type="button"
            onClick={() => isClickable && setSelectedLectureId(lecture.id)}
            className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
             isActive
              ? "border-sky-400 bg-sky-50 shadow-[0_18px_32px_rgba(14,165,233,0.12)]"
              : "border-slate-200 bg-white/80 hover:border-sky-200 hover:bg-white"
            } ${isClickable ? "" : "cursor-not-allowed opacity-70"}`}
           >
            <div className="flex items-center justify-between gap-3">
             <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Lecture {lecture.lectureNumber}
             </p>
             <StatusPill status={lecture.status} />
            </div>
            <p className="mt-1.5 break-words text-sm font-black text-slate-900">
             {lecture.title}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
             {lecture.lectureDate}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
             {formatTimeRange(lecture.startTime, lecture.endTime)}
            </p>
           </button>
          );
         })}
        </div>
       </section>
      </aside>

      <div className="space-y-5">
       {!selectedLecture ? (
        <div className="glass-panel rounded-[32px] px-6 py-16 text-center">
         <Clock3 size={44} className="mx-auto text-slate-300" />
         <h3 className="mt-5 text-xl font-black text-slate-900">
          No live or completed lecture selected
         </h3>
         <p className="mt-2 text-sm text-slate-500">
          Choose a lecture tile to open the feedback hub.
         </p>
        </div>
       ) : (
        <>
         <section className="mesh-card overflow-hidden rounded-[28px] p-0">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
           <div className="px-5 py-5">
            <div className="flex flex-wrap items-center gap-2">
             <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
              {hubData?.lecture?.courseCode || selectedCourse.code}
             </span>
             <StatusPill
              status={hubData?.lecture?.status || selectedLecture.status}
             />
            </div>
            <h3 className="mt-3 break-words text-[1.8rem] font-black text-slate-900">
             {hubData?.lecture?.title || selectedLecture.title}
            </h3>
            <p className="mt-2 text-sm text-slate-500">{selectedCourse.name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
             <MetaBadge
              label={
               hubData?.lecture?.lectureDate || selectedLecture.lectureDate
              }
             />
             <MetaBadge
              label={formatTimeRange(
               hubData?.lecture?.startTime || selectedLecture.startTime,
               hubData?.lecture?.endTime || selectedLecture.endTime,
              )}
             />
            </div>
           </div>

           <div className="glass-panel-dark border-t border-white/10 px-5 py-5 text-white lg:border-l lg:border-t-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
             Interaction State
            </p>
            <p className="mt-3 text-lg font-black">
             {selectedLecture.status === "live"
              ? "Comment live and submit your one-time rating now."
              : "Archive mode is open for reading only."}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
             Comments are capped at 10 messages every 5 minutes. Ratings are one
             time only for each lecture.
            </p>
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
              One-Time Rating
             </p>
             <h4 className="mt-1 text-xl font-black text-slate-900">
              Lecture scorecard
             </h4>
            </div>
           </div>

           <div className="mt-5 grid grid-cols-2 gap-3">
            <QuickStat
             label="Average"
             value={`${feedbackSummary.averages.overall.toFixed(1)}/5`}
            />
            <QuickStat
             label="Ratings"
             value={String(feedbackSummary.ratingCount)}
            />
           </div>

           <div className="mt-5 space-y-3">
            {RATING_FIELDS.map((field) => (
             <RatingRow
              key={field.key}
              disabled={Boolean(hubData?.myFeedback)}
              label={field.label}
              value={
               hubData?.myFeedback
                ? getFeedbackValue(hubData.myFeedback, field.key)
                : ratingDraft[field.key]
              }
              onRate={(value) => updateRatingDraft(field.key, value)}
             />
            ))}
           </div>

           {hubData?.myFeedback ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800">
             Your rating was already saved for this lecture.
            </div>
           ) : !canRate ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
             Ratings are available only during the live session window.
            </div>
           ) : null}

           <button
            type="button"
            onClick={handleRatingSubmit}
            disabled={!canRate || isSubmittingRating}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-amber-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
           >
            <Star size={18} />
            {isSubmittingRating ? "Submitting..." : "Submit Lecture Rating"}
           </button>

           <details className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/75 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
             <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
               Snapshot
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
               Expand rating averages
              </p>
             </div>
             <ChevronDown size={16} className="text-slate-400" />
            </summary>

            <div className="mt-4 space-y-3">
             {RATING_FIELDS.map((field) => (
              <AverageBar
               key={field.key}
               label={field.label}
               value={getFeedbackValue(feedbackSummary.averages, field.key)}
              />
             ))}
            </div>
           </details>
          </section>

          <LiveFeedbackPanel
           canComment={canComment}
           commentDraft={commentDraft}
           commentError={commentError}
           comments={comments}
           hubLoading={hubLoading}
           isExpanded={false}
           isSubmittingComment={isSubmittingComment}
           lectureStatus={selectedLecture.status}
           onChangeDraft={updateCommentDraft}
           onExpand={() => setIsFeedExpanded(true)}
           onSubmit={handleCommentSubmit}
           viewerId={viewerId}
           viewerLabel={hubData?.viewer?.displayName || "anonymous"}
          />
         </div>
        </>
       )}
      </div>
     </div>
    )}

    {isFeedExpanded && selectedLecture && (
     <div
      className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/42 p-3 backdrop-blur-xl sm:p-5"
      onClick={() => setIsFeedExpanded(false)}
     >
      <div
       className="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center py-2"
       onClick={(event) => event.stopPropagation()}
      >
       <LiveFeedbackPanel
        canComment={canComment}
        commentDraft={commentDraft}
        commentError={commentError}
        comments={comments}
        hubLoading={hubLoading}
        isExpanded
        isSubmittingComment={isSubmittingComment}
        lectureStatus={selectedLecture.status}
        onChangeDraft={updateCommentDraft}
        onClose={() => setIsFeedExpanded(false)}
        onSubmit={handleCommentSubmit}
        viewerId={viewerId}
        viewerLabel={hubData?.viewer?.displayName || "anonymous"}
       />
      </div>
     </div>
    )}
   </div>
  </DashboardLayout>
 );
}

function LiveFeedbackPanel({
 canComment,
 commentDraft,
 commentError,
 comments,
 hubLoading,
 isExpanded,
 isSubmittingComment,
 lectureStatus,
 onChangeDraft,
 onClose,
 onExpand,
 onSubmit,
 viewerId,
 viewerLabel,
}) {
 return (
  <section
   className={`relative flex w-full flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.78),rgba(239,246,255,0.72))] backdrop-blur-[26px] ${
    isExpanded
     ? "max-h-[calc(100svh-1.5rem)] shadow-[0_40px_120px_rgba(15,23,42,0.28)]"
     : "min-h-[560px] shadow-[0_24px_70px_rgba(15,23,42,0.14)]"
   }`}
  >
   <div className="border-b border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_34%),radial-gradient(circle_at_right,_rgba(45,212,191,0.2),_transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.72),rgba(240,249,255,0.62))] px-4 py-3 backdrop-blur-2xl sm:px-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
       Live Comment Stream
      </p>
      <h4 className="mt-1 text-[15px] font-black text-slate-900 sm:text-base">
       {lectureStatus === "live" ? "Live class chat" : "Lecture archive"}
      </h4>
     </div>

     <div className="flex items-center gap-2">
      <span className="rounded-full border border-white/80 bg-white/78 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-700 shadow-sm sm:text-[10px]">
       10 comments / 5 min
      </span>
      {isExpanded ? (
       <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 sm:text-[10px]"
       >
        <Minimize2 size={14} />
        Close
       </button>
      ) : (
       <button
        type="button"
        onClick={onExpand}
        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 sm:text-[10px]"
       >
        <Maximize2 size={14} />
        Expand
       </button>
      )}
     </div>
    </div>
   </div>

   <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,rgba(247,250,252,0.82),rgba(236,244,255,0.76))] px-3 py-3 sm:px-4 sm:py-4">
    {hubLoading ? (
     <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm font-medium text-slate-500">
      Loading the live feedback stream...
     </div>
    ) : comments.length > 0 ? (
     <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5">
      {comments.map((comment) => (
       <CommentCard key={comment.id} comment={comment} viewerId={viewerId} />
      ))}
     </div>
    ) : (
     <div className="mx-auto max-w-2xl rounded-[24px] border border-dashed border-slate-300 bg-white/90 px-5 py-14 text-center shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <MessageSquareText size={42} className="mx-auto text-slate-300" />
      <p className="mt-4 text-sm font-medium text-slate-500">
       No live comments have been posted for this lecture yet.
      </p>
     </div>
    )}
   </div>

   <div className="border-t border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,250,252,0.92))] px-4 py-3 backdrop-blur-xl sm:px-5">
    {canComment ? (
     <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-3xl flex-col gap-2.5"
     >
      <div className="flex flex-wrap items-center justify-between gap-2">
       <span className="rounded-full border border-slate-200/80 bg-white/88 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 shadow-sm">
        Posting as @{viewerLabel}
       </span>
       <span className="rounded-full border border-slate-200/80 bg-white/72 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        Live only
       </span>
      </div>

      <div className="flex items-end gap-3 rounded-[24px] border border-white/80 bg-white/74 p-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
       <textarea
        value={commentDraft}
        onChange={(event) => onChangeDraft(event.target.value)}
        placeholder="Share a fast thought, confusion, or win from the lecture..."
        className="h-[68px] min-h-[68px] flex-1 resize-none rounded-[18px] bg-transparent px-2 py-2 text-[13px] font-medium leading-6 text-slate-700 outline-none"
       />

       <button
        type="submit"
        disabled={isSubmittingComment}
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-400 text-white shadow-[0_16px_30px_rgba(14,165,233,0.25)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:scale-100 disabled:bg-slate-300"
       >
        <Send size={18} />
       </button>
      </div>

      {commentError && (
       <p className="text-xs font-semibold text-rose-600">{commentError}</p>
      )}
     </form>
    ) : (
     <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
      Comments are closed for this lecture. You can still read the archive.
     </div>
    )}
   </div>
  </section>
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

function HeroMetric({ icon, label, value }) {
 return (
  <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
   <div className="flex items-center gap-2 text-sky-200">
    {icon}
    <span className="text-[10px] font-black uppercase tracking-[0.18em]">
     {label}
    </span>
   </div>
   <p className="mt-2 text-2xl font-black text-white">{value}</p>
  </div>
 );
}

function QuickStat({ label, value }) {
 return (
  <div className="rounded-[22px] border border-white/80 bg-white/75 px-3 py-3">
   <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
    {label}
   </p>
   <p className="mt-1 break-words text-xl font-black text-slate-900">{value}</p>
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

function RatingRow({ disabled, label, onRate, value }) {
 return (
  <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 px-4 py-3">
   <div className="flex items-center justify-between gap-3">
    <p className="text-sm font-bold text-slate-700">{label}</p>
    <div className="flex gap-1">
     {[1, 2, 3, 4, 5].map((score) => (
      <button
       key={score}
       type="button"
       disabled={disabled}
       onClick={() => onRate(score)}
       className="rounded-full p-1 transition hover:scale-110 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
       <Star
        size={21}
        className={
         score <= value
          ? "fill-amber-400 text-amber-400"
          : "fill-slate-100 text-slate-200"
        }
       />
      </button>
     ))}
    </div>
   </div>
  </div>
 );
}

function AverageBar({ label, value }) {
 const percentage = `${Math.max(0, Math.min(100, (value / 5) * 100))}%`;

 return (
  <div>
   <div className="flex items-center justify-between gap-3">
    <p className="text-sm font-bold text-slate-700">{label}</p>
    <span className="text-sm font-black text-slate-900">
     {value.toFixed(1)}
    </span>
   </div>
   <div className="mt-2 h-2.5 rounded-full bg-slate-100">
    <div
     className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400"
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
 const isOwn =
  viewerId !== null &&
  viewerId !== undefined &&
  Number(comment.authorId) === Number(viewerId);
 const isStaff = comment.isStaff;
 const avatarLabel = isOwn ? "YOU" : isStaff ? "PF" : "AN";

 return (
  <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
   <div
    className={`flex max-w-[84%] items-end gap-2.5 ${
     isOwn ? "flex-row-reverse" : "flex-row"
    }`}
   >
    <div
     className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-black uppercase tracking-[0.12em] ${
      isOwn
       ? "bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-500 text-white shadow-[0_16px_30px_rgba(37,99,235,0.26)]"
       : isStaff
         ? "bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-400 text-white shadow-[0_16px_30px_rgba(14,165,233,0.24)]"
         : "border border-slate-200 bg-white text-slate-700 shadow-[0_14px_24px_rgba(15,23,42,0.08)]"
     }`}
    >
     {avatarLabel}
    </div>

    <div className="min-w-0">
     <div
      className={`mb-1.5 flex flex-wrap items-center gap-2 ${
       isOwn ? "justify-end" : "justify-start"
      }`}
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
      <p className="text-[13px] font-black text-slate-800">{authorLabel}</p>
      <span className="text-[11px] font-semibold text-slate-400">
       {formatDateTime(comment.createdAt)}
      </span>
     </div>

     <div
      className={`rounded-[22px] px-4 py-3 shadow-[0_14px_28px_rgba(15,23,42,0.08)] ${
       isOwn
        ? "bg-[linear-gradient(135deg,#0284c7,#06b6d4,#4f46e5)] text-white"
        : isStaff
          ? "border border-cyan-200/80 bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(45,212,191,0.12))] text-slate-800 backdrop-blur"
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

function formatCompactTimeRange(startTime, endTime) {
 if (!startTime || !endTime) {
  return "--";
 }

 return `${startTime.slice(0, 5)}-${endTime.slice(0, 5)}`;
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

function getFeedbackValue(source, key) {
 if (key === "contentQuality") {
  return Number(source.contentQuality || 0);
 }

 return Number(source[key] || 0);
}

export default Feedback;
