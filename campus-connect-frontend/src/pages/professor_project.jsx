import DashboardLayout from "../layouts/dashboard_layout.jsx";
import { useState } from "react";

function ProfessorProject() {
 const [projects, setProjects] = useState([
  {
   id: 1,
   title: "AI-Driven Healthcare Analytics",
   dept: "CSE",
   program: "B.Tech / M.Tech",
   cpi: "8.5",
   duration: "6 Months",
   teamSize: "3",
   skills: "Python, PyTorch, Data Visualization",
   description:
    "Looking for students to work on predictive modeling for hospital patient flow.",
   applicants: [
    {
     roll: "230095",
     name: "Arjun Mehta",
     branch: "CSE",
     cpi: "9.1",
     resume: "#",
    },
    {
     roll: "230096",
     name: "Sanya Iyer",
     branch: "ECE",
     cpi: "8.8",
     resume: "#",
    },
    {
     roll: "230098",
     name: "Rahul Verma",
     branch: "ME",
     cpi: "8.6",
     resume: "#",
    },
   ],
  },
  {
   id: 2,
   title: "Blockchain for Supply Chain",
   dept: "EE",
   program: "B.Tech",
   cpi: "8.0",
   duration: "4 Months",
   teamSize: "2",
   skills: "Solidity, React, Node.js",
   description:
    "Developing a decentralized tracking system for pharmaceutical logistics.",
   applicants: [
    {
     roll: "230098",
     name: "Priya Das",
     branch: "IT",
     cpi: "8.2",
     resume: "#",
    },
    {
     roll: "230098",
     name: "Aman Singh",
     branch: "CSE",
     cpi: "8.9",
     resume: "#",
    },
   ],
  },
 ]);

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

 const addProject = () => {
  if (!form.title || !form.description) return;
  const newProject = { id: Date.now(), ...form, applicants: [] };
  setProjects([newProject, ...projects]);
  setShowWizard(false);
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
 };

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
     {projects.map((p) => (
      <ProjectCard key={p.id} project={p} />
     ))}
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
        <div className="space-y-5">
         <div className="group">
          <label className="block text-sm font-bold text-slate-700 mb-2">
           Project Title
          </label>
          <input
           name="title"
           placeholder="e.g. Smart City IoT Infrastructure"
           onChange={handleChange}
           className="modal-input"
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
            className="modal-input"
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
            className="modal-input"
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
            className="modal-input"
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
            className="modal-input"
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
           className="modal-input"
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
           className="modal-input resize-none"
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
           className="modal-input resize-none"
          />
         </div>
         <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
          <button
           onClick={() => setShowWizard(false)}
           className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
          >
           Cancel
          </button>
          <button
           onClick={addProject}
           className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
          >
           Launch Project
          </button>
         </div>
        </div>
       </div>
      </div>
     </div>
    )}
   </div>

   <style>{`
        .modal-input {
          width: 100%; background-color: #f8fafc; border: 2px solid #e2e8f0;
          border-radius: 0.75rem; padding: 0.75rem 1rem; outline: none; transition: all 0.2s;
        }
        .modal-input:focus { border-color: #4f46e5; background-color: #fff; }
      `}</style>
  </DashboardLayout>
 );
}

function ProjectCard({ project }) {
 const [isExpanded, setIsExpanded] = useState(false);

 return (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
   <div className="p-6 pb-4">
    <div className="flex justify-between items-start mb-4">
     <div>
      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100">
       {project.dept}
      </span>
      <h3 className="text-xl font-bold text-slate-800 mt-2">{project.title}</h3>
     </div>
     <div className="text-right">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
       Min. CPI
      </p>
      <p className="text-xl font-black text-indigo-600">{project.cpi}+</p>
     </div>
    </div>

    <p className="text-slate-500 leading-relaxed mb-6 text-sm">
     {project.description}
    </p>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-50">
     <InfoBlock label="Program" value={project.program} />
     <InfoBlock label="Duration" value={project.duration} />
     <InfoBlock label="Team Size" value={project.teamSize} />
     <InfoBlock label="Skills" value={project.skills} />
    </div>

    <button
     onClick={() => setIsExpanded(!isExpanded)}
     className="w-full mt-4 flex items-center justify-between group py-2"
    >
     <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
      {isExpanded
       ? "Hide Applicant List"
       : `View Applicants (${project.applicants.length})`}
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
          Actions
         </th>
        </tr>
       </thead>
       <tbody className="divide-y divide-slate-100">
        {project.applicants.length > 0 ? (
         project.applicants.map((app, idx) => (
          <tr key={idx} className="hover:bg-slate-50 transition-colors">
           <td className="px-5 py-4 font-medium text-slate-600">{app.roll}</td>
           <td className="px-5 py-4 font-bold text-slate-900">{app.name}</td>
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
           <td className="px-5 py-4">
            <div className="flex justify-center gap-3">
             <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
              title="Accept"
             >
              ✓
             </button>
             <button
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
