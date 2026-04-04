import { useState } from "react";
import useSWR from "swr";
import { read, utils } from "xlsx";
import DashboardLayout from "../layouts/dashboard_layout";
import { fetchJson, getErrorMessage } from "../lib/api.js";
import {
 AlertTriangle,
 CalendarClock,
 CalendarDays,
 CheckCircle,
 ChevronDown,
 Clock3,
 FileSpreadsheet,
 MailPlus,
 Plus,
 Sparkles,
 Trash2,
 Upload,
 Users,
 X,
} from "lucide-react";

const WEEKDAY_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EMPTY_COURSE_FORM = {
 courseName: "",
 code: "",
 startDate: "",
 endDate: "",
 startTime: "",
 endTime: "",
 daysInWeek: [],
};

function ManageCourse() {
 const [courseForm, setCourseForm] = useState(EMPTY_COURSE_FORM);
 const [isCreating, setIsCreating] = useState(false);
 const [toast, setToast] = useState({ show: false, message: "", type: "success" });

 const {
  data: managedCoursesData,
  error,
  isLoading,
  mutate,
 } = useSWR("/api/courses/professor/managed");

 const courses = managedCoursesData?.courses || [];
 const totalLectures = courses.reduce(
  (sum, course) => sum + Number(course.lectureCount || 0),
  0,
 );
 const totalStudents = courses.reduce(
  (sum, course) => sum + Number(course.studentCount || 0),
  0,
 );

 const showToast = (message, type = "success") => {
  setToast({ show: true, message, type });
  window.setTimeout(() => {
   setToast((current) => ({ ...current, show: false }));
  }, 3200);
 };

 const handleCourseInputChange = (event) => {
  const { name, value } = event.target;
  setCourseForm((current) => ({ ...current, [name]: value }));
 };

 const toggleDay = (day) => {
  setCourseForm((current) => ({
   ...current,
   daysInWeek: current.daysInWeek.includes(day)
    ? current.daysInWeek.filter((item) => item !== day)
    : [...current.daysInWeek, day],
  }));
 };

 const handleCreateCourse = async (event) => {
  event.preventDefault();
  setIsCreating(true);

  if (!courseForm.startTime || !courseForm.endTime) {
   showToast("Choose both a start time and an end time.", "error");
   setIsCreating(false);
   return;
  }

  if (courseForm.endTime <= courseForm.startTime) {
   showToast("Class end time must be later than the start time.", "error");
   setIsCreating(false);
   return;
  }

  try {
   await fetchJson("/api/courses/professor", {
    method: "POST",
    body: courseForm,
   });
   await mutate();
   setCourseForm(EMPTY_COURSE_FORM);
   showToast("Course created and lecture tiles generated.");
  } catch (createError) {
   showToast(getErrorMessage(createError, "Unable to create the course."), "error");
  } finally {
   setIsCreating(false);
  }
 };

 return (
  <DashboardLayout>
   <div className="space-y-6">
    {toast.show && (
     <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl px-5 py-3.5 text-white shadow-2xl ${
       toast.type === "success" ? "bg-emerald-600" : "bg-rose-500"
      }`}
     >
      {toast.type === "success" ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
      <div>
       <p className="text-[10px] font-black uppercase tracking-[0.18em]">
        {toast.type === "success" ? "Success" : "Error"}
       </p>
       <p className="text-sm font-semibold">{toast.message}</p>
      </div>
      <button
       type="button"
       onClick={() => setToast((current) => ({ ...current, show: false }))}
       className="text-white/80 transition hover:text-white"
      >
       <X size={18} />
      </button>
     </div>
    )}

    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
     <section className="glass-panel rounded-[30px] p-6 lg:p-7">
      <div className="flex items-center gap-3">
       <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <Sparkles size={18} />
       </div>
       <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-600">
         Course Studio
        </p>
        <h2 className="mt-1 text-3xl font-black text-slate-900">
         Compact control for all your teaching flows
        </h2>
       </div>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
       Build the schedule once, let CampusConnect generate lecture tiles, then
       expand only the course you want to manage. Everything stays tighter, faster,
       and easier to scan.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
       <OverviewStat label="Managed Courses" value={courses.length} />
       <OverviewStat label="Lecture Tiles" value={totalLectures} />
       <OverviewStat label="Students Routed" value={totalStudents} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
       <HighlightCard
        icon={<CalendarClock size={18} />}
        title="Live windows"
        description="Discussion and feedback open only inside the lecture time range."
       />
       <HighlightCard
        icon={<Users size={18} />}
        title="Roster controls"
        description="Add staff by IITK email and upload student rosters from Excel or CSV."
       />
      </div>
     </section>

     <section className="mesh-card rounded-[30px] p-6 lg:p-7">
      <div className="flex items-center gap-3">
       <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-sky-600 text-white shadow-[0_18px_40px_rgba(14,165,233,0.24)]">
        <Plus size={18} />
       </div>
       <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-600">
         Create Course
        </p>
        <h3 className="mt-1 text-2xl font-black text-slate-900">
         Generate lecture tiles in one pass
        </h3>
       </div>
      </div>

      <form onSubmit={handleCreateCourse} className="mt-6 space-y-4">
       <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field
         label="Course Name"
         name="courseName"
         onChange={handleCourseInputChange}
         placeholder="e.g. CS201 Operating Systems"
         required
         value={courseForm.courseName}
        />
        <Field
         label="Course Code"
         name="code"
         onChange={handleCourseInputChange}
         placeholder="e.g. CS201"
         required
         value={courseForm.code}
        />
        <Field
         label="Start Date"
         name="startDate"
         onChange={handleCourseInputChange}
         required
         type="date"
         value={courseForm.startDate}
        />
        <Field
         label="End Date"
         name="endDate"
         onChange={handleCourseInputChange}
         required
         type="date"
         value={courseForm.endDate}
        />
        <Field
         label="Start Time"
         name="startTime"
         onChange={handleCourseInputChange}
         required
         type="time"
         value={courseForm.startTime}
        />
        <Field
         label="End Time"
         name="endTime"
         onChange={handleCourseInputChange}
         required
         type="time"
         value={courseForm.endTime}
        />
       </div>

       <div className="rounded-[26px] border border-white/70 bg-white/55 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
         <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
           Teaching Days
          </p>
          <p className="mt-1 text-sm text-slate-500">
           Pick the repeating weekdays for lecture tile generation.
          </p>
         </div>
         <div className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          {courseForm.daysInWeek.length || 0} selected
         </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
         {WEEKDAY_OPTIONS.map((day) => {
          const active = courseForm.daysInWeek.includes(day);

          return (
           <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={`rounded-full px-3.5 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
             active
              ? "bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)]"
              : "border border-slate-200/80 bg-white/85 text-slate-500 hover:border-sky-300 hover:text-sky-700"
            }`}
           >
            {day}
           </button>
          );
         })}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
         <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
           Schedule Preview
          </p>
          <p className="mt-2 text-sm font-bold text-slate-900">
           {courseForm.daysInWeek.length > 0
            ? courseForm.daysInWeek.join(" / ")
            : "Choose course days"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
           {courseForm.startTime && courseForm.endTime
            ? `${courseForm.startTime} - ${courseForm.endTime}`
            : "Choose the live class window"}
          </p>
         </div>
         <div className="rounded-2xl border border-sky-100 bg-sky-50/85 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">
           Live Logic
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-600">
           Students can discuss and rate only during this exact time range.
           Past lectures stay open as read-only archive tiles.
          </p>
         </div>
        </div>
       </div>

       <button
        type="submit"
        disabled={isCreating}
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
       >
        <CalendarDays size={18} />
        {isCreating ? "Creating..." : "Create Course"}
       </button>
      </form>
     </section>
    </div>

    {error && (
     <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
      {getErrorMessage(error, "Unable to load your courses right now.")}
     </div>
    )}

    <section className="space-y-4">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
       <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
        Managed Courses
       </p>
       <h3 className="mt-1 text-2xl font-black text-slate-900">
        Expand a course only when you need to edit it
       </h3>
      </div>
      <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
       {courses.length} courses
      </div>
     </div>

     {isLoading ? (
      <div className="glass-panel rounded-[28px] px-6 py-12 text-center text-sm font-medium text-slate-500">
       Loading managed courses...
      </div>
     ) : courses.length > 0 ? (
      <div className="space-y-4">
       {courses.map((course) => (
        <ManagedCourseCard
         key={course.id}
         course={course}
         mutateCourses={mutate}
         onToast={showToast}
        />
       ))}
      </div>
     ) : (
      <div className="glass-panel rounded-[28px] px-6 py-14 text-center">
       <Users size={42} className="mx-auto text-slate-300" />
       <h3 className="mt-5 text-xl font-black text-slate-900">
        No managed courses yet
       </h3>
       <p className="mt-2 text-sm text-slate-500">
        Create your first course to unlock staff and roster management.
       </p>
      </div>
     )}
    </section>
   </div>
  </DashboardLayout>
 );
}

function ManagedCourseCard({ course, mutateCourses, onToast }) {
 const [isExpanded, setIsExpanded] = useState(false);
 const [staffEmail, setStaffEmail] = useState("");
 const [staffRole, setStaffRole] = useState("co-instructor");
 const [studentEmail, setStudentEmail] = useState("");
 const [bulkEmails, setBulkEmails] = useState([]);
 const [isDeleting, setIsDeleting] = useState(false);
 const [isSavingStaff, setIsSavingStaff] = useState(false);
 const [isSavingStudents, setIsSavingStudents] = useState(false);
 const [showBulkSummary, setShowBulkSummary] = useState(false);
 const [bulkSummary, setBulkSummary] = useState([]);

 const { data: detailData, isLoading: detailLoading, mutate: mutateDetail } = useSWR(
  isExpanded ? `/api/courses/professor/${course.id}` : null,
 );

 const detail = detailData || {};

 const refreshAll = async () => {
  await Promise.all([mutateCourses(), mutateDetail()]);
 };

 const handleDelete = async () => {
  setIsDeleting(true);

  try {
   await fetchJson(`/api/courses/professor/${course.id}`, {
    method: "DELETE",
   });
   await mutateCourses();
   onToast(`${course.code} deleted successfully.`);
  } catch (error) {
   onToast(getErrorMessage(error, "Unable to delete this course."), "error");
  } finally {
   setIsDeleting(false);
  }
 };

 const handleAddStaff = async (event) => {
  event.preventDefault();
  setIsSavingStaff(true);

  try {
   const response = await fetchJson(`/api/courses/professor/${course.id}/staff`, {
    method: "POST",
    body: {
     email: staffEmail,
     role: staffRole,
    },
   });
   setStaffEmail("");
   await refreshAll();
   onToast(response.message || "Course staff updated.");
  } catch (error) {
   onToast(getErrorMessage(error, "Unable to update course staff."), "error");
  } finally {
   setIsSavingStaff(false);
  }
 };

 const submitStudentEmails = async (emails) => {
  setIsSavingStudents(true);

  try {
   const response = await fetchJson(
    `/api/courses/professor/${course.id}/students`,
    {
     method: "POST",
     body: { emails },
    },
   );

   setStudentEmail("");
   setBulkEmails([]);
   setBulkSummary(response.missingEmails || []);
   setShowBulkSummary((response.missingEmails || []).length > 0);
   await refreshAll();
   onToast(response.message || "Student roster updated.");
  } catch (error) {
   onToast(getErrorMessage(error, "Unable to add students."), "error");
  } finally {
   setIsSavingStudents(false);
  }
 };

 const handleManualStudentAdd = async (event) => {
  event.preventDefault();
  await submitStudentEmails([studentEmail]);
 };

 const handleBulkFileUpload = async (event) => {
  const file = event.target.files?.[0];

  if (!file) {
   return;
  }

  try {
   const arrayBuffer = await file.arrayBuffer();
   const workbook = read(arrayBuffer, { type: "array" });
   const sheet = workbook.Sheets[workbook.SheetNames[0]];
   const rows = utils.sheet_to_json(sheet, { header: 1, raw: false });
   const emails = rows
    .flat()
    .map((cell) => String(cell || "").trim())
    .filter(Boolean);

   if (emails.length === 0) {
    onToast("No student emails were found in that file.", "error");
    return;
   }

   setBulkEmails(emails);
   await submitStudentEmails(emails);
  } catch {
   onToast("Unable to read that spreadsheet file.", "error");
  } finally {
   event.target.value = "";
  }
 };

 return (
  <div className="glass-panel-strong rounded-[30px] p-5 lg:p-6">
   <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
    <div className="min-w-0 flex-1">
     <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
       {course.code}
      </span>
      <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
       {course.meetingDays.join(" / ")}
      </span>
      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
       {formatTimeRange(course.startTime, course.endTime)}
      </span>
     </div>

     <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
       <h3 className="break-words text-2xl font-black text-slate-900">
        {course.name}
       </h3>
       <p className="mt-1 text-sm text-slate-500">
        {course.startDate} to {course.endDate}
       </p>
      </div>

      <div className="flex items-center gap-2">
       <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
       >
        {isExpanded ? "Hide controls" : "Manage course"}
        <ChevronDown
         size={16}
         className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
       </button>
       <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
       >
        <Trash2 size={16} />
        {isDeleting ? "Deleting..." : "Delete"}
       </button>
      </div>
     </div>
    </div>
   </div>

   <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
    <MiniStat label="Lectures" value={course.lectureCount} />
    <MiniStat label="Students" value={course.studentCount} />
    <MiniStat label="Staff" value={course.staffCount} />
   </div>

   {isExpanded && (
    <div className="mt-5 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
     <section className="rounded-[26px] border border-white/80 bg-white/70 p-4">
      <div className="flex items-start gap-3">
       <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
        <MailPlus size={18} />
       </div>
       <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">
         Teaching Team
        </p>
        <h4 className="mt-1 text-lg font-black text-slate-900">
         Add co-instructors and TAs
        </h4>
        <p className="mt-1 text-sm text-slate-500">
         Use registered IITK emails so staff get linked instantly.
        </p>
       </div>
      </div>

      <form onSubmit={handleAddStaff} className="mt-4 space-y-3">
       <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <input
         type="email"
         value={staffEmail}
         onChange={(event) => setStaffEmail(event.target.value)}
         placeholder="faculty_or_ta@iitk.ac.in"
         className="glass-input w-full rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
        />
        <select
         value={staffRole}
         onChange={(event) => setStaffRole(event.target.value)}
         className="glass-input w-full rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
        >
         <option value="co-instructor">Co-Instructor</option>
         <option value="ta">TA</option>
        </select>
       </div>
       <button
        type="submit"
        disabled={isSavingStaff}
        className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
       >
        {isSavingStaff ? "Saving..." : "Add Staff"}
       </button>
      </form>

      <div className="mt-4 space-y-2">
       {detailLoading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
         Loading course team...
        </div>
       ) : (detail.staff || []).length > 0 ? (
        detail.staff.map((person) => (
         <CompactPersonCard
          key={`${person.userId}-${person.role}`}
          accent="sky"
          email={person.email}
          label={person.role}
          name={person.name}
         />
        ))
       ) : (
        <EmptyCard message="No course staff added yet." />
       )}
      </div>
     </section>

     <section className="rounded-[26px] border border-white/80 bg-white/70 p-4">
      <div className="flex items-start gap-3">
       <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
        <Users size={18} />
       </div>
       <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
         Student Roster
        </p>
        <h4 className="mt-1 text-lg font-black text-slate-900">
         Bulk upload or manual add
        </h4>
        <p className="mt-1 text-sm text-slate-500">
         Excel, CSV, or one IITK email at a time.
        </p>
       </div>
      </div>

      <form onSubmit={handleManualStudentAdd} className="mt-4 flex flex-col gap-3 lg:flex-row">
       <input
        type="email"
        value={studentEmail}
        onChange={(event) => setStudentEmail(event.target.value)}
        placeholder="student@iitk.ac.in"
        className="glass-input min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white"
       />
       <button
        type="submit"
        disabled={isSavingStudents}
        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
       >
        Add Student
       </button>
      </form>

      <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/85 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50">
       <FileSpreadsheet size={18} className="text-emerald-600" />
       Upload Excel / CSV roster
       <Upload size={16} className="ml-auto text-slate-400" />
       <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleBulkFileUpload}
        className="hidden"
       />
      </label>

      {bulkEmails.length > 0 && (
       <p className="mt-3 text-xs font-semibold text-slate-500">
        Last upload detected {bulkEmails.length} roster entries.
       </p>
      )}

      {showBulkSummary && bulkSummary.length > 0 && (
       <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Missing CampusConnect accounts:
        <p className="mt-1 break-words font-semibold">{bulkSummary.join(", ")}</p>
       </div>
      )}

      <div className="scrollbar-none mt-4 max-h-[270px] space-y-2 overflow-y-auto pr-1">
       {detailLoading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
         Loading course roster...
        </div>
       ) : (detail.students || []).length > 0 ? (
        detail.students.map((student) => (
         <CompactPersonCard
          key={student.userId}
          accent="emerald"
          email={student.email}
          label="Enrolled Student"
          name={student.name}
         />
        ))
       ) : (
        <EmptyCard message="No students enrolled in this course yet." />
       )}
      </div>
     </section>
    </div>
   )}
  </div>
 );
}

function Field({
 label,
 name,
 onChange,
 placeholder,
 required = false,
 type = "text",
 value,
}) {
 return (
  <div>
   <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
    {label}
    {required && <span className="ml-2 text-rose-500">*</span>}
   </label>
   <input
    type={type}
    name={name}
    value={value}
    onChange={onChange}
    required={required}
    placeholder={placeholder}
    className="glass-input w-full rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
   />
  </div>
 );
}

function OverviewStat({ label, value }) {
 return (
  <div className="rounded-[24px] border border-white/75 bg-white/70 px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
   <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
    {label}
   </p>
   <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
  </div>
 );
}

function HighlightCard({ description, icon, title }) {
 return (
  <div className="rounded-[24px] border border-white/75 bg-white/70 px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
   <div className="flex items-center gap-2 text-slate-700">
    {icon}
    <p className="text-sm font-black">{title}</p>
   </div>
   <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
  </div>
 );
}

function MiniStat({ label, value }) {
 return (
  <div className="rounded-[22px] border border-white/80 bg-white/70 px-4 py-3">
   <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
    {label}
   </p>
   <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
  </div>
 );
}

function CompactPersonCard({ accent, email, label, name }) {
 const accentClasses =
  accent === "emerald"
   ? "bg-emerald-50 text-emerald-700"
   : "bg-sky-50 text-sky-700";

 return (
  <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <p className="min-w-0 flex-1 break-words text-sm font-bold text-slate-900">
     {name}
    </p>
    <span
     className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${accentClasses}`}
    >
     {label}
    </span>
   </div>
   <p className="mt-1 break-all text-xs text-slate-500">{email}</p>
  </div>
 );
}

function EmptyCard({ message }) {
 return (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
   {message}
  </div>
 );
}

function formatTimeRange(startTime, endTime) {
 const startLabel = startTime || "--:--";
 const endLabel = endTime || "--:--";
 return `${startLabel} - ${endLabel}`;
}

export default ManageCourse;
