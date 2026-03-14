import { useState } from "react";
import DashboardLayout from "../layouts/dashboard_layout";
import {
 Search,
 Clock,
 Award,
 User,
 Code2,
 X,
 Briefcase,
 CheckCircle,
} from "lucide-react";

function Projects() {
 const [selectedProject, setSelectedProject] = useState(null);
 const [searchQuery, setSearchQuery] = useState("");

 // 1. NEW STATE FOR IN-APP NOTIFICATION
 const [toastMessage, setToastMessage] = useState(null);

 const [applicationForm, setApplicationForm] = useState({
  rollNo: "",
  name: "",
  branch: "",
  cpi: "",
  resume: "",
  sop: "",
 });

 const [projects] = useState([
  {
   id: 1,
   title: "AI Research Assistant",
   professor: "Dr. Sharma",
   dept: "CSE",
   cpi: "8.5",
   duration: "6 Months",
   skills: "Python, PyTorch, ML",
   description:
    "Work on machine learning models for research automation and predictive analysis.",
  },
  {
   id: 2,
   title: "Blockchain Security",
   professor: "Dr. Gupta",
   dept: "IT",
   cpi: "8.0",
   duration: "4 Months",
   skills: "Solidity, Cryptography",
   description:
    "Analyze blockchain vulnerabilities and write secure smart contracts.",
  },
  {
   id: 3,
   title: "Campus Navigation App",
   professor: "Dr. Mehta",
   dept: "ECE",
   cpi: "7.5",
   duration: "3 Months",
   skills: "React Native, Firebase",
   description:
    "Develop a mobile app for indoor and outdoor campus navigation.",
  },
 ]);

 const filteredProjects = projects.filter(
  (p) =>
   p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
   p.skills.toLowerCase().includes(searchQuery.toLowerCase()),
 );

 const handleInputChange = (e) => {
  setApplicationForm({ ...applicationForm, [e.target.name]: e.target.value });
 };

 const handleApply = (e) => {
  e.preventDefault();

  // 2. TRIGGER THE TOAST INSTEAD OF THE BROWSER ALERT
  setToastMessage(
   `Application sent to ${selectedProject.professor} successfully!`,
  );

  // 3. AUTO-HIDE THE TOAST AFTER 3 SECONDS
  setTimeout(() => {
   setToastMessage(null);
  }, 3000);

  setSelectedProject(null);
  setApplicationForm({
   rollNo: "",
   name: "",
   branch: "",
   cpi: "",
   resume: "",
   sop: "",
  });
 };

 return (
  <DashboardLayout>
   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
    {/* TOAST NOTIFICATION UI */}
    {toastMessage && (
     <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-8 slide-in-from-right-8 duration-300">
      <CheckCircle size={24} />
      <div>
       <p className="text-sm font-black uppercase tracking-widest text-green-200 mb-0.5">
        Success
       </p>
       <p className="font-bold">{toastMessage}</p>
      </div>
      <button
       onClick={() => setToastMessage(null)}
       className="ml-4 text-green-200 hover:text-white"
      >
       <X size={18} />
      </button>
     </div>
    )}

    {/* HEADER & SEARCH BAR */}
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
     <div>
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
       Project Board
      </h2>
      <p className="text-slate-500 mt-1">
       Discover and apply to cutting-edge research opportunities.
      </p>
     </div>

     <div className="relative w-full md:w-96">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
       <Search size={18} />
      </div>
      <input
       type="text"
       placeholder="Search by title or skill..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium text-slate-700 shadow-sm text-sm"
      />
     </div>
    </div>

    {/* PROJECT GRID */}
    {filteredProjects.length > 0 ? (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProjects.map((project) => (
       <div
        key={project.id}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 flex flex-col"
       >
        <div className="flex justify-between items-start mb-4">
         <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100">
          {project.dept}
         </span>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">
         {project.title}
        </h3>
        <p className="text-sm text-slate-500 mb-6 flex-1">
         {project.description}
        </p>

        <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
         <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
          <User size={16} className="text-indigo-500" />
          <span>{project.professor}</span>
         </div>
         <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
          <Award size={16} className="text-indigo-500" />
          <span>
           Min CPI: <span className="font-bold">{project.cpi}</span>
          </span>
         </div>
         <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
          <Clock size={16} className="text-indigo-500" />
          <span>{project.duration}</span>
         </div>
         <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
          <Code2 size={16} className="text-indigo-500 min-w-max" />
          <span className="truncate">{project.skills}</span>
         </div>
        </div>

        <button
         onClick={() => setSelectedProject(project)}
         className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
         <Briefcase size={18} /> Review & Apply
        </button>
       </div>
      ))}
     </div>
    ) : (
     <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
      <Search size={48} className="mx-auto text-slate-300 mb-4" />
      <h3 className="text-lg font-bold text-slate-700">No projects found</h3>
      <p className="text-slate-500">Try adjusting your search terms.</p>
     </div>
    )}

    {/* APPLICATION MODAL */}
    {selectedProject && (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
       className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
       onClick={() => setSelectedProject(null)}
      ></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
       <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
         <h3 className="text-xl font-bold text-slate-900">
          {selectedProject.title}
         </h3>
         <p className="text-sm text-slate-500 font-medium mt-1">
          Application for {selectedProject.professor}
         </p>
        </div>
        <button
         onClick={() => setSelectedProject(null)}
         className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
        >
         <X size={20} />
        </button>
       </div>

       <form onSubmit={handleApply} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
         <div>
          <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
           Roll No <span className="text-red-500">*</span>
          </label>
          <input
           type="text"
           required
           name="rollNo"
           value={applicationForm.rollNo}
           onChange={handleInputChange}
           placeholder="e.g. 230095"
           className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-bold text-slate-700"
          />
         </div>
         <div>
          <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
           Full Name <span className="text-red-500">*</span>
          </label>
          <input
           type="text"
           required
           name="name"
           value={applicationForm.name}
           onChange={handleInputChange}
           placeholder="e.g. Arjun Mehta"
           className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-bold text-slate-700"
          />
         </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
         <div>
          <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
           Branch <span className="text-red-500">*</span>
          </label>
          <input
           type="text"
           required
           name="branch"
           value={applicationForm.branch}
           onChange={handleInputChange}
           placeholder="e.g. CSE"
           className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-bold text-slate-700"
          />
         </div>
         <div>
          <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
           Current CPI <span className="text-red-500">*</span>
          </label>
          <input
           type="number"
           step="0.01"
           required
           name="cpi"
           value={applicationForm.cpi}
           onChange={handleInputChange}
           placeholder="e.g. 9.1"
           className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-bold text-slate-700"
          />
         </div>
        </div>

        <div>
         <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
          Resume Link <span className="text-red-500">*</span>
         </label>
         <input
          type="url"
          required
          name="resume"
          value={applicationForm.resume}
          onChange={handleInputChange}
          placeholder="Link to Google Drive..."
          className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-bold text-slate-700"
         />
        </div>

        <div>
         <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
          Statement of Purpose{" "}
          <span className="text-slate-400 font-normal tracking-normal lowercase">
           (Optional)
          </span>
         </label>
         <textarea
          name="sop"
          value={applicationForm.sop}
          onChange={handleInputChange}
          placeholder="Briefly explain why you are a good fit..."
          className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors resize-none h-24 text-sm font-medium text-slate-700"
         />
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
         <button
          type="button"
          onClick={() => setSelectedProject(null)}
          className="flex-1 px-4 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
         >
          Cancel
         </button>
         <button
          type="submit"
          className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
         >
          Submit Application
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

export default Projects;
