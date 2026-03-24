import axios from "axios";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
 GraduationCap,
 Mail,
 Lock,
 ArrowRight,
 User,
 BookOpen,
 X,
 KeyRound,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

function Login() {
 const navigate = useNavigate();

 // ======================
 // LOGIN STATES
 // ======================
 const [role, setRole] = useState("student");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);

 // ======================
 // FORGOT PASSWORD STATES
 // ======================
 const [showForgotModal, setShowForgotModal] = useState(false);
 const [forgotStep, setForgotStep] = useState(1); // 1 = Email, 2 = OTP & New Password
 const [resetEmail, setResetEmail] = useState("");
 const [resetOtp, setResetOtp] = useState(new Array(6).fill(""));
 const [newPassword, setNewPassword] = useState("");
 const [resetTimer, setResetTimer] = useState(120);

 // ======================
 // OTP TIMER EFFECT
 // ======================
 useEffect(() => {
  let interval;
  if (showForgotModal && forgotStep === 2 && resetTimer > 0) {
   interval = setInterval(() => setResetTimer((prev) => prev - 1), 1000);
  } else if (resetTimer === 0) {
   clearInterval(interval);
  }
  return () => clearInterval(interval);
 }, [showForgotModal, forgotStep, resetTimer]);

 const handleForgotOtpChange = (element, index) => {
  if (isNaN(element.value)) return false;
  setResetOtp([
   ...resetOtp.map((d, idx) => (idx === index ? element.value : d)),
  ]);
  if (element.nextSibling && element.value !== "") {
   element.nextSibling.focus();
  }
 };

 const formatResetTime = () => {
  const m = Math.floor(resetTimer / 60);
  const s = resetTimer % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
 };

 // ======================
 // HANDLERS
 // ======================
 const handleLogin = async (e) => {
  e.preventDefault();

  if (!email || !password) {
   toast.error("Please enter email and password");
   return;
  }

  const toastId = toast.loading("Logging in...");

  try {
   const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/auth/login`,
    {
     email,
     password,
    },
   );

   localStorage.setItem("token", res.data.token);
   //console.log("Login successful, received token:", res.data.token);
   localStorage.setItem("user", JSON.stringify(res.data.user));
   const user = JSON.parse(localStorage.getItem("user"));
   console.log("Stored user in localStorage:", user.id, user.email, user.role);
   toast.success("Login successful! Redirecting...", { id: toastId });
   //save role in local storage
   localStorage.setItem("role", res.data.user.role);

   if (res.data.user.role === "student") {
    navigate("/student-dashboard");
   } else {
    navigate("/professor-dashboard");
   }
  } catch (err) {
   toast.error(err.response?.data?.message || "Login failed", { id: toastId });
  }
 };

 const handleSendResetOtp = async (e) => {
  e.preventDefault();
  if (!resetEmail) return toast.error("Please enter your email");

  const toastId = toast.loading("Sending OTP...");
  try {
   await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-reset-otp`, {
    email: resetEmail,
   });
   toast.success("OTP sent to your email!", { id: toastId });
   setForgotStep(2);
   setResetTimer(120);
  } catch (err) {
   toast.error(err.response?.data?.message || "Error sending OTP", {
    id: toastId,
   });
  }
 };

 const handleResetPassword = async (e) => {
  e.preventDefault();
  const enteredOtp = resetOtp.join("");
  if (enteredOtp.length !== 6)
   return toast.error("Please enter the full 6-digit OTP");
  if (newPassword.length < 6)
   return toast.error("Password must be at least 6 characters");

  const toastId = toast.loading("Resetting password...");
  try {
   await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
    email: resetEmail,
    otp: enteredOtp,
    newPassword: newPassword,
   });

   toast.success("Password reset successfully! You can now log in.", {
    id: toastId,
   });

   // Cleanup & Close Modal
   setShowForgotModal(false);
   setForgotStep(1);
   setResetEmail("");
   setResetOtp(new Array(6).fill(""));
   setNewPassword("");
  } catch (err) {
   toast.error(err.response?.data?.message || "Failed to reset password", {
    id: toastId,
   });
  }
 };

 const calculateStrength = (pass) => {
  let score = 0;
  if (pass.length > 5) score += 1;
  if (pass.length > 8) score += 1;
  if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
  return score;
 };

 const strengthScore = calculateStrength(password);

 return (
  <div className="min-h-screen flex bg-white font-sans relative">
   {/* --- FANCY GLASSMORPHISM TOAST ALERTS --- */}
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
      style: { background: "rgba(16, 185, 129, 0.85)" },
      iconTheme: { primary: "#fff", secondary: "#10b981" },
     },
     error: {
      style: { background: "rgba(239, 68, 68, 0.85)" },
      iconTheme: { primary: "#fff", secondary: "#ef4444" },
     },
    }}
   />

   {/* LEFT COLUMN - BRANDING */}
   <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
     <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600 blur-3xl"></div>
     <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-blue-600 blur-3xl"></div>
    </div>

    <div className="relative z-10 flex flex-col justify-between p-16 w-full h-full">
     <div className="flex items-center gap-3">
      <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
       <GraduationCap size={32} strokeWidth={2.5} />
      </div>
      <span className="text-3xl font-black text-white tracking-tight">
       Campus<span className="text-indigo-400">Connect</span>
      </span>
     </div>

     <div className="space-y-6 max-w-lg mt-20">
      <h1 className="text-5xl font-extrabold text-white leading-tight">
       Empowering the <span className="text-indigo-400">academic</span>{" "}
       community.
      </h1>
      <p className="text-lg text-slate-400 leading-relaxed font-medium">
       Join thousands of students and professors collaborating on cutting-edge
       projects, discussing coursework, and shaping the future of education.
      </p>
     </div>

     <div className="flex items-center gap-4 mt-auto pt-10">
      <div className="flex -space-x-4">
       <img
        className="w-12 h-12 rounded-full border-4 border-slate-900"
        src="https://ui-avatars.com/api/?name=Alex&background=4f46e5&color=fff"
        alt="User"
       />
       <img
        className="w-12 h-12 rounded-full border-4 border-slate-900"
        src="https://ui-avatars.com/api/?name=Sarah&background=10b981&color=fff"
        alt="User"
       />
       <img
        className="w-12 h-12 rounded-full border-4 border-slate-900"
        src="https://ui-avatars.com/api/?name=David&background=f59e0b&color=fff"
        alt="User"
       />
      </div>
      <div className="text-sm font-bold text-slate-300">
       Join <span className="text-white">5,000+</span> active members
      </div>
     </div>
    </div>
   </div>

   {/* RIGHT COLUMN - LOGIN FORM */}
   <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-slate-50 relative">
    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
     <div className="text-center lg:text-left">
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
       Welcome back
      </h2>
      <p className="text-slate-500 mt-2 font-medium">
       Please enter your details to sign in.
      </p>
     </div>

     {/* ROLE SELECTOR */}
     <div className="bg-slate-200/50 p-1 rounded-xl flex">
      <button
       type="button"
       onClick={() => setRole("Student")}
       className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${
        role === "Student"
         ? "bg-white text-indigo-600 shadow-sm"
         : "text-slate-500 hover:text-slate-700"
       }`}
      >
       <User size={18} /> Student
      </button>
      <button
       type="button"
       onClick={() => setRole("Professor")}
       className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${
        role === "Professor"
         ? "bg-white text-indigo-600 shadow-sm"
         : "text-slate-500 hover:text-slate-700"
       }`}
      >
       <BookOpen size={18} /> Professor
      </button>
     </div>

     {/* MAIN LOGIN FORM */}
     <form onSubmit={handleLogin} className="space-y-6">
      <div>
       <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
        Email Address
       </label>
       <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
         <Mail size={18} />
        </div>
        <input
         type="email"
         required
         value={email}
         onChange={(e) => setEmail(e.target.value)}
         placeholder="username@iitk.ac.in"
         className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium text-slate-700"
        />
       </div>
      </div>

      <div>
       <div className="flex justify-between items-center mb-2">
        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
         Password
        </label>
        <button
         type="button"
         onClick={() => {
          setShowForgotModal(true);
          setForgotStep(1);
          setResetEmail(email); // Autofill email if they typed it
         }}
         className="text-sm font-bold text-indigo-600 hover:text-indigo-500 focus:outline-none"
        >
         Forgot password?
        </button>
       </div>

       <div className="relative group overflow-hidden rounded-xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
         <Lock size={18} />
        </div>

        <input
         type={showPassword ? "text" : "password"}
         required
         value={password}
         onChange={(e) => setPassword(e.target.value)}
         placeholder="Hide it from your roommate !!"
         className="w-full pl-11 pr-12 py-3.5 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium text-slate-700 pb-4"
        />

        <button
         type="button"
         onClick={() => setShowPassword(!showPassword)}
         className="absolute inset-y-0 right-0 pr-3 flex items-center text-2xl hover:scale-110 transition-transform focus:outline-none pb-1"
         title={showPassword ? "Hide password" : "Show password"}
        >
         {showPassword ? "🐵" : "🙈"}
        </button>

        {/* STRENGTH BAR */}
        {password.length > 0 && (
         <div className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full rounded-b-xl flex">
          <div
           className={`h-full transition-all duration-300 ${
            strengthScore === 0
             ? "w-1/3 bg-red-500"
             : strengthScore === 1
               ? "w-1/3 bg-red-500"
               : strengthScore === 2
                 ? "w-2/3 bg-yellow-500"
                 : "w-full bg-green-500"
           }`}
          ></div>
         </div>
        )}
       </div>
      </div>

      <button
       type="submit"
       className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group mt-2"
      >
       Sign In to Dashboard
       <ArrowRight
        size={18}
        className="group-hover:translate-x-1 transition-transform"
       />
      </button>
     </form>

     <p className="text-center text-slate-500 font-medium">
      Don't have an account?{" "}
      <Link to="/signup" className="text-indigo-600 font-bold hover:underline">
       Sign up for free
      </Link>
     </p>
    </div>
   </div>

   {/* ========================================= */}
   {/* FORGOT PASSWORD MODAL */}
   {/* ========================================= */}
   {showForgotModal && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
     <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
      <button
       onClick={() => setShowForgotModal(false)}
       className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors"
      >
       <X size={20} />
      </button>

      {forgotStep === 1 ? (
       // STEP 1: ENTER EMAIL
       <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center mb-8">
         <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
          <KeyRound size={32} />
         </div>
         <h3 className="text-2xl font-black text-slate-900">Reset Password</h3>
         <p className="text-slate-500 font-medium mt-2">
          Enter your email and we'll send you a verification code.
         </p>
        </div>

        <form onSubmit={handleSendResetOtp}>
         <div className="mb-6">
          <div className="relative">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Mail size={18} />
           </div>
           <input
            type="email"
            required
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium text-slate-700"
           />
          </div>
         </div>
         <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200"
         >
          Send Reset Link
         </button>
        </form>
       </div>
      ) : (
       // STEP 2: ENTER OTP & NEW PASSWORD
       <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center mb-8">
         <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
          <Mail size={32} />
         </div>
         <h3 className="text-2xl font-black text-slate-900">
          Check your email
         </h3>
         <p className="text-slate-500 font-medium mt-2">
          Enter the 6-digit code sent to <br />
          <span className="text-slate-900 font-bold">{resetEmail}</span>
         </p>
        </div>

        <form onSubmit={handleResetPassword}>
         {/* OTP INPUTS */}
         <div className="flex justify-center gap-2 mb-6">
          {resetOtp.map((data, index) => (
           <input
            key={index}
            type="text"
            maxLength="1"
            value={data}
            onChange={(e) => handleForgotOtpChange(e.target, index)}
            onFocus={(e) => e.target.select()}
            className="w-12 h-14 text-center text-2xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
           />
          ))}
         </div>

         {/* NEW PASSWORD INPUT */}
         <div className="mb-8">
          <div className="relative group overflow-hidden rounded-xl">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Lock size={18} />
           </div>
           <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium text-slate-700"
           />
          </div>
         </div>

         <button
          type="submit"
          disabled={resetOtp.join("").length !== 6 || newPassword.length < 6}
          className="w-full bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:bg-slate-800"
         >
          Set New Password
         </button>
        </form>

        <div className="mt-6 text-center">
         <p className="text-sm font-bold text-slate-500 mb-2">
          Time remaining:{" "}
          <span className="text-indigo-600 font-black">
           {formatResetTime()}
          </span>
         </p>
         <button
          type="button"
          onClick={handleSendResetOtp}
          disabled={resetTimer > 0}
          className={`text-sm font-bold transition-colors ${resetTimer > 0 ? "text-slate-400 cursor-not-allowed" : "text-indigo-600 hover:text-indigo-800 underline"}`}
         >
          Didn't receive code? Resend
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
