import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
 ArrowRight,
 BookOpen,
 Eye,
 EyeOff,
 GraduationCap,
 KeyRound,
 Lock,
 Mail,
 User,
 X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { fetchJson, getErrorMessage } from "../lib/api.js";
import {
 clearSession,
 getDefaultDashboardPath,
 persistSession,
} from "../lib/session.js";

const EMPTY_OTP = new Array(6).fill("");

function Login() {
 const navigate = useNavigate();
 const [role, setRole] = useState("student");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);

 const [showForgotModal, setShowForgotModal] = useState(false);
 const [forgotStep, setForgotStep] = useState(1);
 const [resetEmail, setResetEmail] = useState("");
 const [resetOtp, setResetOtp] = useState(EMPTY_OTP);
 const [newPassword, setNewPassword] = useState("");
 const [resetTimer, setResetTimer] = useState(120);
 const [isSendingOtp, setIsSendingOtp] = useState(false);
 const [isResettingPassword, setIsResettingPassword] = useState(false);

 useEffect(() => {
  if (!showForgotModal || forgotStep !== 2 || resetTimer <= 0) {
   return undefined;
  }

  const interval = window.setInterval(() => {
   setResetTimer((current) => (current > 0 ? current - 1 : 0));
  }, 1000);

  return () => window.clearInterval(interval);
 }, [forgotStep, resetTimer, showForgotModal]);

 const handleForgotModalClose = () => {
  setShowForgotModal(false);
  setForgotStep(1);
  setResetOtp(EMPTY_OTP);
  setNewPassword("");
  setResetTimer(120);
 };

 const handleForgotOtpChange = (element, index) => {
  if (!/^\d?$/.test(element.value)) {
   return;
  }

  setResetOtp((current) =>
   current.map((digit, currentIndex) =>
    currentIndex === index ? element.value : digit,
   ),
  );

  if (element.value && element.nextSibling instanceof HTMLInputElement) {
   element.nextSibling.focus();
  }
 };

 const formatResetTime = () => {
  const minutes = Math.floor(resetTimer / 60);
  const seconds = resetTimer % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
 };

 const calculateStrength = (pass) => {
  let score = 0;

  if (pass.length >= 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;

  return score;
 };

 const strengthScore = calculateStrength(password);

 const handleLogin = async (event) => {
  event.preventDefault();

  if (!email || !password) {
   toast.error("Please enter both your email and password.");
   return;
  }

  setIsSubmitting(true);
  const toastId = toast.loading("Signing you in...");

  try {
   const data = await fetchJson("/api/auth/login", {
    method: "POST",
    body: { email, password },
   });
   const actualRole = (data?.user?.role || "").toLowerCase();

   if (actualRole && actualRole !== role) {
    toast.error(
     `This account is registered as a ${actualRole}. Switch the role tab and try again.`,
     { id: toastId },
    );
    return;
   }

   clearSession();
   persistSession({ token: data.token, user: data.user });
   toast.success("Login successful. Redirecting...", { id: toastId });
   navigate(getDefaultDashboardPath(actualRole), { replace: true });
  } catch (error) {
   toast.error(getErrorMessage(error, "Login failed."), { id: toastId });
  } finally {
   setIsSubmitting(false);
  }
 };

 const handleSendResetOtp = async (event) => {
  event.preventDefault();

  if (!resetEmail) {
   toast.error("Please enter the email linked to your account.");
   return;
  }

  setIsSendingOtp(true);
  const toastId = toast.loading("Sending your verification code...");

  try {
   await fetchJson("/api/auth/send-reset-otp", {
    method: "POST",
    body: { email: resetEmail },
   });
   setForgotStep(2);
   setResetOtp(EMPTY_OTP);
   setResetTimer(120);
   toast.success("A reset OTP has been sent to your inbox.", { id: toastId });
  } catch (error) {
   toast.error(getErrorMessage(error, "Unable to send OTP."), {
    id: toastId,
   });
  } finally {
   setIsSendingOtp(false);
  }
 };

 const handleResetPassword = async (event) => {
  event.preventDefault();

  const enteredOtp = resetOtp.join("");

  if (enteredOtp.length !== 6) {
   toast.error("Please enter the full 6-digit OTP.");
   return;
  }

  if (calculateStrength(newPassword) < 3) {
   toast.error(
    "Use at least 8 characters, one uppercase letter, and one number.",
   );
   return;
  }

  setIsResettingPassword(true);
  const toastId = toast.loading("Resetting your password...");

  try {
   await fetchJson("/api/auth/reset-password", {
    method: "POST",
    body: {
     email: resetEmail,
     otp: enteredOtp,
     newPassword,
    },
   });

   toast.success("Password updated. You can sign in now.", { id: toastId });
   handleForgotModalClose();
  } catch (error) {
   toast.error(getErrorMessage(error, "Unable to reset password."), {
    id: toastId,
   });
  } finally {
   setIsResettingPassword(false);
  }
 };

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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.35),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.28),_transparent_34%)]" />

      <div className="relative flex items-center gap-3">
       <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/30">
        <GraduationCap size={30} strokeWidth={2.5} />
       </div>
       <div>
        <p className="text-3xl font-black tracking-tight">CampusConnect</p>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
         Academic Collaboration
        </p>
       </div>
      </div>

      <div className="relative mt-24 max-w-xl space-y-8">
       <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100">
        <KeyRound size={14} />
        Secure Access
       </div>
       <h1 className="text-5xl font-black leading-tight">
        One portal for projects, feedback, and campus-wide discussion.
       </h1>
       <p className="text-lg leading-8 text-slate-300">
        CampusConnect keeps the student and professor workflow in sync with
        faster project discovery, cleaner course feedback, and a more reliable
        collaboration loop.
       </p>
      </div>

      <div className="relative mt-auto grid grid-cols-3 gap-4 pt-16">
       {[
        { label: "Live Projects", value: "120+" },
        { label: "Feedback Threads", value: "1.8K" },
        { label: "Campus Members", value: "5K+" },
       ].map((item) => (
        <div
         key={item.label}
         className="rounded-3xl border border-white/10 bg-white/8 px-5 py-4 backdrop-blur"
        >
         <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          {item.label}
         </p>
         <p className="mt-3 text-3xl font-black text-white">{item.value}</p>
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
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 text-white">
         <GraduationCap size={26} strokeWidth={2.5} />
        </div>
        <div>
         <p className="text-2xl font-black text-slate-900">CampusConnect</p>
         <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Academic Collaboration
         </p>
        </div>
       </div>
      </div>

      <div className="mt-8 space-y-2 lg:mt-0">
       <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">
        Welcome Back
       </p>
       <h2 className="text-4xl font-black tracking-tight text-slate-900">
        Sign in to your workspace
       </h2>
       <p className="text-base leading-7 text-slate-500">
        Choose your role, enter your credentials, and pick up right where you
        left off.
       </p>
      </div>

      <div className="mt-8 rounded-2xl bg-slate-100/80 p-1.5">
       <div className="grid grid-cols-2 gap-2">
        <button
         type="button"
         onClick={() => setRole("student")}
         className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
          role === "student"
           ? "bg-white text-sky-600 shadow-sm"
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
           ? "bg-white text-sky-600 shadow-sm"
           : "text-slate-500 hover:text-slate-700"
         }`}
        >
         <BookOpen size={18} />
         Professor
        </button>
       </div>
      </div>

      <form onSubmit={handleLogin} className="mt-8 space-y-6">
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
          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 pl-11 font-medium text-slate-700 outline-none transition focus:border-sky-500"
         />
        </div>
       </div>

       <div>
        <div className="mb-2 flex items-center justify-between gap-3">
         <label className="block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
          Password
         </label>
         <button
          type="button"
          onClick={() => {
           setShowForgotModal(true);
           setForgotStep(1);
           setResetEmail(email);
          }}
          className="text-sm font-bold text-sky-600 hover:text-sky-700"
         >
          Forgot password?
         </button>
        </div>

        <div className="relative overflow-hidden rounded-2xl">
         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <Lock size={18} />
         </div>
         <input
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 pb-5 pl-11 pr-12 font-medium text-slate-700 outline-none transition focus:border-sky-500"
         />
         <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 transition hover:text-sky-600"
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
       </div>

       <button
        type="submit"
        disabled={isSubmitting}
        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 text-base font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
       >
        {isSubmitting ? "Signing In..." : "Sign In to Dashboard"}
        <ArrowRight
         size={18}
         className="transition-transform group-hover:translate-x-1"
        />
       </button>
      </form>

      <p className="mt-8 text-center text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
         to="/signup"
         className="font-bold text-sky-600 transition hover:text-sky-700 hover:underline"
        >
         Create one now
        </Link>
      </p>
      </div>
     </div>
    </div>
   </div>

   {showForgotModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
     <div className="relative w-full max-w-md rounded-[28px] bg-white p-8 shadow-[0_32px_100px_rgba(15,23,42,0.24)]">
      <button
       type="button"
       onClick={handleForgotModalClose}
       className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
      >
       <X size={18} />
      </button>

      {forgotStep === 1 ? (
       <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="mb-8 text-center">
         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          <KeyRound size={30} />
         </div>
         <h3 className="mt-4 text-2xl font-black text-slate-900">
          Reset your password
         </h3>
         <p className="mt-2 text-slate-500">
          We&apos;ll send a one-time verification code to your email address.
         </p>
        </div>

        <form onSubmit={handleSendResetOtp} className="space-y-6">
         <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
           <Mail size={18} />
          </div>
          <input
           type="email"
           required
           value={resetEmail}
           onChange={(event) => setResetEmail(event.target.value)}
           placeholder="Enter your email"
           className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-4 pl-11 font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
          />
         </div>

         <button
          type="submit"
          disabled={isSendingOtp}
          className="w-full rounded-2xl bg-sky-600 px-4 py-4 font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
         >
          {isSendingOtp ? "Sending OTP..." : "Send Verification Code"}
         </button>
        </form>
       </div>
      ) : (
       <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="mb-8 text-center">
         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          <Mail size={30} />
         </div>
         <h3 className="mt-4 text-2xl font-black text-slate-900">
          Check your inbox
         </h3>
         <p className="mt-2 text-slate-500">
          Enter the 6-digit OTP sent to{" "}
          <span className="font-bold text-slate-900">{resetEmail}</span>.
         </p>
        </div>

        <form onSubmit={handleResetPassword}>
         <div className="mb-6 flex justify-center gap-2">
          {resetOtp.map((digit, index) => (
           <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={digit}
            onChange={(event) =>
             handleForgotOtpChange(event.target, index)
            }
            onFocus={(event) => event.target.select()}
            className="h-14 w-12 rounded-2xl border-2 border-slate-200 bg-slate-50 text-center text-2xl font-black text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
           />
          ))}
         </div>

         <div className="mb-8">
          <div className="relative">
           <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Lock size={18} />
           </div>
           <input
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Create a stronger password"
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-4 pl-11 font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
           />
          </div>
          <p className="mt-2 text-xs text-slate-400">
           Use at least 8 characters, one uppercase letter, and one number.
          </p>
         </div>

         <button
          type="submit"
          disabled={
           resetOtp.join("").length !== 6 || isResettingPassword
          }
          className="w-full rounded-2xl bg-slate-950 px-4 py-4 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
         >
          {isResettingPassword ? "Updating Password..." : "Set New Password"}
         </button>
        </form>

        <div className="mt-6 text-center">
         <p className="text-sm font-bold text-slate-500">
          Time remaining:{" "}
          <span className="text-sky-600">{formatResetTime()}</span>
         </p>
         <button
          type="button"
          onClick={handleSendResetOtp}
          disabled={resetTimer > 0 || isSendingOtp}
          className={`mt-2 text-sm font-bold transition ${
           resetTimer > 0
            ? "cursor-not-allowed text-slate-400"
            : "text-sky-600 hover:text-sky-700"
          }`}
         >
          Didn&apos;t receive the code? Resend OTP
         </button>
        </div>
       </div>
      )}
     </div>
    </div>
   )}
  </div>
 );
}

export default Login;
