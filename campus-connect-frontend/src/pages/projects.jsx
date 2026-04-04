import { useDeferredValue, useEffect, useState } from "react";
import useSWR from "swr";
import DashboardLayout from "../layouts/dashboard_layout";
import { fetchJson, getErrorMessage } from "../lib/api.js";
import { getStoredUser } from "../lib/session.js";
import {
 AlertTriangle,
 Award,
 Briefcase,
 CheckCircle,
 Clock,
 Code2,
 Search,
 User,
 X,
 XCircle,
} from "lucide-react";

const EMPTY_APPLICATION = {
 rollNo: "",
 name: "",
 branch: "",
 cpi: "",
 emailid: "",
 resume: "",
 sop: "",
};

function Projects() {
 const user = getStoredUser();
 const [selectedProject, setSelectedProject] = useState(null);
 const [searchQuery, setSearchQuery] = useState("");
 const deferredSearchQuery = useDeferredValue(searchQuery);
 const [applicationForm, setApplicationForm] = useState(EMPTY_APPLICATION);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [toast, setToast] = useState({
  message: "",
  type: "success",
  show: false,
 });

 const {
  data: profileData,
  error: profileError,
 } = useSWR(user?.id ? "/api/auth/profile" : null);
 const {
  data: projects = [],
  error,
  isLoading,
  mutate,
 } = useSWR(
  user?.id ? `/api/projects/get-all-project?userId=${user.id}` : "/api/projects/get-all-project",
 );

 const profile = profileData?.user || user || {};
 const profileName = profile?.name || user?.name || "";
 const profileBranch = profile?.branch || "";
 const profileEmail = profile?.email || user?.email || "";
 const profileResume = profile?.resume || "";
 const profileRollNumber = profile?.rollNumber || "";
 const profileCpi =
  profile?.cpi === null || profile?.cpi === undefined ? "" : String(profile.cpi);

 useEffect(() => {
  if (!selectedProject) {
   return;
  }

  setApplicationForm({
   rollNo: profileRollNumber,
   name: profileName,
   branch: profileBranch,
   cpi: profileCpi,
   emailid: profileEmail,
   resume: profileResume,
   sop: "",
  });
 }, [
  profileBranch,
  profileCpi,
  profileEmail,
  profileName,
  profileResume,
  profileRollNumber,
  selectedProject,
 ]);

 const showToast = (message, type = "success") => {
  setToast({ message, type, show: true });
  window.setTimeout(() => {
   setToast((current) => ({ ...current, show: false }));
  }, 3200);
 };

 const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
 const filteredProjects = projects.filter((project) => {
  const searchableFields = [
   project.title,
   project.skills,
   project.department,
   project.professor_id,
  ]
   .filter(Boolean)
   .map((value) => String(value).toLowerCase());

  return searchableFields.some((value) => value.includes(normalizedQuery));
 });

 const handleInputChange = (event) => {
  const { name, value } = event.target;
  setApplicationForm((current) => ({ ...current, [name]: value }));
 };

 const getProfileCpi = () => {
  const parsed = Number.parseFloat(profile?.cpi);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
 };

 const getProjectMinimumCpi = (project) => {
  const parsed = Number.parseFloat(project?.min_cpi);
  return Number.isFinite(parsed) ? parsed : 0;
 };

 const openApplicationModal = (project) => {
  const profileCpi = getProfileCpi();
  const minimumCpi = getProjectMinimumCpi(project);

  if (project.application_status) {
   showToast(
    `You have already applied for this project. Current status: ${project.application_status}.`,
    "warning",
   );
   return;
  }

  if (Number.isFinite(profileCpi) && profileCpi < minimumCpi) {
   showToast(
    `Your CPI is below the minimum requirement of ${minimumCpi.toFixed(2)} for this project.`,
    "warning",
   );
   return;
  }

  if (!Number.isFinite(profileCpi)) {
   showToast(
    "Your profile is missing CPI. You can fill it here now, and save it in Update Profile for future applications.",
    "warning",
   );
  }

  setSelectedProject(project);
 };

 const handleApply = async (event) => {
  event.preventDefault();

  if (!selectedProject) {
   showToast("Select a project before applying.", "error");
   return;
  }

  if (!user?.id) {
   showToast("Your session has expired. Please sign in again.", "error");
   return;
  }

  setIsSubmitting(true);

  try {
   await fetchJson("/api/applications/apply", {
    method: "POST",
    body: {
     project_id: selectedProject.id,
     user_id: user.id,
     full_name: applicationForm.name.trim(),
     roll_no: applicationForm.rollNo.trim(),
     branch: applicationForm.branch.trim(),
     cpi: applicationForm.cpi,
     email_id: applicationForm.emailid.trim(),
     resume: applicationForm.resume.trim(),
     sop: applicationForm.sop.trim(),
    },
   });

   await mutate(
    (current = []) =>
     current.map((project) =>
      project.id === selectedProject.id
       ? { ...project, application_status: "pending" }
       : project,
     ),
    false,
   );

   showToast(
    `Application sent to ${selectedProject.professor_id} successfully.`,
    "success",
   );
   setSelectedProject(null);
  } catch (applyError) {
   const errorMessage = getErrorMessage(
    applyError,
    "Unable to submit your application.",
   );

   showToast(
    errorMessage,
    errorMessage.includes("already applied") || errorMessage.includes("below")
     ? "warning"
     : "error",
   );
  } finally {
   setIsSubmitting(false);
  }
 };

 const renderActionState = (project) => {
  const status = (project.application_status || "").toLowerCase();
  const minimumCpi = getProjectMinimumCpi(project);
  const profileCpi = getProfileCpi();

  if (status) {
   return {
    disabled: true,
    label: `Status: ${status}`,
    className:
     status === "accepted"
      ? "bg-emerald-500"
      : status === "rejected"
       ? "bg-rose-500"
       : "bg-amber-500",
   };
  }

  if (!Number.isFinite(profileCpi)) {
   return {
    disabled: false,
    label: "Set CPI to apply",
    className: "bg-slate-600 hover:bg-slate-700",
   };
  }

  if (profileCpi < minimumCpi) {
   return {
    disabled: false,
    label: "CPI below minimum",
    className: "bg-rose-500 hover:bg-rose-600",
   };
  }

  return {
   disabled: false,
   label: "Apply Now",
   className: "bg-slate-950 hover:bg-sky-600",
  };
 };

 return (
  <DashboardLayout>
   <div className="space-y-8">
    {toast.show && (
     <div
      className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 rounded-2xl px-6 py-4 text-white shadow-2xl ${
       toast.type === "success"
        ? "bg-emerald-600"
        : toast.type === "warning"
         ? "bg-amber-500"
         : "bg-rose-500"
      }`}
     >
      {toast.type === "success" && <CheckCircle size={22} />}
      {toast.type === "warning" && <AlertTriangle size={22} />}
      {toast.type === "error" && <XCircle size={22} />}
      <div>
       <p className="text-xs font-black uppercase tracking-[0.2em]">
        {toast.type}
       </p>
       <p className="font-semibold">{toast.message}</p>
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

    <div className="glass-panel rounded-[28px] p-6 sm:p-8">
     <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
       <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">
        Student Projects
       </p>
       <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        Discover opportunities that match your skills
       </h2>
       <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
        Your profile now feeds the application flow directly, so eligibility and
        status stay visible before you even open the form.
       </p>
      </div>

      <div className="relative w-full md:max-w-md">
       <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
        <Search size={18} />
       </div>
       <input
        type="text"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search by title, skill, department, or professor"
        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 pl-11 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500"
       />
      </div>
     </div>
    </div>

    {(error || profileError) && (
     <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
      {getErrorMessage(error || profileError, "Unable to load project listings.")}
     </div>
    )}

    {isLoading ? (
     <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
       <div
        key={index}
        className="animate-pulse rounded-[28px] p-6 glass-panel"
       >
        <div className="h-5 w-24 rounded-full bg-slate-200" />
        <div className="mt-6 h-8 w-3/4 rounded-full bg-slate-200" />
        <div className="mt-4 h-20 rounded-2xl bg-slate-100" />
        <div className="mt-6 h-12 rounded-2xl bg-slate-200" />
       </div>
      ))}
     </div>
    ) : filteredProjects.length > 0 ? (
     <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {filteredProjects.map((project) => {
       const actionState = renderActionState(project);
       const status = (project.application_status || "").toLowerCase();

       return (
        <div
         key={project.id}
         className="glass-panel flex rounded-[28px] p-6 transition duration-300 hover:-translate-y-1"
        >
         <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-4">
           <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
            {project.department || "General"}
           </span>
           <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
            {project.program || "Open"}
           </span>
          </div>

          <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-900">
           {project.title}
          </h3>
          <p className="mt-3 flex-1 text-sm leading-7 text-slate-500">
           {project.description || "No description provided yet."}
          </p>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
           <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <User size={16} className="text-sky-500" />
            <span>
             Professor:{" "}
             <span className="font-bold">
              {project.professor_id || "Not assigned"}
             </span>
            </span>
           </div>
           <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Award size={16} className="text-amber-500" />
            <span>
             Min CPI:{" "}
             <span className="font-bold">{project.min_cpi ?? "N/A"}</span>
            </span>
           </div>
           <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Clock size={16} className="text-emerald-500" />
            <span>
             Duration:{" "}
             <span className="font-bold">{project.duration || "Flexible"}</span>
            </span>
           </div>
           <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Code2 size={16} className="text-violet-500" />
            <span>
             Skills:{" "}
             <span className="font-bold">{project.skills || "Discussable"}</span>
            </span>
           </div>
          </div>

          {status && (
           <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${
             status === "accepted"
              ? "bg-emerald-50 text-emerald-700"
              : status === "rejected"
               ? "bg-rose-50 text-rose-700"
               : "bg-amber-50 text-amber-700"
            }`}
           >
            Application status: {status}
           </div>
          )}

          <button
           type="button"
           onClick={() => openApplicationModal(project)}
           className={`mt-6 flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-bold text-white transition ${actionState.className}`}
          >
           <Briefcase size={18} />
           {actionState.label}
          </button>
         </div>
        </div>
       );
      })}
     </div>
    ) : (
     <div className="glass-panel rounded-[28px] px-6 py-16 text-center">
      <Search size={48} className="mx-auto text-slate-300" />
      <h3 className="mt-5 text-xl font-black text-slate-900">
       No projects matched that search
      </h3>
      <p className="mt-2 text-sm text-slate-500">
       Try a broader title, skill, or professor name.
      </p>
     </div>
    )}

    {selectedProject && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="scrollbar-none relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white shadow-[0_32px_100px_rgba(15,23,42,0.22)]">
       <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
        <div>
         <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">
          Application Form
         </p>
         <h3 className="mt-2 text-2xl font-black text-slate-900">
          {selectedProject.title}
         </h3>
         <p className="mt-1 text-sm text-slate-500">
          Applying for Professor {selectedProject.professor_id}&apos;s project
         </p>
        </div>
        <button
         type="button"
         onClick={() => setSelectedProject(null)}
         className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
        >
         <X size={18} />
        </button>
       </div>

       <form onSubmit={handleApply} className="space-y-5 p-6">
        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-sm font-medium leading-7 text-sky-700">
         These fields are prefilled from your profile. Update the missing ones
         here if needed, and save them in <span className="font-bold">Update Profile</span> for future applications.
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
         <Field
          label="Roll No"
          name="rollNo"
          value={applicationForm.rollNo}
          onChange={handleInputChange}
          placeholder="e.g. 230095"
          required
         />
         <Field
          label="Full Name"
          name="name"
          value={applicationForm.name}
          onChange={handleInputChange}
          placeholder="e.g. Arjun Mehta"
          required
         />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
         <Field
          label="Branch"
          name="branch"
          value={applicationForm.branch}
          onChange={handleInputChange}
          placeholder="e.g. CSE"
          required
         />
         <Field
          label="Current CPI"
          name="cpi"
          type="number"
          step="0.01"
          value={applicationForm.cpi}
          onChange={handleInputChange}
          placeholder="e.g. 9.1"
          required
         />
        </div>

        <Field
         label="Email ID"
         name="emailid"
         type="email"
         value={applicationForm.emailid}
         onChange={handleInputChange}
         placeholder="e.g. username@iitk.ac.in"
         required
        />

        <Field
         label="Resume Link"
         name="resume"
         type="url"
         value={applicationForm.resume}
         onChange={handleInputChange}
         placeholder="Link to your resume or portfolio"
         required
        />

        <div>
         <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          Statement of Purpose
          <span className="ml-2 font-medium tracking-normal text-slate-400">
           Optional
          </span>
         </label>
         <textarea
          name="sop"
          rows="5"
          maxLength="500"
          value={applicationForm.sop}
          onChange={handleInputChange}
          placeholder="Share why you are a strong fit for this project."
          className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
         />
         <p className="mt-2 text-right text-[11px] font-medium text-slate-400">
          {applicationForm.sop.length}/500
         </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
         <button
          type="button"
          onClick={() => setSelectedProject(null)}
          className="rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
         >
          Cancel
         </button>
         <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
         >
          {isSubmitting ? "Submitting..." : "Submit Application"}
         </button>
        </div>
       </form>
      </div>
    </div>
   )}
  </div>
 </DashboardLayout>
 );
}

function Field({
 label,
 name,
 onChange,
 placeholder,
 required = false,
 step,
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
    step={step}
    required={required}
    placeholder={placeholder}
    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
   />
  </div>
 );
}

export default Projects;
