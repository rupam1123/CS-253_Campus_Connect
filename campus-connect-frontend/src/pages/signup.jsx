import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
 GraduationCap,
 Mail,
 Lock,
 ArrowRight,
 User,
 BookOpen,
 UserCircle,
 X,
} from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
function Signup() {
 const navigate = useNavigate();

 // Form State
 const [role, setRole] = useState("Student");
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const [error, setError] = useState("");

 // OTP Modal & Timer State
 const [showOtpPopup, setShowOtpPopup] = useState(false);
 const [otp, setOtp] = useState(new Array(6).fill(""));
 const [timer, setTimer] = useState(120); // 2 minutes in seconds

 const handleVerify = async (e) => {
  e.preventDefault();
  setError("");

  if (password !== confirmPassword) {
   toast.error("Passwords do not match!");
   return;
  }

  try {
   // ======================
   // CALL BACKEND SEND OTP
   // ======================
   await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
    email,
   });

   setShowOtpPopup(true);
   setTimer(120);
   toast.success("OTP sent to your email!");
  } catch (err) {
   toast.error(err.response?.data?.message || "Error sending OTP");
  }
 };

 const handleCreateAccount = async (e) => {
  e.preventDefault();

  const enteredOtp = otp.join("");

  try {
   // ======================
   // VERIFY OTP + SIGNUP
   // ======================
   await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
    name,
    email,
    password,
    role,
    otp: enteredOtp,
   });

   toast.success("Account created successfully!");
   navigate("/");
  } catch (err) {
   toast.error(err.response?.data?.message || "Signup failed");
  }
 };

 useEffect(() => {
  let interval;
  if (showOtpPopup && timer > 0) {
   interval = setInterval(() => {
    setTimer((prev) => prev - 1);
   }, 1000);
  } else if (timer === 0) {
   clearInterval(interval);
  }
  return () => clearInterval(interval);
 }, [showOtpPopup, timer]);

 const handleOtpChange = (element, index) => {
  if (isNaN(element.value)) return false;

  setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

  if (element.nextSibling && element.value !== "") {
   element.nextSibling.focus();
  }
 };

 const formatTime = () => {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
 };

 const handleResendOtp = () => {
  setTimer(120);
  setOtp(new Array(6).fill(""));
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
  // CHANGED: h-screen and overflow-hidden prevent the whole page from scrolling
  <div className="h-screen w-full flex bg-white font-sans overflow-hidden">
   <Toaster
    position="top-right"
    reverseOrder={false}
    toastOptions={{
     // Base styles applied to all toasts
     style: {
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)", // For Safari support
      color: "#fff",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      fontWeight: "bold",
      padding: "16px 24px",
     },
     // Specific styling for POSITIVE alerts
     success: {
      style: {
       background: "rgba(16, 185, 129, 0.85)", // Vibrant Emerald Green with 85% opacity
      },
      iconTheme: {
       primary: "#fff",
       secondary: "#10b981",
      },
     },
     // Specific styling for NEGATIVE alerts
     error: {
      style: {
       background: "rgba(239, 68, 68, 0.85)", // Vibrant Red with 85% opacity
      },
      iconTheme: {
       primary: "#fff",
       secondary: "#ef4444",
      },
     },
    }}
   />
   {/* LEFT COLUMN - FIXED */}
   {/* CHANGED: Added h-full to lock its height to the screen */}
   <div className="hidden lg:flex lg:w-1/2 h-full relative bg-slate-900 overflow-hidden">
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
       Start your <span className="text-indigo-400">academic</span> journey.
      </h1>
      <p className="text-lg text-slate-400 leading-relaxed font-medium">
       Create your free account today. Join thousands of students and professors
       collaborating on cutting-edge projects and shaping the future of
       education.
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

   {/* RIGHT COLUMN - SCROLLABLE */}
   {/* CHANGED: h-full and overflow-y-auto handles scrolling only for this side */}
   <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-slate-50 relative flex flex-col">
    {/* We use a wrapper inner div with py-12 and my-auto to ensure it centers nicely but can still scroll padding */}
    <div className="w-full max-w-md mx-auto my-auto px-8 sm:px-12 py-12 lg:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
     {/* Mobile Logo */}
     <div className="lg:hidden flex items-center gap-3 mb-12">
      <div className="p-2 bg-indigo-600 rounded-lg text-white">
       <GraduationCap size={24} strokeWidth={2.5} />
      </div>
      <span className="text-2xl font-black text-slate-900 tracking-tight">
       Campus<span className="text-indigo-600">Connect</span>
      </span>
     </div>

     <div className="text-center lg:text-left mb-8">
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
       Create an account
      </h2>
      <p className="text-slate-500 mt-2 font-medium">
       Set up your profile to get started.
      </p>
     </div>

     {error && (
      <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm font-bold text-center mb-6">
       {error}
      </div>
     )}

     {/* ROLE SELECTOR */}
     <div className="bg-slate-200/50 p-1 rounded-xl flex mb-8">
      <button
       type="button"
       onClick={() => setRole("Student")}
       className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${role === "Student" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
      >
       <User size={18} /> Student
      </button>
      <button
       type="button"
       onClick={() => setRole("Professor")}
       className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${role === "Professor" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
      >
       <BookOpen size={18} /> Professor
      </button>
     </div>

     {/* FORM */}
     <form onSubmit={handleVerify} className="space-y-5">
      {/* NAME INPUT */}
      <div>
       <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
        Full Name
       </label>
       <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
         <UserCircle size={18} />
        </div>
        <input
         type="text"
         required
         value={name}
         onChange={(e) => setName(e.target.value)}
         placeholder="e.g. Arjun Mehta"
         className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium text-slate-700"
        />
       </div>
      </div>

      {/* EMAIL INPUT */}
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

      {/* PASSWORD INPUT */}
      <div>
       <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
        Password
       </label>
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

        {password.length > 0 && (
         <div className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full rounded-b-xl flex">
          <div
           className={`h-full transition-all duration-300 ${strengthScore === 0 ? "w-1/3 bg-red-500" : strengthScore === 1 ? "w-1/3 bg-red-500" : strengthScore === 2 ? "w-2/3 bg-yellow-500" : "w-full bg-green-500"}`}
          ></div>
         </div>
        )}
       </div>
       <p className="text-[10px] text-slate-400 mt-2 font-medium">
        Must be at least 8 characters with 1 uppercase letter and 1 number.
       </p>
      </div>

      {/* CONFIRM PASSWORD INPUT */}
      <div>
       <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
        Confirm Password
       </label>
       <div className="relative group overflow-hidden rounded-xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
         <Lock size={18} />
        </div>
        <input
         type={showConfirmPassword ? "text" : "password"}
         required
         value={confirmPassword}
         onChange={(e) => setConfirmPassword(e.target.value)}
         placeholder="Hide it from your roommate !!"
         className="w-full pl-11 pr-12 py-3.5 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium text-slate-700"
        />

        <button
         type="button"
         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
         className="absolute inset-y-0 right-0 pr-3 flex items-center text-2xl hover:scale-110 transition-transform focus:outline-none"
         title={showConfirmPassword ? "Hide password" : "Show password"}
        >
         {showConfirmPassword ? "🐵" : "🙈"}
        </button>
       </div>
       <p className="text-[10px] text-slate-400 mt-2 font-medium">
        Password must match the one above.
       </p>
      </div>

      <button
       type="submit"
       className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group mt-6"
      >
       Verify Account
       <ArrowRight
        size={18}
        className="group-hover:translate-x-1 transition-transform"
       />
      </button>
     </form>

     <p className="text-center text-slate-500 font-medium mt-8">
      Already have an account?{" "}
      <Link to="/" className="text-indigo-600 font-bold hover:underline">
       Sign in
      </Link>
     </p>
    </div>
   </div>

   {/* OTP POPUP OVERLAY */}
   {showOtpPopup && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
     <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
      <button
       onClick={() => setShowOtpPopup(false)}
       className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors"
      >
       <X size={20} />
      </button>

      <div className="text-center mb-8">
       <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
        <Mail size={32} />
       </div>
       <h3 className="text-2xl font-black text-slate-900">Check your email</h3>
       <p className="text-slate-500 font-medium mt-2">
        We've sent a 6-digit code to <br />
        <span className="text-slate-900 font-bold">{email}</span>
       </p>
      </div>

      <form onSubmit={handleCreateAccount}>
       <div className="flex justify-center gap-2 mb-8">
        {otp.map((data, index) => (
         <input
          key={index}
          type="text"
          maxLength="1"
          value={data}
          onChange={(e) => handleOtpChange(e.target, index)}
          onFocus={(e) => e.target.select()}
          className="w-12 h-14 text-center text-2xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
         />
        ))}
       </div>

       <button
        type="submit"
        disabled={otp.join("").length !== 6}
        className="w-full bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-red text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
       >
        Create Account
       </button>
      </form>

      <div className="mt-8 text-center flex flex-col items-center gap-2">
       <p className="text-sm font-bold text-slate-500">
        Time remaining:{" "}
        <span className="text-indigo-600 font-black">{formatTime()}</span>
       </p>

       <button
        type="button"
        onClick={handleResendOtp}
        disabled={timer > 0}
        className={`text-sm font-bold transition-colors ${timer > 0 ? "text-slate-400 cursor-not-allowed" : "text-indigo-600 hover:text-indigo-800 underline"}`}
       >
        Didn't receive the code? Resend
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}

export default Signup;
