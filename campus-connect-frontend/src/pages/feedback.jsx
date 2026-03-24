import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/dashboard_layout";
import {
 Star,
 Send,
 ArrowBigUp,
 ArrowBigDown,
 MessageSquare,
 ChevronLeft,
 Info,
 CheckCircle,
 AlertCircle,
 X,
 User, // <-- Add this
 Clock, // <-- Add this
 MessageCircle, // <-- Add this
 ChevronDown, // <-- Add this
 Check,
} from "lucide-react";

function Feedback() {
 // --- STATE VARIABLES ---
 const [courseCode, setCourseCode] = useState("");
 const [selected, setSelected] = useState(false);
 const [comment, setComment] = useState("");
 const [ratings, setRatings] = useState({});
 const [isDropdownOpen, setIsDropdownOpen] = useState(false);
 // Toast states
 const [toastMessage, setToastMessage] = useState(null);
 const [toastType, setToastType] = useState("success"); // 'success' or 'error'

 const [courseOptions, setCourseOptions] = useState([]);

 // Extract userId safely at the component level so all functions can use it
 const user = JSON.parse(localStorage.getItem("user") || "{}");
 const userId = user?.id || user?.user_id;

 // Mock data for the discussion feed

 const [feedbacks, setFeedbacks] = useState([]);
 // Fetch discussions when the user enters the portal
 useEffect(() => {
  if (selected && courseCode) {
   fetch(
    `http://localhost:5001/api/feedback/discussions/${encodeURIComponent(courseCode)}?userId=${userId}`,
   )
    .then((res) => res.json())
    .then((data) => {
     if (data.feedbacks) {
      setFeedbacks(data.feedbacks);
     }
    })
    .catch((err) => console.error("Failed to fetch discussions:", err));
  }
 }, [selected, courseCode, userId]); // Added userId to dependencies
 const parameters = [
  "Content Quality",
  "Teaching Delivery",
  "Clarity",
  "Engagement",
  "Lecture Pace",
 ];

 // FETCH COURSES
 useEffect(() => {
  if (userId) {
   // Restored the correct URL for fetching user courses
   fetch(`http://localhost:5001/api/courses/${userId}`)
    .then((res) => res.json())
    .then((data) => {
     if (data.courses) {
      setCourseOptions(data.courses);
     }
    })
    .catch((err) => console.error("Failed to fetch courses:", err));
  }
 }, [userId]);

 // Close dropdown when clicking outside
 useEffect(() => {
  const handleClickOutside = () => {
   if (isDropdownOpen) setIsDropdownOpen(false);
  };
  // We attach it to the window, but we only want it to fire if the menu is open
  if (isDropdownOpen) {
   window.addEventListener("click", handleClickOutside);
  }
  return () => window.removeEventListener("click", handleClickOutside);
 }, [isDropdownOpen]);
 // --- HANDLERS ---
 const handleRating = (param, value) => {
  setRatings({ ...ratings, [param]: value });
 };

 // --- NEW BACKEND INTEGRATION ---
 const submitFeedback = async (e) => {
  e.preventDefault();

  // 1. Frontend Validation: Ensure all 5 stars are clicked
  if (Object.keys(ratings).length < 5) {
   setToastType("error");
   setToastMessage("Please provide a star rating for all 5 parameters.");
   setTimeout(() => setToastMessage(null), 3000);
   return;
  }

  // 2. Prepare the payload to match backend exactly
  const payload = {
   userId: userId,
   courseName: courseCode,
   contentQuality: ratings["Content Quality"],
   teachingDelivery: ratings["Teaching Delivery"],
   clarity: ratings["Clarity"],
   engagement: ratings["Engagement"],
   lecturePace: ratings["Lecture Pace"],
   detailedFeedback: comment,
  };

  try {
   // 3. Send data to backend
   const response = await fetch("http://localhost:5001/api/feedback/submit", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
   });

   const data = await response.json();

   if (response.ok) {
    // SUCCESS (201)
    setToastType("success");
    setToastMessage("Your anonymous feedback has been securely submitted.");

    // Clear form

    // Optionally add it to the local feed so they see it instantly
    if (comment.trim() !== "") {
     const newLocalFeedback = {
      id: Date.now(),
      course: courseCode,
      text: comment,
      upvotes: 0, // Start at 0 so they can vote on it
      downvotes: 0,
      userVote: null,
      replies: [],
     };
     setFeedbacks([newLocalFeedback, ...feedbacks]);
    }
    setComment("");
    setRatings({});
   } else {
    // ERROR (e.g., 409 Duplicate Entry)
    setToastType("error");
    setToastMessage(data.message || "Failed to submit feedback.");
   }
  } catch (error) {
   console.error("Submit error:", error);
   setToastType("error");
   setToastMessage("Server error. Please try again later.");
  }

  // Hide toast after 4 seconds
  setTimeout(() => setToastMessage(null), 4000);
 };

 const handleVote = async (id, voteType) => {
  // 1. Find the feedback item
  const feedbackToVote = feedbacks.find((f) => f.id === id);

  // 2. THE FREEZE CHECK: If they already voted, stop and show error
  if (feedbackToVote && feedbackToVote.userVote) {
   setToastType("error");
   setToastMessage("You can only vote once per comment.");
   setTimeout(() => setToastMessage(null), 3000);
   return;
  }

  // 3. Optimistically update UI so it feels instant
  setFeedbacks(
   feedbacks.map((f) => {
    if (f.id === id) {
     let newUpvotes = f.upvotes;
     let newDownvotes = f.downvotes;
     voteType === "up" ? newUpvotes++ : newDownvotes++;

     return {
      ...f,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: voteType,
     };
    }
    return f;
   }),
  );

  // 4. Send the user's vote action to the backend
  try {
   const response = await fetch("http://localhost:5001/api/feedback/vote", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     feedbackId: id,
     userId: userId, // Pass the user ID from localStorage
     voteType: voteType,
    }),
   });

   if (!response.ok) {
    // If backend rejects (e.g., they bypassed the UI freeze), revert the UI here if needed
    console.error("Vote rejected by server");
   }
  } catch (error) {
   console.error("Failed to save vote to database:", error);
  }
 };

 // Update the UI instantly so the arrow changes color

 return (
  <DashboardLayout>
   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
    {/* DYNAMIC TOAST NOTIFICATION */}
    {toastMessage && (
     <div
      className={`fixed bottom-8 right-8 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-8 slide-in-from-right-8 duration-300 ${toastType === "success" ? "bg-green-600" : "bg-red-600"}`}
     >
      {toastType === "success" ? (
       <CheckCircle size={24} />
      ) : (
       <AlertCircle size={24} />
      )}
      <div>
       <p
        className={`text-sm font-black uppercase tracking-widest mb-0.5 ${toastType === "success" ? "text-green-200" : "text-red-200"}`}
       >
        {toastType === "success" ? "Success" : "Error"}
       </p>
       <p className="font-bold">{toastMessage}</p>
      </div>
      <button
       onClick={() => setToastMessage(null)}
       className={`ml-4 hover:text-white ${toastType === "success" ? "text-green-200" : "text-red-200"}`}
      >
       <X size={18} />
      </button>
     </div>
    )}

    {!selected ? (
     /* COURSE SELECTION SCREEN */
     <div className="max-w-xl mx-auto mt-20">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 text-center">
       <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <MessageSquare size={32} />
       </div>
       <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Course Feedback
       </h2>
       <p className="text-slate-500 mb-8">
        Select a course to submit anonymous feedback or view peer discussions.
       </p>

       <div className="space-y-4 text-left">
        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
         Select Enrolled Course
        </label>

        {/* --- PASTE THE NEW CODE HERE --- */}
        <div className="relative text-left w-full mt-2">
         {/* TRIGGER BUTTON */}
         <button
          type="button"
          onClick={(e) => {
           e.stopPropagation(); // Prevents the window click listener from immediately closing it
           setIsDropdownOpen(!isDropdownOpen);
          }}
          className={`w-full p-4 bg-white border-2 rounded-xl outline-none transition-all flex justify-between items-center shadow-sm font-bold text-slate-700 ${
           isDropdownOpen
            ? "border-indigo-500 ring-4 ring-indigo-50"
            : "border-slate-200 hover:border-indigo-300"
          }`}
         >
          <span
           className={
            courseCode ? "text-slate-800" : "text-slate-400 font-medium"
           }
          >
           {courseCode || "Choose a course..."}
          </span>
          <ChevronDown
           size={20}
           className={`text-slate-400 transition-transform duration-300 ${
            isDropdownOpen ? "rotate-180 text-indigo-500" : ""
           }`}
          />
         </button>

         {/* DROPDOWN MENU */}
         {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 py-2">
           {courseOptions.length > 0 ? (
            courseOptions.map((course) => (
             <div
              key={course}
              onClick={() => {
               setCourseCode(course);
               setIsDropdownOpen(false); // Close menu on select
              }}
              className={`px-5 py-3.5 cursor-pointer flex items-center justify-between transition-colors ${
               courseCode === course
                ? "bg-indigo-50 text-indigo-700 font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
             >
              {course}
              {courseCode === course && (
               <Check size={18} className="text-indigo-600" />
              )}
             </div>
            ))
           ) : (
            <div className="p-4 text-center text-slate-500 text-sm font-medium">
             No courses found
            </div>
           )}
          </div>
         )}
        </div>

        <button
         onClick={() => courseCode && setSelected(true)}
         disabled={!courseCode}
         className="w-full mt-4 bg-indigo-600 disabled:bg-slate-300 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
        >
         Enter Feedback Portal
        </button>
       </div>
      </div>
     </div>
    ) : (
     /* FEEDBACK DASHBOARD */
     <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
       <button
        onClick={() => setSelected(false)}
        className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 rounded-xl transition-colors"
       >
        <ChevronLeft size={24} />
       </button>
       <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
         {courseCode}
        </h2>
        <p className="text-slate-500 font-medium">
         Anonymous Student Feedback Portal
        </p>
       </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       {/* LEFT COLUMN: SUBMIT FEEDBACK */}
       <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
         <div className="flex items-center gap-2 mb-6 p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
          <Info size={20} className="shrink-0" />
          <p className="text-xs font-medium leading-relaxed">
           Your identity is protected. Professors only see aggregated ratings
           and anonymous comments.
          </p>
         </div>

         <form onSubmit={submitFeedback} className="space-y-6">
          <div className="space-y-4">
           {parameters.map((param) => (
            <div key={param} className="flex items-center justify-between">
             <p className="text-sm font-bold text-slate-700">{param}</p>
             <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
               <button
                type="button"
                key={star}
                onClick={() => handleRating(param, star)}
                className="transition-transform hover:scale-110 focus:outline-none"
               >
                <Star
                 size={24}
                 className={
                  star <= (ratings[param] || 0)
                   ? "fill-yellow-400 text-yellow-400"
                   : "fill-slate-100 text-slate-200 hover:fill-yellow-200 hover:text-yellow-200"
                 }
                />
               </button>
              ))}
             </div>
            </div>
           ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
           <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
            Detailed Feedback (Optional)
           </label>
           <textarea
            placeholder="What's going well? What could be improved?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors resize-none h-32 text-sm text-slate-700"
           />
          </div>

          <button
           type="submit"
           className="w-full bg-slate-900 hover:bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
           <Send size={18} /> Submit Anonymously
          </button>
         </form>
        </div>
       </div>

       {/* RIGHT COLUMN: FEEDBACK FEED */}
       <div className="lg:col-span-7">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
         <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
           <MessageSquare size={18} className="text-indigo-500" />
           Class Discussion
          </h3>
          <span className="text-xs font-bold bg-slate-200 text-slate-600 px-3 py-1 rounded-full uppercase">
           Most Helpful
          </span>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {feedbacks.filter((f) => f.course === courseCode).length === 0 ? (
           <div className="text-center py-20">
            <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">
             No feedback submitted yet for this course.
            </p>
           </div>
          ) : (
           feedbacks
            .filter((f) => f.course === courseCode)
            .map((f) => (
             <div
              key={f.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex gap-4 transition-all hover:border-indigo-200"
             >
              {/* VOTING COLUMN */}
              <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-lg p-2 h-fit border border-slate-100 min-w-[50px]">
               <button
                onClick={() => handleVote(f.id, "up")}
                disabled={f.userVote !== null && f.userVote !== undefined} // Freeze button if they voted
                className={`transition-colors p-1 rounded-md ${
                 f.userVote === "up"
                  ? "text-green-600 bg-green-100 cursor-not-allowed opacity-100" // Voted Up (Locked)
                  : f.userVote === "down"
                    ? "text-slate-300 cursor-not-allowed opacity-50" // Voted Down (Grey out the Up button)
                    : "text-slate-400 hover:text-green-600 hover:bg-slate-200" // Has not voted yet
                }`}
               >
                <ArrowBigUp
                 size={24}
                 className={f.userVote === "up" ? "fill-green-600" : ""}
                />
               </button>

               <span
                className={`font-black text-sm ${
                 f.userVote === "up"
                  ? "text-green-600"
                  : f.userVote === "down"
                    ? "text-red-600"
                    : "text-slate-700"
                }`}
               >
                {f.upvotes - f.downvotes}
               </span>

               <button
                onClick={() => handleVote(f.id, "down")}
                disabled={f.userVote !== null && f.userVote !== undefined} // Freeze button if they voted
                className={`transition-colors p-1 rounded-md ${
                 f.userVote === "down"
                  ? "text-red-600 bg-red-100 cursor-not-allowed opacity-100" // Voted Down (Locked)
                  : f.userVote === "up"
                    ? "text-slate-300 cursor-not-allowed opacity-50" // Voted Up (Grey out the Down button)
                    : "text-slate-400 hover:text-red-600 hover:bg-slate-200" // Has not voted yet
                }`}
               >
                <ArrowBigDown
                 size={24}
                 className={f.userVote === "down" ? "fill-red-600" : ""}
                />
               </button>
              </div>
              {/* CONTENT COLUMN */}
              <div className="flex-1 space-y-3">
               {/* NEW METADATA ROW */}
               <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-slate-500 mb-1">
                {/* Anonymous User Label */}
                <div className="flex items-center gap-1.5">
                 <User size={16} className="text-indigo-600" />
                 <span className="text-indigo-600/90">Anonymous User</span>
                </div>

                {/* Dynamic Timestamp */}
                <div className="flex items-center gap-1.5">
                 <Clock size={16} className="text-slate-400" />
                 <span>
                  {f.date ? new Date(f.date).toLocaleString() : "Just now"}
                 </span>
                </div>

                {/* Professor Replies Count */}
                <div className="flex items-center gap-1.5">
                 <MessageCircle size={16} className="text-indigo-500" />
                 <span className="text-indigo-500/90">
                  Professor Replies ({f.replies ? f.replies.length : 0})
                 </span>
                </div>
               </div>
               {/* END METADATA ROW */}

               <p className="text-slate-700 text-sm leading-relaxed mt-2">
                {f.text}
               </p>

               {/* PROFESSOR REPLIES (Existing Code) */}
               {f.replies && f.replies.length > 0 && (
                <div className="mt-4 space-y-2">
                 {f.replies.map((reply, idx) => (
                  <div
                   key={idx}
                   className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-r-xl"
                  >
                   <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-1">
                    Professor Response
                   </p>
                   <p className="text-sm text-indigo-900">{reply}</p>
                  </div>
                 ))}
                </div>
               )}
              </div>
             </div>
            ))
          )}
         </div>
        </div>
       </div>
      </div>
     </div>
    )}
   </div>
  </DashboardLayout>
 );
}
export default Feedback;
