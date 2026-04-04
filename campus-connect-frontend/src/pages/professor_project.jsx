import { useState } from "react";
import useSWR from "swr";
import DashboardLayout from "../layouts/dashboard_layout.jsx";
import { fetchJson, getErrorMessage } from "../lib/api.js";
import { getStoredUser } from "../lib/session.js";
import {
 AlertTriangle,
 Check,
 ChevronDown,
 LoaderCircle,
 Plus,
 Trash2,
 X,
} from "lucide-react";

const EMPTY_FORM = {
 title: "",
 dept: "",
 program: "",
 cpi: "",
 duration: "",
 teamSize: "",
 skills: "",
 description: "",
};

function ProfessorProject() {
 const user = getStoredUser();
 const professorName = user?.name;
 const [toast, setToast] = useState({
  show: false,
  message: "",
  type: "success",
 });
 const [showWizard, setShowWizard] = useState(false);
 const [projectToDelete, setProjectToDelete] = useState(null);
 const [form, setForm] = useState(EMPTY_FORM);
 const [isSubmitting, setIsSubmitting] = useState(false);

 const {
  data: projects = [],
  error,
  isLoading,
  mutate,
 } = useSWR(
  professorName
   ? `/api/projects/professor/${encodeURIComponent(professorName)}`
   : null,
 );

 const inputClass =
  "w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white";

 const showToast = (message, type = "success") => {
  setToast({ show: true, message, type });
  window.setTimeout(() => {
   setToast((current) => ({ ...current, show: false }));
  }, 3000);
 };

 const handleChange = (event) => {
  const { name, value } = event.target;
  setForm((current) => ({ ...current, [name]: value }));
 };

 const addProject = async (event) => {
  event.preventDefault();

  if (!professorName) {
   showToast("Your session is missing professor details.", "error");
   return;
  }

  setIsSubmitting(true);

  const payload = {
   title: form.title.trim(),
   department: form.dept.trim(),
   program: form.program.trim(),
   min_cpi: Number.parseFloat(form.cpi) || 0,
   team_size: form.teamSize.trim(),
   skills: form.skills.trim(),
   duration: form.duration.trim(),
   description: form.description.trim(),
   professor_id: professorName,
  };

  try {
   const response = await fetchJson("/api/projects/create-project", {
    method: "POST",
    body: payload,
   });

   const newProject = {
    id: response.projectId,
    applicant_count: 0,
    ...payload,
   };

   await mutate((current = []) => [newProject, ...current], false);
   setForm(EMPTY_FORM);
   setShowWizard(false);
   showToast("Project created successfully.");
  } catch (projectError) {
   showToast(getErrorMessage(projectError, "Unable to create the project."), "error");
  } finally {
   setIsSubmitting(false);
  }
 };

 const executeDelete = async () => {
  if (!projectToDelete) {
   return;
  }

  const deletedProjectId = projectToDelete;
  await mutate(
   (current = []) => current.filter((project) => project.id !== deletedProjectId),
   false,
  );

  try {
   await fetchJson(`/api/projects/delete-project/${deletedProjectId}`, {
    method: "DELETE",
   });
   showToast("Project deleted successfully.");
  } catch (deleteError) {
   await mutate();
   showToast(getErrorMessage(deleteError, "Unable to delete the project."), "error");
  } finally {
   setProjectToDelete(null);
  }
 };

 return (
  <DashboardLayout>
   <div className="space-y-8">
    <div className="glass-panel rounded-[28px] p-6 sm:p-8">
     <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
       <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">
        Professor Projects
       </p>
       <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        Manage project listings and applicant flow
       </h2>
       <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
        Publish project openings, monitor pending applications, and keep the
        selection pipeline clean without juggling stale lists.
       </p>
      </div>

      <button
       type="button"
       onClick={() => setShowWizard(true)}
       className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-bold text-white transition hover:bg-sky-600"
      >
       <Plus size={18} />
       Create New Project
      </button>
     </div>
    </div>

    {toast.show && (
     <div
      className={`fixed right-8 top-8 z-[100] flex items-center gap-3 rounded-2xl px-6 py-4 text-white shadow-2xl ${
       toast.type === "success" ? "bg-emerald-600" : "bg-rose-500"
      }`}
     >
      <span className="font-black">{toast.type === "success" ? "OK" : "!"}</span>
      <p className="font-semibold">{toast.message}</p>
     </div>
    )}

    {error && (
     <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
      {getErrorMessage(error, "Unable to load your project workspace.")}
     </div>
    )}

    <div className="grid grid-cols-1 gap-6">
     {isLoading ? (
      <div className="glass-panel rounded-[28px] px-6 py-12 text-center text-sm font-medium text-slate-500">
       Loading your project listings...
      </div>
     ) : projects.length === 0 ? (
      <div className="glass-panel rounded-[28px] px-6 py-14 text-center">
       <h3 className="text-xl font-black text-slate-900">
        No projects have been created yet
       </h3>
       <p className="mt-2 text-sm text-slate-500">
        Create your first project to start collecting applications.
       </p>
      </div>
     ) : (
      projects.map((project) => (
       <ProjectCard
        key={project.id}
        project={project}
        onApplicantAction={showToast}
        onDelete={() => setProjectToDelete(project.id)}
       />
      ))
     )}
    </div>

    {showWizard && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="scrollbar-none relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white shadow-[0_32px_100px_rgba(15,23,42,0.24)]">
       <div className="sticky top-0 border-b border-slate-100 bg-white/95 px-8 py-6 backdrop-blur">
        <h3 className="text-2xl font-black text-slate-900">
         Create a New Project
        </h3>
        <p className="mt-1 text-sm text-slate-500">
         Add a polished brief so students can decide faster.
        </p>
       </div>

       <form onSubmit={addProject} className="space-y-5 p-8">
        <div>
         <label className="mb-2 block text-sm font-bold text-slate-700">
          Project Title
         </label>
         <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Smart City IoT Infrastructure"
          className={inputClass}
         />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
         <InputField
          className={inputClass}
          label="Department"
          name="dept"
          onChange={handleChange}
          placeholder="e.g. CSE"
          value={form.dept}
         />
         <InputField
          className={inputClass}
          label="Required Program"
          name="program"
          onChange={handleChange}
          placeholder="e.g. B.Tech"
          value={form.program}
         />
         <InputField
          className={inputClass}
          label="Minimum CPI"
          name="cpi"
          onChange={handleChange}
          placeholder="e.g. 8.0"
          type="number"
          value={form.cpi}
         />
         <InputField
          className={inputClass}
          label="Team Size"
          name="teamSize"
          onChange={handleChange}
          placeholder="e.g. 2-4"
          value={form.teamSize}
         />
        </div>

        <InputField
         className={inputClass}
         label="Required Skills"
         name="skills"
         onChange={handleChange}
         placeholder="React, Python, data analysis..."
         value={form.skills}
        />

        <div>
         <label className="mb-2 block text-sm font-bold text-slate-700">
          Duration
         </label>
         <textarea
          name="duration"
          rows="2"
          value={form.duration}
          onChange={handleChange}
          placeholder="e.g. 3 months with weekly review checkpoints"
          className={`${inputClass} resize-none`}
         />
        </div>

        <div>
         <label className="mb-2 block text-sm font-bold text-slate-700">
          Project Description
         </label>
         <textarea
          name="description"
          rows="6"
          maxLength="500"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe the goal, expected outcomes, and the kind of contribution you're looking for."
          className={`${inputClass} resize-none`}
         />
         <p className="mt-2 text-right text-xs font-medium text-slate-400">
          {form.description.length}/500
         </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
         <button
          type="button"
          onClick={() => setShowWizard(false)}
          className="rounded-2xl bg-slate-100 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
         >
          Cancel
         </button>
         <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-sky-600 px-8 py-3 font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
         >
          {isSubmitting ? "Creating..." : "Launch Project"}
         </button>
        </div>
       </form>
      </div>
     </div>
    )}

    {projectToDelete && (
     <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] bg-white p-8 text-center shadow-[0_32px_100px_rgba(15,23,42,0.24)]">
       <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500">
        <AlertTriangle size={30} />
       </div>
       <h3 className="mt-5 text-2xl font-black text-slate-900">
        Delete this project?
       </h3>
       <p className="mt-2 text-sm leading-7 text-slate-500">
        This permanently removes the project and its linked applicant history.
       </p>

       <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => setProjectToDelete(null)}
          className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={executeDelete}
          className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 font-bold text-white transition hover:bg-rose-600"
        >
          Delete
        </button>
       </div>
      </div>
     </div>
    )}
   </div>
  </DashboardLayout>
 );
}

function ProjectCard({ onApplicantAction, onDelete, project }) {
 const [isExpanded, setIsExpanded] = useState(false);

 const {
  data: applicants = [],
  error,
  isLoading,
  mutate,
 } = useSWR(
  isExpanded ? `/api/projects/applications/${project.id}` : null,
 );

 const pendingApplicants = applicants.filter((application) => {
  const status = (application.status || "pending").toLowerCase();
  return status === "pending";
 });

 const handleStatus = async (application, status) => {
  await mutate(
   (current = []) =>
    current.filter((item) => item.application_id !== application.application_id),
   false,
  );

  onApplicantAction(
   `${application.full_name}'s application ${status}.`,
   status === "accepted" ? "success" : "error",
  );

  try {
   await fetchJson("/api/projects/applications/status", {
    method: "PUT",
    body: {
     application_id: application.application_id,
     status,
     email: application.email_id,
     name: application.full_name,
     projectTitle: project.title,
     profName: project.professor_id,
    },
   });
  } catch (statusError) {
   await mutate();
   onApplicantAction(
    getErrorMessage(statusError, "Unable to update the application status."),
    "error",
   );
  }
 };

 const applicantLabel =
  pendingApplicants.length || project.applicant_count || 0;

 return (
  <div className="glass-panel rounded-[32px] p-6">
   <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
     <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
      {project.department || "General"}
     </span>
     <h3 className="mt-4 text-2xl font-black text-slate-900">{project.title}</h3>
    </div>

    <div className="flex items-start gap-3">
     <div className="text-right">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
       Min CPI
      </p>
      <p className="mt-1 text-2xl font-black text-sky-600">
       {project.min_cpi ?? "N/A"}
      </p>
     </div>
     <button
      type="button"
      onClick={onDelete}
      className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
     >
      <Trash2 size={16} />
      Delete
     </button>
    </div>
   </div>

   <p className="mt-5 text-sm leading-7 text-slate-600">
    {project.description || "No description provided yet."}
   </p>

   <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-4">
    <InfoBlock label="Program" value={project.program} />
    <InfoBlock label="Duration" value={project.duration} />
    <InfoBlock label="Team Size" value={project.team_size} />
    <InfoBlock label="Skills" value={project.skills} />
   </div>

   <button
    type="button"
    onClick={() => setIsExpanded((current) => !current)}
    className="mt-6 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-left transition hover:border-sky-300"
   >
    <span className="text-sm font-bold text-slate-600">
     {isExpanded
      ? "Hide applicant list"
      : `View applicants (${applicantLabel})`}
    </span>
    <ChevronDown
     size={18}
     className={`transition-transform ${isExpanded ? "rotate-180 text-sky-600" : "text-slate-400"}`}
    />
   </button>

   {isExpanded && (
    <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white/85 shadow-sm">
     {error ? (
      <div className="px-5 py-8 text-center text-sm font-semibold text-rose-700">
       {getErrorMessage(error, "Unable to load applicants.")}
      </div>
     ) : isLoading ? (
      <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm font-medium text-slate-500">
       <LoaderCircle size={18} className="animate-spin" />
       Loading applicants...
      </div>
     ) : pendingApplicants.length > 0 ? (
      <div className="overflow-x-auto">
       <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
         <tr>
          <th className="px-5 py-4 font-black uppercase tracking-[0.18em]">
           Roll No
          </th>
          <th className="px-5 py-4 font-black uppercase tracking-[0.18em]">
           Name
          </th>
          <th className="px-5 py-4 font-black uppercase tracking-[0.18em]">
           Branch
          </th>
          <th className="px-5 py-4 font-black uppercase tracking-[0.18em]">
           CPI
          </th>
          <th className="px-5 py-4 font-black uppercase tracking-[0.18em]">
           Resume
          </th>
          <th className="px-5 py-4 font-black uppercase tracking-[0.18em]">
           SOP
          </th>
          <th className="px-5 py-4 text-center font-black uppercase tracking-[0.18em]">
           Actions
          </th>
         </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
         {pendingApplicants.map((application) => (
          <tr
           key={application.application_id}
           className="align-top hover:bg-slate-50"
          >
           <td className="px-5 py-4 font-medium text-slate-600">
            {application.roll_no}
           </td>
           <td className="px-5 py-4 font-bold text-slate-900">
            {application.full_name}
           </td>
           <td className="px-5 py-4 text-slate-600">{application.branch}</td>
           <td className="px-5 py-4 font-bold text-sky-600">
            {application.cpi}
           </td>
           <td className="px-5 py-4">
            <a
             href={application.resume}
             target="_blank"
             rel="noreferrer"
             className="font-bold text-sky-600 transition hover:text-sky-700 hover:underline"
            >
             View Resume
            </a>
           </td>
           <td className="max-w-sm px-5 py-4 text-slate-600">
            {application.sop || "No statement provided."}
           </td>
           <td className="px-5 py-4">
            <div className="flex justify-center gap-3">
             <button
              type="button"
              onClick={() => handleStatus(application, "accepted")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
              title="Accept"
             >
              <Check size={18} />
             </button>
             <button
              type="button"
              onClick={() => handleStatus(application, "rejected")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600 transition hover:bg-rose-600 hover:text-white"
              title="Reject"
             >
              <X size={18} />
             </button>
            </div>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     ) : (
      <div className="px-5 py-10 text-center text-sm font-medium text-slate-500">
       No pending applications for this project yet.
      </div>
     )}
    </div>
   )}
  </div>
 );
}

function InfoBlock({ label, value }) {
 return (
  <div>
   <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
    {label}
   </p>
   <p className="mt-2 text-sm font-bold text-slate-800">{value || "N/A"}</p>
  </div>
 );
}

function InputField({
 className,
 label,
 name,
 onChange,
 placeholder,
 type = "text",
 value,
}) {
 return (
  <div>
   <label className="mb-2 block text-sm font-bold text-slate-700">
    {label}
   </label>
   <input
    className={className}
    name={name}
    onChange={onChange}
    placeholder={placeholder}
    type={type}
    value={value}
   />
  </div>
 );
}

export default ProfessorProject;
