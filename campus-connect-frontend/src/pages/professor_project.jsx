import { data } from "react-router-dom";
import DashboardLayout from "../layouts/dashboard_layout.jsx";
import { useState, useEffect } from "react";
import axios from "axios";
function ProfessorProject() {
 // 1. TOAST STATE (Moved INSIDE the component)
 const [toast, setToast] = useState({
  show: false,
  message: "",
  type: "success",
 });

 const onApplicantAction = (message, type = "success") => {
  setToast({ show: true, message, type });
  setTimeout(() => {
   setToast({ show: false, message: "", type: "success" });
  }, 3000);
 };

 const [projects, setProjects] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 useEffect(() => {
  const fetchProjects = async () => {
   try {
    // 1. Call your Express backend
    const response = await fetch(
     "http://localhost:5001/api/projects/get-all-project",
    );

    if (!response.ok) {
     throw new Error("Failed to fetch from database");
    }

    // 2. Convert the response to JSON
    const data = await response.json();

    // 3. Put the real database projects into our React state
    // console.log("Fetching projects from backend...", data);
    setProjects(data);
   } catch (error) {
    console.error("Error loading projects:", error);
    onApplicantAction("Failed to load projects from server.", "error");
   } finally {
    // Turn off the loading state when finished
    setIsLoading(false);
   }
  };
  fetchProjects();
 }, []); // The empty brackets [] mean this only runs ONCE when the page loads

 const [showWizard, setShowWizard] = useState(false);

 const [form, setForm] = useState({
  title: "",
  dept: "",
  program: "",
  cpi: "",
  duration: "",
  teamSize: "",
  skills: "",
  description: "",
  link: "",
  comments: "",
 });

 const handleChange = (e) => {
  setForm({ ...form, [e.target.name]: e.target.value });
 };

 //console.log("Form data being sent to backend:", form);
 const addProject = async (e) => {
  e.preventDefault();
  if (!form.title || !form.description) return;

  try {
   // 1. Get the logged-in user to attach their ID (Ensure your login saves this to localStorage!)
   const user = JSON.parse(localStorage.getItem("user"));
   const profId = user.name;

   // 2. Map the React state to the exact names your backend/database expects
   const payload = {
    title: form.title,
    department: form.dept, // Map 'dept' -> 'department'
    program: form.program,
    min_cpi: parseFloat(form.cpi) || 0, // Map 'cpi' -> 'min_cpi' and ensure it's a number
    team_size: form.teamSize, // Map 'teamSize' -> 'team_size'
    skills: form.skills,
    duration: form.duration,
    description: form.description,
    professor_id: profId, // Attach the ID here!
   };

   // 3. Send the formatted payload instead of the raw form
   const response = await fetch(
    "http://localhost:5001/api/projects/create-project",
    {
     method: "POST",
     headers: {
      "Content-Type": "application/json",
     },
     body: JSON.stringify(payload), // <-- Send 'payload' here
    },
   );

   if (!response.ok) {
    throw new Error("Failed to save to database");
   }

   const savedProject = await response.json();

   const newProjectForUI = {
    ...savedProject,

    applicants: savedProject.applicants || [],
   };

   setProjects([newProjectForUI, ...projects]);
   setShowWizard(false);
   onApplicantAction("Project saved to database successfully!", "success");

   setForm({
    title: "",
    dept: "",
    program: "",
    cpi: "",
    duration: "",
    teamSize: "",
    skills: "",
    description: "",
    link: "",
    comments: "",
   });
  } catch (error) {
   console.error("Error:", error);
   onApplicantAction(
    "Error saving project. Is your backend server running?",
    "error",
   );
  }
 };

 // Reusable Tailwind class for inputs
 const inputClass =
  "w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 outline-none transition-all focus:border-indigo-600 focus:bg-white";

 return (
  <DashboardLayout>
   <div className="min-h-screen bg-slate-50 p-6 font-sans">
    {/* HEADER */}
    <div className="flex justify-between items-center mb-8">
     <div>
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
       Project Applications
      </h2>
      <p className="text-slate-500 mt-1">
       Review student applications and manage project details.
      </p>
     </div>
     <button
      onClick={() => setShowWizard(true)}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
     >
      <span className="text-xl">+</span> Create New Project
     </button>
    </div>

    {/* PROJECT LIST */}
    <div className="grid grid-cols-1 gap-6">
     {isLoading ? (
      <div className="text-center p-10 text-slate-500 font-bold">
       Loading your projects from the database...
      </div>
     ) : projects.length === 0 ? (
      <div className="text-center p-10 text-slate-500 font-bold">
       No projects found. Click "Create New Project" to add one!
      </div>
     ) : (
      projects.map((p) => (
       <ProjectCard
        key={p.id}
        project={p}
        onApplicantAction={onApplicantAction}
       />
      ))
     )}
    </div>

    {/* PROJECT WIZARD MODAL */}
    {showWizard && (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
       className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
       onClick={() => setShowWizard(false)}
      ></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
       <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
         Create New Project
        </h2>

        {/* 2. CHANGED DIV TO FORM */}
        <form onSubmit={addProject} className="space-y-5">
         <div className="group">
          <label className="block text-sm font-bold text-slate-700 mb-2">
           Project Title
          </label>
          <input
           name="title"
           placeholder="e.g. Smart City IoT Infrastructure"
           onChange={handleChange}
           className={inputClass}
          />
         </div>
         <div className="grid grid-cols-2 gap-4">
          <div>
           <label className="block text-sm font-bold text-slate-700 mb-2">
            Department
           </label>
           <input
            name="dept"
            placeholder="e.g. CSE"
            onChange={handleChange}
            className={inputClass}
           />
          </div>
          <div>
           <label className="block text-sm font-bold text-slate-700 mb-2">
            Required Program
           </label>
           <input
            name="program"
            placeholder="e.g. B.Tech"
            onChange={handleChange}
            className={inputClass}
           />
          </div>
          <div>
           <label className="block text-sm font-bold text-slate-700 mb-2">
            Min CPI
           </label>
           <input
            name="cpi"
            placeholder="e.g. 8.0"
            onChange={handleChange}
            className={inputClass}
           />
          </div>
          <div>
           <label className="block text-sm font-bold text-slate-700 mb-2">
            Team Size
           </label>
           <input
            name="teamSize"
            placeholder="e.g. 2-4"
            onChange={handleChange}
            className={inputClass}
           />
          </div>
         </div>
         <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
           Required Skills
          </label>
          <input
           name="skills"
           placeholder="React, Python..."
           onChange={handleChange}
           className={inputClass}
          />
         </div>
         <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
           Duration
          </label>
          <textarea
           name="duration"
           rows="1"
           placeholder="e.g. 3 months"
           onChange={handleChange}
           className={`${inputClass} resize-none`}
          />
         </div>
         <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
           Project Description
          </label>
          <textarea
           name="description"
           rows="3"
           placeholder="Description..."
           onChange={handleChange}
           className={`${inputClass} resize-none`}
          />
         </div>
         <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
          <button
           type="button"
           onClick={() => setShowWizard(false)}
           className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
          >
           Cancel
          </button>
          {/* 3. CHANGED TO TYPE="SUBMIT" */}
          <button
           type="submit"
           className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
          >
           Launch Project
          </button>
         </div>
        </form>
       </div>
      </div>
     </div>
    )}
   </div>

   {/* TOAST NOTIFICATION */}
   <div
    className={`fixed top-6 right-6 z-50 z-50 transform transition-all duration-300 ${
     toast.show
      ? "translate-y-0 opacity-100"
      : "translate-y-10 opacity-0 pointer-events-none"
    }`}
   >
    <div
     className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl border text-sm font-bold ${
      toast.type === "success"
       ? "bg-green-50 border-green-200 text-green-700"
       : "bg-red-50 border-red-200 text-red-700"
     }`}
    >
     <span>{toast.type === "success" ? "✓" : "✕"}</span>
     {toast.message}
    </div>
   </div>
  </DashboardLayout>
 );
}
function ProjectCard({ project, onApplicantAction }) {
 const [isExpanded, setIsExpanded] = useState(false);

 // CRITICAL FIX: If the database doesn't send an applicants array, we default to an empty array [] so React doesn't crash!
 const safeApplicants = project.applicants || [];
 const [applicants, setApplicants] = useState([]);
 useEffect(() => {
  if (isExpanded) {
   axios
    .get(`http://localhost:5001/api/projects/applications/${project.id}`)
    .then((res) => {
     const pendingOnly = res.data.filter((app) => app.status === "pending");

     setApplicants(pendingOnly);
    })
    .catch((err) => console.error(err));
  }
 }, [isExpanded, project.id]);
 const handleStatus = async (app, status) => {
  // ✅ 1. REMOVE instantly (fast UI)
  setApplicants((prev) =>
   prev.filter((a) => a.application_id !== app.application_id),
  );

  // ✅ 2. SHOW TOAST instantly
  onApplicantAction(
   `${app.full_name}'s application ${status}`,
   status === "accepted" ? "success" : "error",
  );

  try {
   // ✅ 3. API call in background
   await axios.put("http://localhost:5001/api/projects/applications/status", {
    application_id: app.application_id,
    status: status,
    email: app.email_id,
    name: app.full_name,
   });
  } catch (err) {
   console.error(err);
   onApplicantAction("Server error!", "error");
  }
 };
 return (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
   <div className="p-6 pb-4">
    <div className="flex justify-between items-start mb-4">
     <div>
      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100">
       {project.department}
      </span>
      <h3 className="text-xl font-bold text-slate-800 mt-2">{project.title}</h3>
     </div>
     <div className="text-right">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
       Min. CPI
      </p>
      <p className="text-xl font-black text-indigo-600">{project.min_cpi}+</p>
     </div>
    </div>

    <p className="text-slate-500 leading-relaxed mb-6 text-sm">
     {project.description}
    </p>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-50">
     <InfoBlock label="Program" value={project.program} />
     <InfoBlock label="Duration" value={project.duration} />
     <InfoBlock label="Team Size" value={project.team_size} />
     <InfoBlock label="Skills" value={project.skills} />
    </div>

    <button
     onClick={() => setIsExpanded(!isExpanded)}
     className="w-full mt-4 flex items-center justify-between group py-2"
    >
     <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
      {/* FIX: Now using safeApplicants.length */}
      {isExpanded ? "Hide Applicant List" : `View Applicants`}
     </span>
     <div
      className={`transform transition-transform duration-300 p-1 rounded-full ${isExpanded ? "rotate-180 bg-indigo-50" : "bg-slate-50"}`}
     >
      <svg
       width="20"
       height="20"
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       strokeWidth="3"
       strokeLinecap="round"
       strokeLinejoin="round"
       className={isExpanded ? "text-indigo-600" : "text-slate-400"}
      >
       <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
     </div>
    </button>
   </div>

   {isExpanded && (
    <div className="bg-slate-50/50 border-t border-slate-100 p-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
     <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
       <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
        <tr>
         <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-wider">
          Roll No
         </th>
         <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-wider">
          Name
         </th>
         <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-wider">
          Branch
         </th>
         <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-wider">
          CPI
         </th>
         <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-wider text-center">
          Resume
         </th>
         <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-wider text-center">
          Comments
         </th>
         <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-wider text-center">
          Actions
         </th>
        </tr>
       </thead>
       <tbody className="divide-y divide-slate-100">
        {/* FIX: Now using safeApplicants.length and safeApplicants.map */}
        {applicants.length > 0 ? (
         applicants.map((app) => (
          <tr
           key={app.application_id}
           className="hover:bg-slate-50 transition-colors"
          >
           <td className="px-5 py-4 font-medium text-slate-600">
            {app.roll_no}
           </td>
           <td className="px-5 py-4 font-bold text-slate-900">
            {app.full_name}
           </td>
           <td className="px-5 py-4 text-slate-600">{app.branch}</td>
           <td className="px-5 py-4 font-bold text-indigo-600">{app.cpi}</td>
           <td className="px-5 py-4 text-center">
            <a
             href={app.resume}
             className="text-indigo-600 font-bold hover:underline"
            >
             View PDF
            </a>
           </td>
           <td className="px-5 py-4 font-bold text-slate-600">{app.sop}</td>
           <td className="px-5 py-4">
            <div className="flex justify-center gap-3">
             <button
              onClick={() => handleStatus(app, "accepted")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
              title="Accept"
             >
              ✓
             </button>
             <button
              onClick={() => handleStatus(app, "rejected")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
              title="Reject"
             >
              ✕
             </button>
            </div>
           </td>
          </tr>
         ))
        ) : (
         <tr>
          <td
           colSpan="6"
           className="px-5 py-10 text-center text-slate-400 italic"
          >
           No applications received yet.
          </td>
         </tr>
        )}
       </tbody>
      </table>
     </div>
    </div>
   )}
  </div>
 );
}

function InfoBlock({ label, value }) {
 return (
  <div>
   <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-1">
    {label}
   </p>
   <p className="text-sm font-bold text-slate-700">{value || "N/A"}</p>
  </div>
 );
}

export default ProfessorProject;
