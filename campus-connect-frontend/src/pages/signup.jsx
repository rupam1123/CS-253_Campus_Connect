import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
 ArrowRight,
 BookOpen,
 Eye,
 EyeOff,
 GraduationCap,
 Lock,
 Mail,
 User,
 UserCircle,
 X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { fetchJson, getErrorMessage } from "../lib/api.js";

const EMPTY_OTP = new Array(6).fill("");

function Signup() {
 const navigate = useNavigate();
 const [role, setRole] = useState("student");
 const [name, setName] = useState("");
 const [anonymousUsername, setAnonymousUsername] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const [showOtpPopup, setShowOtpPopup] = useState(false);
 const [otp, setOtp] = useState(EMPTY_OTP);
 const [timer, setTimer] = useState(120);
 const [isSendingOtp, setIsSendingOtp] = useState(false);
 const [isCreatingAccount, setIsCreatingAccount] = useState(false);

 useEffect(() => {
  if (!showOtpPopup || timer <= 0) {
   return undefined;
  }

  const interval = window.setInterval(() => {
   setTimer((current) => (current > 0 ? current - 1 : 0));
  }, 1000);

  return () => window.clearInterval(interval);
 }, [showOtpPopup, timer]);

 const calculateStrength = (pass) => {
  let score = 0;

  if (pass.length >= 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;

  return score;
 };

 const formatTime = () => {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
 };

 const handleOtpChange = (element, index) => {
  if (!/^\d?$/.test(element.value)) {
   return;
  }

  setOtp((current) =>
   current.map((digit, currentIndex) =>
    currentIndex === index ? element.value : digit,
   ),
  );

  if (element.value && element.nextSibling instanceof HTMLInputElement) {
   element.nextSibling.focus();
  }
 };

 const sendOtp = async () => {
  await fetchJson("/api/auth/send-otp", {
   method: "POST",
   body: { email },
  });
 };

 const handleVerify = async (event) => {
  event.preventDefault();

  if (!name.trim()) {
   toast.error("Please enter your full name.");
   return;
  }

  if (!anonymousUsername.trim()) {
   toast.error("Please choose an anonymous username.");
   return;
  }

  if (password !== confirmPassword) {
   toast.error("Passwords do not match.");
   return;
  }

  if (calculateStrength(password) < 3) {
   toast.error(
    "Use at least 8 characters, one uppercase letter, and one number.",
   );
   return;
  }

  setIsSendingOtp(true);
  const toastId = toast.loading("Sending your OTP...");

  try {
   await sendOtp();
   setShowOtpPopup(true);
   setOtp(EMPTY_OTP);
   setTimer(120);
   toast.success("OTP sent successfully. Check your inbox.", {
    id: toastId,
   });
  } catch (error) {
   toast.error(getErrorMessage(error, "Unable to send OTP."), {
    id: toastId,
   });
  } finally {
   setIsSendingOtp(false);
  }
 };

 const handleCreateAccount = async (event) => {
  event.preventDefault();

  const enteredOtp = otp.join("");

  if (enteredOtp.length !== 6) {
   toast.error("Please enter the complete 6-digit OTP.");
   return;
  }

  setIsCreatingAccount(true);
  const toastId = toast.loading("Creating your account...");

  try {
   await fetchJson("/api/auth/verify-otp", {
    method: "POST",
    body: {
     name: name.trim(),
     anonymousUsername: anonymousUsername.trim(),
     email: email.trim(),
     password,
     role,
     otp: enteredOtp,
    },
   });
   toast.success("Account created successfully. Please sign in.", {
    id: toastId,
   });
   navigate("/", { replace: true });
  } catch (error) {
   toast.error(getErrorMessage(error, "Signup failed."), { id: toastId });
  } finally {
   setIsCreatingAccount(false);
  }
 };

 const handleResendOtp = async () => {
  setIsSendingOtp(true);
  const toastId = toast.loading("Sending a fresh OTP...");

  try {
   await sendOtp();
   setTimer(120);
   setOtp(EMPTY_OTP);
   toast.success("A fresh OTP has been sent.", { id: toastId });
  } catch (error) {
   toast.error(getErrorMessage(error, "Unable to resend OTP."), {
    id: toastId,
   });
  } finally {
   setIsSendingOtp(false);
  }
 };

 const strengthScore = calculateStrength(password);

 return (
  <div className="h-screen overflow-hidden bg-app-shell">
   <Toaster
    position="top-right"
    reverseOrder={false}
    toastOptions={{
     style: {
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      color: "#fff",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      fontWeight: "bold",
      padding: "16px 24px",
     },
     success: {
      style: { background: "rgba(16, 185, 129, 0.88)" },
      iconTheme: { primary: "#fff", secondary: "#10b981" },
     },
     error: {
      style: { background: "rgba(239, 68, 68, 0.88)" },
      iconTheme: { primary: "#fff", secondary: "#ef4444" },
     },
    }}
   />

   <div className="mx-auto flex h-full max-w-[1600px] overflow-hidden">
    <div className="hidden w-1/2 p-6 lg:flex">
     <div className="relative flex w-full flex-col overflow-hidden rounded-[32px] bg-slate-950 px-12 py-14 text-white shadow-[0_32px_100px_rgba(15,23,42,0.28)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.35),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.24),_transparent_34%)]" />

      <div className="relative flex items-center gap-3">
       <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-amber-300 text-slate-950 shadow-lg shadow-sky-500/30">
        <GraduationCap size={30} strokeWidth={2.5} />
       </div>
       <div>
        <p className="text-3xl font-black tracking-tight">CampusConnect</p>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-100/80">
         Build Your Network
        </p>
       </div>
      </div>

      <div className="relative mt-24 max-w-xl space-y-8">
       <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-100">
        <ArrowRight size={14} />
        Fast Onboarding
       </div>
       <h1 className="text-5xl font-black leading-tight">
        Create your academic profile and start collaborating faster.
       </h1>
       <p className="text-lg leading-8 text-slate-300">
        Join the project pipeline, course discussion space, and feedback loop
        with a cleaner signup flow that verifies every account before it enters
        the system.
       </p>
      </div>

      <div className="relative mt-auto space-y-4 pt-16">
       {[
        "Verified signups with OTP-based onboarding",
        "Role-specific dashboards for students and professors",
        "A cleaner workspace for feedback, forums, and project applications",
       ].map((item) => (
        <div
         key={item}
         className="rounded-3xl border border-white/10 bg-white/8 px-5 py-4 text-sm font-semibold text-slate-200 backdrop-blur"
        >
         {item}
        </div>
       ))}
      </div>
     </div>
    </div>

    <div className="flex min-h-0 w-full items-center justify-center px-4 py-4 sm:px-6 lg:w-1/2 lg:px-10 lg:py-6">
     <div className="glass-panel flex max-h-[calc(100svh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-[32px] px-6 py-6 sm:px-10 sm:py-8">
      <div className="scrollbar-none min-h-0 overflow-y-auto pr-1">
      <div className="lg:hidden">
       <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-amber-400 text-white">
         <GraduationCap size={26} strokeWidth={2.5} />
        </div>
        <div>
         <p className="text-2xl font-black text-slate-900">CampusConnect</p>
         <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Build Your Network
         </p>
        </div>
       </div>
      </div>

      <div className="mt-8 space-y-2 lg:mt-0">
       <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-500">
        Create Account
       </p>
       <h2 className="text-4xl font-black tracking-tight text-slate-900">
        Start your CampusConnect profile
       </h2>
       <p className="text-base leading-7 text-slate-500">
        Set up a verified account once, then use the same workspace across
        projects, forums, and course feedback.
       </p>
      </div>

      <div className="mt-8 rounded-2xl bg-slate-100/80 p-1.5">
       <div className="grid grid-cols-2 gap-2">
        <button
         type="button"
         onClick={() => setRole("student")}
         className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
          role === "student"
           ? "bg-white text-amber-500 shadow-sm"
           : "text-slate-500 hover:text-slate-700"
         }`}
        >
         <User size={18} />
         Student
        </button>
        <button
         type="button"
         onClick={() => setRole("professor")}
         className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
          role === "professor"
           ? "bg-white text-amber-500 shadow-sm"
           : "text-slate-500 hover:text-slate-700"
         }`}
        >
         <BookOpen size={18} />
         Professor
        </button>
       </div>
      </div>

      <form onSubmit={handleVerify} className="mt-8 space-y-5">
       <div>
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
         Full Name
        </label>
        <div className="relative">
         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <UserCircle size={18} />
         </div>
         <input
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Arjun Mehta"
          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 pl-11 font-medium text-slate-700 outline-none transition focus:border-amber-400"
         />
        </div>
       </div>

       <div>
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
         Anonymous Username
        </label>
        <div className="relative">
         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <User size={18} />
         </div>
         <input
          type="text"
          required
          value={anonymousUsername}
          onChange={(event) => setAnonymousUsername(event.target.value)}
          placeholder="e.g. silent_coder"
          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 pl-11 font-medium text-slate-700 outline-none transition focus:border-amber-400"
         />
        </div>
        <p className="mt-2 text-xs text-slate-400">
         This name appears in forum and feedback discussions instead of a generic anonymous label.
        </p>
       </div>

       <div>
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
         Email Address
        </label>
        <div className="relative">
         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <Mail size={18} />
         </div>
         <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="username@iitk.ac.in"
          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 pl-11 font-medium text-slate-700 outline-none transition focus:border-amber-400"
         />
        </div>
       </div>

       <div>
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
         Password
        </label>
        <div className="relative overflow-hidden rounded-2xl">
         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <Lock size={18} />
         </div>
         <input
          type={showPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a secure password"
          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 pb-5 pl-11 pr-12 font-medium text-slate-700 outline-none transition focus:border-amber-400"
         />
         <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 transition hover:text-amber-500"
          title={showPassword ? "Hide password" : "Show password"}
         >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
         </button>

         {password.length > 0 && (
          <div className="absolute bottom-0 left-0 flex h-1 w-full rounded-b-2xl bg-slate-100">
           <div
            className={`h-full transition-all ${
             strengthScore <= 1
              ? "w-1/3 bg-rose-500"
              : strengthScore === 2
               ? "w-2/3 bg-amber-400"
               : "w-full bg-emerald-500"
            }`}
           />
          </div>
         )}
        </div>
        <p className="mt-2 text-xs text-slate-400">
         Use at least 8 characters, one uppercase letter, and one number.
        </p>
       </div>

       <div>
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
         Confirm Password
        </label>
        <div className="relative">
         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <Lock size={18} />
         </div>
         <input
          type={showConfirmPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Re-enter your password"
          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 pl-11 pr-12 font-medium text-slate-700 outline-none transition focus:border-amber-400"
         />
         <button
          type="button"
          onClick={() => setShowConfirmPassword((current) => !current)}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 transition hover:text-amber-500"
          title={showConfirmPassword ? "Hide password" : "Show password"}
         >
          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
         </button>
        </div>
       </div>

       <button
          type="submit"
          disabled={isSendingOtp}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 text-base font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-amber-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
       >
        {isSendingOtp ? "Sending OTP..." : "Verify Account"}
        <ArrowRight
         size={18}
         className="transition-transform group-hover:translate-x-1"
        />
       </button>
      </form>

      <p className="mt-8 text-center text-slate-500">
        Already have an account?{" "}
        <Link
         to="/"
         className="font-bold text-amber-500 transition hover:text-amber-600 hover:underline"
        >
         Sign in instead
        </Link>
      </p>
      </div>
     </div>
    </div>
   </div>

   {showOtpPopup && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
     <div className="relative w-full max-w-md rounded-[28px] bg-white p-8 shadow-[0_32px_100px_rgba(15,23,42,0.24)]">
      <button
       type="button"
       onClick={() => setShowOtpPopup(false)}
       className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
      >
       <X size={18} />
      </button>

      <div className="mb-8 text-center">
       <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-500">
        <Mail size={30} />
       </div>
       <h3 className="mt-4 text-2xl font-black text-slate-900">
        Enter your verification code
       </h3>
       <p className="mt-2 text-slate-500">
        We sent a 6-digit OTP to{" "}
        <span className="font-bold text-slate-900">{email}</span>.
       </p>
      </div>

      <form onSubmit={handleCreateAccount}>
       <div className="mb-8 flex justify-center gap-2">
        {otp.map((digit, index) => (
         <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength="1"
          value={digit}
          onChange={(event) => handleOtpChange(event.target, index)}
          onFocus={(event) => event.target.select()}
          className="h-14 w-12 rounded-2xl border-2 border-slate-200 bg-slate-50 text-center text-2xl font-black text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white"
         />
        ))}
       </div>

       <button
        type="submit"
        disabled={otp.join("").length !== 6 || isCreatingAccount}
        className="w-full rounded-2xl bg-slate-950 px-4 py-4 font-bold text-white transition hover:bg-amber-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
       >
        {isCreatingAccount ? "Creating Account..." : "Create Account"}
       </button>
      </form>

      <div className="mt-8 text-center">
       <p className="text-sm font-bold text-slate-500">
        Time remaining: <span className="text-amber-500">{formatTime()}</span>
       </p>
       <button
        type="button"
        onClick={handleResendOtp}
        disabled={timer > 0 || isSendingOtp}
        className={`mt-2 text-sm font-bold transition ${
         timer > 0 ? "cursor-not-allowed text-slate-400" : "text-amber-500 hover:text-amber-600"
        }`}
       >
        Didn&apos;t receive the code? Resend OTP
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}

export default Signup;
