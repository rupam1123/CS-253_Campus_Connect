import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
 BarChart3,
 BookOpen,
 Briefcase,
 CalendarDays,
 ChevronDown,
 GraduationCap,
 LayoutDashboard,
 LogOut,
 Menu,
 MessageSquare,
 PencilLine,
 ShieldCheck,
 Trash2,
 X,
} from "lucide-react";
import { fetchJson, getErrorMessage } from "../lib/api.js";
import {
 clearSession,
 getStoredRole,
 getStoredUser,
 persistSession,
} from "../lib/session.js";

const EMPTY_PROFILE_FORM = {
 anonymousUsername: "",
 branch: "",
 cpi: "",
 rollNumber: "",
 resume: "",
};

const EMPTY_PASSWORD_FORM = {
 currentPassword: "",
 newPassword: "",
 confirmPassword: "",
};

const PASSWORD_RULES = [
 {
  label: "8-64 characters",
  test: (value) => value.length >= 8 && value.length <= 64,
 },
 {
  label: "uppercase letter",
  test: (value) => /[A-Z]/.test(value),
 },
 {
  label: "lowercase letter",
  test: (value) => /[a-z]/.test(value),
 },
 {
  label: "number",
  test: (value) => /\d/.test(value),
 },
 {
  label: "special character",
  test: (value) => /[^A-Za-z\d]/.test(value),
 },
];

function DashboardLayout({ children }) {
 const [isProfileOpen, setIsProfileOpen] = useState(false);
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [isDeletingAccount, setIsDeletingAccount] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [showProfileModal, setShowProfileModal] = useState(false);
 const [isSavingProfile, setIsSavingProfile] = useState(false);
 const [isChangingPassword, setIsChangingPassword] = useState(false);
 const [showPasswordPanel, setShowPasswordPanel] = useState(false);
 const [sessionUser, setSessionUser] = useState(() => getStoredUser());
 const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM);
 const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
 const [notice, setNotice] = useState(null);
 const profileMenuRef = useRef(null);
 const location = useLocation();
 const navigate = useNavigate();
 const role = (sessionUser?.role || getStoredRole() || "professor").toLowerCase();

 const { data: profileData, mutate: mutateProfile } = useSWR(
  sessionUser?.id ? "/api/auth/profile" : null,
 );

 useEffect(() => {
  if (!notice) {
   return undefined;
  }

  const timeoutId = window.setTimeout(() => setNotice(null), 3200);
  return () => window.clearTimeout(timeoutId);
 }, [notice]);

 useEffect(() => {
  if (!isProfileOpen) {
   return undefined;
  }

  const handlePointerDown = (event) => {
   if (!profileMenuRef.current?.contains(event.target)) {
    setIsProfileOpen(false);
   }
  };

  const handleEscape = (event) => {
   if (event.key === "Escape") {
    setIsProfileOpen(false);
   }
  };

  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("keydown", handleEscape);

  return () => {
   window.removeEventListener("pointerdown", handlePointerDown);
   window.removeEventListener("keydown", handleEscape);
  };
 }, [isProfileOpen]);

 useEffect(() => {
  setIsProfileOpen(false);
 }, [location.pathname]);

 useEffect(() => {
  if (!showProfileModal) {
   return;
  }

  const profileUser = profileData?.user || sessionUser;
 setProfileForm({
   anonymousUsername: profileUser?.anonymousUsername || "",
   branch: profileUser?.branch || "",
   cpi:
    profileUser?.cpi === null || profileUser?.cpi === undefined
     ? ""
     : String(profileUser.cpi),
   rollNumber: profileUser?.rollNumber || "",
   resume: profileUser?.resume || "",
  });
  setPasswordForm(EMPTY_PASSWORD_FORM);
  setShowPasswordPanel(false);
 }, [profileData, sessionUser, showProfileModal]);

 const profileUser = profileData?.user || sessionUser;
 const displayName =
  profileUser?.name ||
  (role === "student" ? "Campus Student" : "Campus Professor");
 const anonymousUsername =
  profileUser?.anonymousUsername ||
  (profileUser?.id ? `anonymous_${profileUser.id}` : "anonymous_user");
 const email = profileUser?.email || "account@campusconnect.local";
 const initials = displayName
  .split(" ")
  .map((part) => part[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

 const pageTitles = {
  "/student-dashboard": {
   title: "Student Overview",
   subtitle: "Your courses, applications, and next actions in one place.",
  },
  "/professor-dashboard": {
   title: "Teaching Analytics",
   subtitle: "Monitor course sentiment and respond to student feedback faster.",
  },
  "/professor-projects": {
   title: "Project Workspace",
   subtitle: "Publish openings, review applicants, and keep project intake tidy.",
  },
  "/manage-course": {
   title: "Manage Course",
   subtitle: "Create courses, manage staff, and enroll students in one workspace.",
  },
  "/your-courses": {
   title: "Your Courses",
   subtitle: "Track lecture tiles and open class-level discussion when sessions go live.",
  },
  "/projects": {
   title: "Project Board",
   subtitle: "Browse active opportunities and apply with confidence.",
  },
  "/forum": {
   title: "Community Forum",
   subtitle: "Share ideas, ask questions, and keep discussions constructive.",
  },
  "/feedback": {
   title: "Live Feedback",
   subtitle: "Rate live lectures once, comment in the moment, and revisit the archive later.",
  },
 };

 const studentMenu = [
  {
   name: "Overview",
   path: "/student-dashboard",
   icon: <LayoutDashboard size={20} />,
  },
  { name: "Projects", path: "/projects", icon: <Briefcase size={20} /> },
  { name: "Forum", path: "/forum", icon: <MessageSquare size={20} /> },
  { name: "Feedback", path: "/feedback", icon: <BarChart3 size={20} /> },
 ];

 const professorMenu = [
  {
   name: "Analytics",
   path: "/professor-dashboard",
   icon: <BarChart3 size={20} />,
  },
  {
   name: "Projects",
   path: "/professor-projects",
   icon: <Briefcase size={20} />,
  },
  {
   name: "Manage Course",
   path: "/manage-course",
   icon: <CalendarDays size={20} />,
  },
  {
   name: "Your Course",
   path: "/your-courses",
   icon: <BookOpen size={20} />,
  },
  { name: "Forum", path: "/forum", icon: <MessageSquare size={20} /> },
 ];

 const menu = role === "student" ? studentMenu : professorMenu;
 const activePage = pageTitles[location.pathname] || {
  title: "Campus Workspace",
  subtitle: "Stay on top of the academic workflow.",
 };

 const showNotice = (message, type = "success") => {
  setNotice({ message, type });
 };

 const handleLogout = () => {
  clearSession();
  navigate("/");
 };

 const handleProfileInputChange = (event) => {
  const { name, value } = event.target;
  setProfileForm((current) => ({ ...current, [name]: value }));
 };

 const handlePasswordInputChange = (event) => {
  const { name, value } = event.target;
  setPasswordForm((current) => ({ ...current, [name]: value }));
 };

 const handleSaveProfile = async (event) => {
  event.preventDefault();
  setIsSavingProfile(true);

  try {
   const response = await fetchJson("/api/auth/profile", {
    method: "PUT",
    body: {
     anonymousUsername: profileForm.anonymousUsername,
     branch: profileForm.branch,
     cpi: profileForm.cpi,
     rollNumber: profileForm.rollNumber,
     resume: profileForm.resume,
    },
   });

   persistSession({ user: response.user });
   setSessionUser(response.user);
   await mutateProfile({ user: response.user }, false);
   setShowProfileModal(false);
   showNotice("Profile updated successfully.");
  } catch (error) {
   showNotice(getErrorMessage(error, "Unable to update your profile."), "error");
  } finally {
   setIsSavingProfile(false);
  }
 };

 const handleChangePassword = async (event) => {
  event.preventDefault();

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
   showNotice("New password and confirm password must match.", "error");
   return;
  }

  if (!PASSWORD_RULES.every((rule) => rule.test(passwordForm.newPassword))) {
   showNotice(
    "New password must include uppercase, lowercase, number, and special character.",
    "error",
   );
   return;
  }

  setIsChangingPassword(true);

  try {
   const response = await fetchJson("/api/auth/change-password", {
    method: "PUT",
    body: passwordForm,
   });
   setPasswordForm(EMPTY_PASSWORD_FORM);
   showNotice(response.message || "Password changed successfully.");
  } catch (error) {
   showNotice(getErrorMessage(error, "Unable to change password."), "error");
  } finally {
   setIsChangingPassword(false);
  }
 };

 const handleDeleteAccount = async () => {
  if (!profileUser?.id) {
   return;
  }

  setIsDeletingAccount(true);

  try {
   await fetchJson("/api/auth/delete-account", {
    method: "DELETE",
    body: { userId: profileUser.id },
   });
   clearSession();
   setShowDeleteModal(false);
   navigate("/", { replace: true });
  } catch (error) {
   showNotice(
    getErrorMessage(error, "Unable to delete your account right now."),
    "error",
   );
  } finally {
   setIsDeletingAccount(false);
  }
 };

 return (
  <div className="relative h-screen overflow-hidden bg-app-shell text-slate-800">
   <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(45,212,191,0.16),_transparent_36%)]" />
   <div className="pointer-events-none absolute bottom-0 left-[12%] h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
   <div className="pointer-events-none absolute right-[8%] top-[22%] h-52 w-52 rounded-full bg-fuchsia-200/20 blur-3xl" />

   {notice && (
    <div
     className={`fixed right-5 top-5 z-[120] rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-2xl ${
      notice.type === "error" ? "bg-rose-500" : "bg-emerald-600"
     }`}
    >
     {notice.message}
    </div>
   )}

   <div className="flex h-full overflow-hidden">
    <div
     className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden ${
      isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
     }`}
     onClick={() => setIsSidebarOpen(false)}
    />

    <aside
     className={`glass-panel-dark fixed inset-y-0 left-0 z-50 flex w-[18rem] max-w-[88vw] flex-col overflow-hidden text-slate-200 transition-transform duration-300 lg:static lg:w-[17.75rem] lg:max-w-none lg:translate-x-0 ${
      isSidebarOpen ? "translate-x-0" : "-translate-x-full"
     }`}
    >
     <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.32),_transparent_55%),radial-gradient(circle_at_right,_rgba(20,184,166,0.24),_transparent_48%)]" />

     <div className="relative flex items-center justify-between px-5 pb-5 pt-6">
      <div className="flex items-center gap-3">
       <div className="flex h-11 w-11 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-sky-300 via-cyan-300 to-teal-300 text-slate-950 shadow-lg shadow-cyan-500/20 ring-1 ring-white/30">
        <GraduationCap size={22} strokeWidth={2.4} />
       </div>
       <div>
        <p className="text-lg font-black tracking-tight text-white">
         CampusConnect
        </p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-sky-200/80">
         Glass Workspace
        </p>
       </div>
      </div>

      <button
       type="button"
       onClick={() => setIsSidebarOpen(false)}
       className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 lg:hidden"
      >
       <X size={18} />
      </button>
     </div>

     <div className="relative px-4 pb-4">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
       <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
         Signed In
        </p>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/85">
         {role}
        </span>
       </div>
       <div className="mt-3 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-white/10 text-sm font-black text-white ring-1 ring-white/10">
         {initials}
        </div>
        <div className="min-w-0 flex-1">
         <p className="truncate text-sm font-bold text-white">{displayName}</p>
         <p className="truncate text-[12px] text-slate-400">{email}</p>
         <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
          @{anonymousUsername}
         </p>
        </div>
       </div>
       <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
         <p className="text-[9px] uppercase leading-tight tracking-[0.12em] text-slate-500">
          Workspace
         </p>
         <p className="mt-1 truncate text-xs font-bold text-white">
          {role === "student" ? "Student" : "Professor"}
         </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
         <p className="text-[9px] uppercase leading-tight tracking-[0.12em] text-slate-500">
          Alias
         </p>
         <p className="mt-1 truncate text-xs font-bold text-white">
          @{anonymousUsername}
         </p>
        </div>
       </div>
      </div>
     </div>

     <nav className="relative flex-1 px-4 pb-5">
      <p className="px-3 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
       Navigation
      </p>
      <div className="mt-3 space-y-2">
       {menu.map((item) => (
        <NavLink
         key={item.path}
         to={item.path}
         onClick={() => {
          setIsProfileOpen(false);
          setIsSidebarOpen(false);
         }}
         className={({ isActive }) =>
          `group flex items-center gap-3 rounded-[1.35rem] border px-3.5 py-3 transition-all ${
           isActive
            ? "border-sky-300/50 bg-[linear-gradient(135deg,rgba(56,189,248,0.9),rgba(45,212,191,0.82))] text-slate-950 shadow-[0_20px_40px_rgba(14,165,233,0.28)]"
            : "border-transparent bg-white/0 text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
          }`
         }
        >
         <span className="opacity-85 group-hover:opacity-100">{item.icon}</span>
         <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {item.name}
         </span>
        </NavLink>
       ))}
      </div>
     </nav>

     <div className="relative border-t border-white/10 p-4">
      <button
       type="button"
       onClick={handleLogout}
       className="flex w-full items-center justify-center gap-2 rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:border-rose-300/40 hover:bg-rose-400/10 hover:text-white"
      >
       <LogOut size={18} />
       Sign Out
      </button>
     </div>
    </aside>

    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
     <header className="sticky top-0 z-30 px-4 pb-3 pt-3 sm:px-5 lg:px-6">
      <div className="mesh-card flex flex-wrap items-center justify-between gap-3 rounded-[26px] px-4 py-3.5 backdrop-blur-[28px] sm:px-5">
       <div className="flex min-w-0 items-center gap-3">
        <button
         type="button"
         onClick={() => setIsSidebarOpen(true)}
         className="rounded-[1.15rem] border border-white/60 bg-white/80 p-2.5 text-slate-700 shadow-sm lg:hidden"
        >
         <Menu size={19} />
        </button>

        <div className="min-w-0">
         <div className="flex flex-wrap items-center gap-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
           Workspace
          </p>
          <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
           {role}
          </span>
         </div>
         <h1 className="truncate text-lg font-black tracking-tight text-slate-900 sm:text-[1.7rem]">
          {activePage.title}
         </h1>
         <p className="mt-0.5 hidden max-w-2xl truncate text-sm text-slate-500 md:block">
          {activePage.subtitle}
         </p>
        </div>
       </div>

       <div className="flex items-center gap-3">
        <div ref={profileMenuRef} className="relative">
         <button
          type="button"
          onClick={() => setIsProfileOpen((open) => !open)}
          className="flex items-center gap-3 rounded-full border border-white/70 bg-white/85 px-2.5 py-2 shadow-[0_18px_32px_rgba(15,23,42,0.08)] transition hover:border-sky-300 hover:bg-white"
         >
          <div className="min-w-0 text-right">
           <p className="truncate text-sm font-bold text-slate-800">
            {displayName}
           </p>
           <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            @{anonymousUsername}
           </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-500 text-sm font-black text-white shadow-[0_12px_24px_rgba(14,165,233,0.24)]">
           {initials}
          </div>
          <ChevronDown size={16} className="text-slate-400" />
         </button>

         {isProfileOpen && (
          <div className="absolute right-0 mt-3 w-[310px] overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(240,249,255,0.86))] shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
           <div className="border-b border-white/70 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.18),_transparent_32%),radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.88),rgba(240,249,255,0.72))] px-5 py-5">
            <div className="flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-500 text-sm font-black text-white shadow-[0_12px_24px_rgba(14,165,233,0.24)]">
              {initials}
             </div>
             <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-900">
               {displayName}
              </p>
              <p className="mt-1 truncate text-sm text-slate-500">{email}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-600">
               @{anonymousUsername}
              </p>
             </div>
            </div>
           </div>

           <div className="p-3">
            <button
             type="button"
             onClick={() => {
              setIsProfileOpen(false);
              setShowProfileModal(true);
             }}
             className="flex w-full items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100/80"
            >
             <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <PencilLine size={18} />
             </span>
             Update Profile
            </button>
            <button
             type="button"
             onClick={() => {
              setIsProfileOpen(false);
              setShowDeleteModal(true);
             }}
             className="flex w-full items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
            >
             <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Trash2 size={18} />
             </span>
             Delete Account
            </button>
            <button
             type="button"
             onClick={handleLogout}
             className="flex w-full items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100/80"
            >
             <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <LogOut size={18} />
             </span>
             Sign Out
            </button>
           </div>
          </div>
         )}
        </div>
       </div>
      </div>
     </header>

     <main className="scrollbar-none flex-1 overflow-y-auto px-4 pb-5 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1440px]">{children}</div>
     </main>
    </div>
   </div>

   {showProfileModal && (
    <div
     className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/35 p-3 backdrop-blur-md sm:p-4"
     onClick={() => setShowProfileModal(false)}
    >
     <div className="mx-auto flex min-h-full w-full items-center justify-center">
      <div
       className="mesh-card scrollbar-none w-full max-w-3xl overflow-y-auto rounded-[30px] p-5 shadow-[0_36px_120px_rgba(15,23,42,0.24)] sm:max-h-[calc(100svh-2rem)] sm:p-6"
       onClick={(event) => event.stopPropagation()}
      >
       <div className="flex items-start justify-between gap-4">
        <div>
         <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-600">
          Account Studio
         </p>
         <h3 className="mt-2 text-xl font-black text-slate-900 sm:text-[1.7rem]">
          Update profile
         </h3>
         <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Fine-tune the anonymous name and profile details reused across forums,
          feedback, and applications.
         </p>
        </div>
        <button
         type="button"
         onClick={() => setShowProfileModal(false)}
         className="rounded-full border border-white/70 bg-white/80 p-2 text-slate-500 transition hover:bg-white hover:text-slate-700"
        >
         <X size={18} />
        </button>
       </div>

       <div className="mt-6 space-y-4">
        <form
         onSubmit={handleSaveProfile}
         className="glass-panel-strong rounded-[28px] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-5"
        >
         <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
            Public Profile
           </p>
           <h4 className="mt-2 text-lg font-black text-slate-900">
            Identity used across campus spaces
           </h4>
          </div>
          <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
           Anonymous facing
          </span>
         </div>

         <div className="mt-5 space-y-4">
          <ProfileField
           label="Anonymous Username"
           name="anonymousUsername"
           onChange={handleProfileInputChange}
           placeholder="e.g. silent_coder"
           required
           value={profileForm.anonymousUsername}
          />

          <ProfileField
           label={role === "student" ? "Branch" : "Branch / Department"}
           name="branch"
           onChange={handleProfileInputChange}
           placeholder={role === "student" ? "e.g. CSE" : "e.g. Electrical Engineering"}
           value={profileForm.branch}
          />

          {role === "student" && (
           <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
             <ProfileField
              label="Current CPI"
              name="cpi"
              onChange={handleProfileInputChange}
              placeholder="e.g. 8.4"
              step="0.01"
              type="number"
              value={profileForm.cpi}
             />
             <ProfileField
              label="Roll Number"
              name="rollNumber"
              onChange={handleProfileInputChange}
              placeholder="e.g. 230095"
              value={profileForm.rollNumber}
             />
            </div>

            <ProfileField
             label="Resume Link"
             name="resume"
             onChange={handleProfileInputChange}
             placeholder="https://..."
             type="url"
             value={profileForm.resume}
            />
           </>
          )}
         </div>

         <div className="mt-5 flex flex-col gap-3 border-t border-white/70 pt-4 sm:flex-row">
          <button
           type="button"
           onClick={() => setShowProfileModal(false)}
           className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
          >
           Cancel
          </button>
          <button
           type="submit"
           disabled={isSavingProfile}
           className="flex-1 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
           {isSavingProfile ? "Saving..." : "Save Profile"}
          </button>
         </div>
        </form>

        <section className="glass-panel rounded-[28px] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-5">
         <button
          type="button"
          onClick={() => setShowPasswordPanel((current) => !current)}
          className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-white/70 bg-white/70 px-4 py-4 text-left transition hover:bg-white/85"
         >
          <div className="flex min-w-0 items-center gap-3">
           <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] bg-slate-950 text-sky-200">
            <ShieldCheck size={18} />
           </div>
           <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
             Security
            </p>
            <h4 className="mt-1 text-base font-black text-slate-900">
             Change password
            </h4>
            <p className="mt-1 text-sm leading-6 text-slate-500">
             Hidden by default so the profile edit stays clean.
            </p>
           </div>
          </div>
          <ChevronDown
           size={18}
           className={`shrink-0 text-slate-400 transition ${showPasswordPanel ? "rotate-180" : ""}`}
          />
         </button>

         {showPasswordPanel && (
          <form onSubmit={handleChangePassword} className="mt-4 border-t border-white/70 pt-4">
           <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PASSWORD_RULES.map((rule) => (
             <PasswordRequirementChip
              key={rule.label}
              active={rule.test(passwordForm.newPassword)}
              label={rule.label}
             />
            ))}
           </div>

           <div className="mt-4 space-y-4">
            <ProfileField
             autoComplete="current-password"
             label="Current Password"
             name="currentPassword"
             onChange={handlePasswordInputChange}
             placeholder="Enter current password"
             required
             type="password"
             value={passwordForm.currentPassword}
            />
            <ProfileField
             autoComplete="new-password"
             label="New Password"
             name="newPassword"
             onChange={handlePasswordInputChange}
             placeholder="Create a new secure password"
             required
             type="password"
             value={passwordForm.newPassword}
            />
            <ProfileField
             autoComplete="new-password"
             label="Confirm Password"
             name="confirmPassword"
             onChange={handlePasswordInputChange}
             placeholder="Repeat new password"
             required
             type="password"
             value={passwordForm.confirmPassword}
            />
           </div>

           <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-500">
             Use a stronger password with mixed characters.
            </p>
            <button
             type="submit"
             disabled={isChangingPassword}
             className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
             {isChangingPassword ? "Changing..." : "Save Password"}
            </button>
           </div>
          </form>
         )}
        </section>
       </div>
      </div>
     </div>
    </div>
   )}

   {showDeleteModal && (
    <div
     className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md"
     onClick={() => setShowDeleteModal(false)}
    >
     <div
      className="glass-panel-strong w-full max-w-md rounded-[30px] p-7 shadow-[0_32px_100px_rgba(15,23,42,0.24)]"
      onClick={(event) => event.stopPropagation()}
     >
      <h3 className="text-2xl font-black text-slate-900">Delete your account?</h3>
      <p className="mt-3 text-sm leading-7 text-slate-500">
       This permanently removes your account and related activity. This action
       cannot be undone.
      </p>

      <div className="mt-8 flex gap-3">
       <button
        type="button"
        onClick={() => setShowDeleteModal(false)}
        className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
       >
        Cancel
       </button>
       <button
        type="button"
        onClick={handleDeleteAccount}
        disabled={isDeletingAccount}
        className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
       >
        {isDeletingAccount ? "Deleting..." : "Delete"}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}

function ProfileField({
 autoComplete,
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
    autoComplete={autoComplete}
    step={step}
    required={required}
    placeholder={placeholder}
    className="glass-input w-full rounded-2xl px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
   />
  </div>
 );
}

function PasswordRequirementChip({ active, label }) {
 return (
  <div
    className={`rounded-2xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
     active
     ? "border-emerald-300/60 bg-emerald-50 text-emerald-700"
     : "border-slate-200/80 bg-white/70 text-slate-500"
    }`}
  >
   {label}
  </div>
 );
}

export default DashboardLayout;
