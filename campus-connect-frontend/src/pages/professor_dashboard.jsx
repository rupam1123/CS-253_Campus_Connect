// import { useState } from "react";
// import DashboardLayout from "../layouts/dashboard_layout";
// import { Bar } from "react-chartjs-2";
// import {
//  Chart as ChartJS,
//  CategoryScale,
//  LinearScale,
//  BarElement,
//  Title,
//  Tooltip,
//  Legend,
// } from "chart.js";

// ChartJS.register(
//  CategoryScale,
//  LinearScale,
//  BarElement,
//  Title,
//  Tooltip,
//  Legend,
// );

// function ProfessorDashboard() {
//  const [selectedCourse, setSelectedCourse] = useState("");

//  // Mock Data for Comments
//  const [comments, setComments] = useState([
//   {
//    id: 1,
//    course: "Operating Systems",
//    text:
//     "The explanation of Semaphore logic was a bit too fast. Could we get more examples?",
//    upvotes: 12,
//    downvotes: 2,
//    replies: [],
//   },
//   {
//    id: 2,
//    course: "Operating Systems",
//    text:
//     "Loving the hands-on lab sessions! Very helpful for understanding kernel threads.",
//    upvotes: 24,
//    downvotes: 0,
//    replies: ["Glad you're enjoying them! We will add a Pintos lab next week."],
//   },
//   {
//    id: 3,
//    course: "Data Structures",
//    text:
//     "The assignment on Red-Black trees was extremely difficult compared to the lecture content.",
//    upvotes: 18,
//    downvotes: 1,
//    replies: [],
//   },
//   {
//    id: 4,
//    course: "Data Structures",
//    text: "Can we have a doubt-clearing session before the mid-sem?",
//    upvotes: 30,
//    downvotes: 0,
//    replies: [],
//   },
//   {
//    id: 5,
//    course: "Computer Networks",
//    text: "The slide deck for TCP/IP is missing the diagrams shown in class.",
//    upvotes: 5,
//    downvotes: 8,
//    replies: [],
//   },
//   {
//    id: 6,
//    course: "Operating Systems",
//    text: "Is the final exam going to be open-book?",
//    upvotes: 45,
//    downvotes: 3,
//    replies: [],
//   },
//   {
//    id: 7,
//    course: "Computer Networks",
//    text:
//     "Great pace! The packet sniffing demo was the highlight of the semester.",
//    upvotes: 15,
//    downvotes: 1,
//    replies: [],
//   },
//   {
//    id: 8,
//    course: "Data Structures",
//    text:
//     "Please use a darker marker on the whiteboard, it's hard to see from the back.",
//    upvotes: 9,
//    downvotes: 0,
//    replies: [],
//   },
//   {
//    id: 9,
//    course: "Operating Systems",
//    text: "I feel like the grading on the last quiz was a bit too harsh.",
//    upvotes: 3,
//    downvotes: 15,
//    replies: [],
//   },
//   {
//    id: 10,
//    course: "Computer Networks",
//    text:
//     "The Wireshark lab instructions were a bit outdated for the latest version.",
//    upvotes: 7,
//    downvotes: 2,
//    replies: [],
//   },
//  ]);

//  const [replyText, setReplyText] = useState({});

//  const handleReply = (id) => {
//   if (!replyText[id]) return;
//   setComments(
//    comments.map((c) =>
//     c.id === id ? { ...c, replies: [...c.replies, replyText[id]] } : c,
//    ),
//   );
//   setReplyText({ ...replyText, [id]: "" });
//  };

//  const filteredComments = comments.filter((c) => c.course === selectedCourse);

//  // ... (Chart data and options from previous response)
//  const courseData = {
//   "Operating Systems": [4.2, 3.8, 4.5, 3.9, 4.1],
//   "Data Structures": [4.5, 4.2, 4.4, 4.0, 4.3],
//   "Computer Networks": [3.9, 3.7, 4.1, 3.8, 4.0],
//  };
//  const labels = [
//   "Content Quality",
//   "Teaching Delivery",
//   "Clarity",
//   "Engagement",
//   "Lecture Pace",
//  ];
//  const currentData = courseData[selectedCourse] || [];
//  const data = {
//   labels,
//   datasets: [
//    {
//     label: "Rating",
//     data: currentData,
//     backgroundColor: "#4f46e5",
//     borderRadius: 8,
//    },
//   ],
//  };

//  return (
//   <DashboardLayout>
//    <div className="p-6 bg-slate-50 min-h-screen">
//     <header className="mb-8">
//      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
//       Professor Analytics
//      </h2>
//      <p className="text-slate-500">
//       Real-time student feedback and performance metrics.
//      </p>
//     </header>

//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//      {/* LEFT COLUMN: SELECTION & CHART */}
//      <div className="lg:col-span-2 space-y-6">
//       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
//        <select
//         value={selectedCourse}
//         onChange={(e) => setSelectedCourse(e.target.value)}
//         className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700"
//        >
//         <option value="">Select a Course to View Analytics</option>
//         <option value="Operating Systems">Operating Systems</option>
//         <option value="Data Structures">Data Structures</option>
//         <option value="Computer Networks">Computer Networks</option>
//        </select>
//       </div>

//       {selectedCourse && (
//        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
//         <Bar
//          data={data}
//          options={{ responsive: true, maintainAspectRatio: false }}
//         />
//        </div>
//       )}
//      </div>

//      {/* RIGHT COLUMN: RECENT COMMENTS */}
//      <div className="lg:col-span-1">
//       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
//        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
//         <h3 className="font-bold text-slate-800 flex items-center gap-2">
//          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
//          Anonymous Student Feed
//         </h3>
//        </div>

//        <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {selectedCourse ? (
//          filteredComments.map((comment) => (
//           <div
//            key={comment.id}
//            className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3"
//           >
//            <p className="text-sm text-slate-600 leading-relaxed italic">
//             "{comment.text}"
//            </p>

//            <div className="flex items-center justify-between">
//             <div className="flex gap-3">
//              <span className="flex items-center gap-1 text-[11px] font-bold text-green-600">
//               ▲ {comment.upvotes}
//              </span>
//              <span className="flex items-center gap-1 text-[11px] font-bold text-red-400">
//               ▼ {comment.downvotes}
//              </span>
//             </div>
//            </div>

//            {/* Replies */}
//            {comment.replies.map((r, i) => (
//             <div
//              key={i}
//              className="ml-4 p-2 bg-indigo-50 border-l-2 border-indigo-400 text-xs text-indigo-700 rounded-r-md"
//             >
//              <span className="font-bold">You:</span> {r}
//             </div>
//            ))}

//            {/* Reply Input */}
//            <div className="flex gap-2 mt-2">
//             <input
//              type="text"
//              placeholder="Reply to student..."
//              value={replyText[comment.id] || ""}
//              onChange={(e) =>
//               setReplyText({ ...replyText, [comment.id]: e.target.value })
//              }
//              className="flex-1 text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
//             />
//             <button
//              onClick={() => handleReply(comment.id)}
//              className="bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-lg font-bold"
//             >
//              Send
//             </button>
//            </div>
//           </div>
//          ))
//         ) : (
//          <p className="text-center text-slate-400 mt-10 text-sm">
//           Select a course to see comments.
//          </p>
//         )}
//        </div>
//       </div>
//      </div>
//     </div>
//    </div>
//   </DashboardLayout>
//  );
// }

// export default ProfessorDashboard;

import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/dashboard_layout";
import { Bar } from "react-chartjs-2";
import {
 Chart as ChartJS,
 CategoryScale,
 LinearScale,
 BarElement,
 Title,
 Tooltip,
 Legend,
} from "chart.js";

ChartJS.register(
 CategoryScale,
 LinearScale,
 BarElement,
 Title,
 Tooltip,
 Legend,
);

function ProfessorDashboard() {
 const [selectedCourse, setSelectedCourse] = useState("");

 // States for live database data
 const [comments, setComments] = useState([]);
 const [chartDataArray, setChartDataArray] = useState([0, 0, 0, 0, 0]);
 const [replyText, setReplyText] = useState({});

 // NEW: Fetch live data whenever a course is selected
 useEffect(() => {
  if (selectedCourse) {
   // 1. Fetch Chart Averages
   fetch(
    `http://localhost:5001/api/professor/analytics/${encodeURIComponent(selectedCourse)}`,
   )
    .then((res) => res.json())
    .then((data) => {
     if (data.chartData) setChartDataArray(data.chartData);
    })
    .catch((err) => console.error("Failed to fetch chart data:", err));

   // 2. Fetch Student Comments
   fetch(
    `http://localhost:5001/api/professor/comments/${encodeURIComponent(selectedCourse)}`,
   )
    .then((res) => res.json())
    .then((data) => {
     if (data.comments) setComments(data.comments);
    })
    .catch((err) => console.error("Failed to fetch comments:", err));
  } else {
   // Reset if no course is selected
   setChartDataArray([0, 0, 0, 0, 0]);
   setComments([]);
  }
 }, [selectedCourse]);

 // Handle local UI replies (Note: not saved to DB yet)
 const handleReply = (id) => {
  if (!replyText[id]) return;
  setComments(
   comments.map((c) =>
    c.id === id ? { ...c, replies: [...c.replies, replyText[id]] } : c,
   ),
  );
  setReplyText({ ...replyText, [id]: "" });
 };

 // Chart configuration
 const labels = [
  "Content Quality",
  "Teaching Delivery",
  "Clarity",
  "Engagement",
  "Lecture Pace",
 ];

 const data = {
  labels,
  datasets: [
   {
    label: "Rating",
    data: chartDataArray,
    backgroundColor: "#4f46e5",
    borderRadius: 8,
   },
  ],
 };

 return (
  <DashboardLayout>
   <div className="p-6 bg-slate-50 min-h-screen">
    <header className="mb-8">
     <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
      Professor Analytics
     </h2>
     <p className="text-slate-500">
      Real-time student feedback and performance metrics.
     </p>
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
     {/* LEFT COLUMN: SELECTION & CHART */}
     <div className="lg:col-span-2 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
       <select
        value={selectedCourse}
        onChange={(e) => setSelectedCourse(e.target.value)}
        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700"
       >
        <option value="">Select a Course to View Analytics</option>
        {/* Eventually, you can fetch these course options from the DB too! */}
        <option value="Operating Systems">Operating Systems</option>
        <option value="Data Structures">Data Structures</option>
        <option value="Computer Networks">Computer Networks</option>
        <option value="DBMS">DBMS</option>
        <option value="Compiler Design">Compiler Design</option>
        <option value="Cyber Security">Cyber Security</option>
        <option value="AI">AI</option>
        <option value="Cloud Computing">Cloud Computing</option>
       </select>
      </div>

      {selectedCourse && (
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
        <Bar
         data={data}
         options={{
          responsive: true,
          maintainAspectRatio: false,
          // Add the scales configuration to fix the y-axis
          scales: {
           y: {
            beginAtZero: true, // This ensures it starts at 0
            min: 0, // Forces the minimum value to be 0
            max: 5, // Forces the maximum value to be 5
            ticks: {
             stepSize: 1, // optional: sets grid lines and numbers at 1, 2, 3, etc.
            },
           },
          },
         }}
        />
       </div>
      )}
     </div>

     {/* RIGHT COLUMN: RECENT COMMENTS */}
     <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
       <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
         <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
         Anonymous Student Feed
        </h3>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedCourse ? (
         comments.length > 0 ? (
          comments.map((comment) => (
           <div
            key={comment.id}
            className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3"
           >
            <p className="text-sm text-slate-600 leading-relaxed italic">
             "{comment.text}"
            </p>

            <div className="flex items-center justify-between">
             <div className="flex gap-3">
              <span className="flex items-center gap-1 text-[11px] font-bold text-green-600">
               ▲ {comment.upvotes}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-red-400">
               ▼ {comment.downvotes}
              </span>
             </div>
            </div>

            {/* Replies */}
            {comment.replies &&
             comment.replies.map((r, i) => (
              <div
               key={i}
               className="ml-4 p-2 bg-indigo-50 border-l-2 border-indigo-400 text-xs text-indigo-700 rounded-r-md"
              >
               <span className="font-bold">You:</span> {r}
              </div>
             ))}

            {/* Reply Input */}
            <div className="flex gap-2 mt-2">
             <input
              type="text"
              placeholder="Reply to student..."
              value={replyText[comment.id] || ""}
              onChange={(e) =>
               setReplyText({ ...replyText, [comment.id]: e.target.value })
              }
              className="flex-1 text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
             />
             <button
              onClick={() => handleReply(comment.id)}
              className="bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-lg font-bold"
             >
              Send
             </button>
            </div>
           </div>
          ))
         ) : (
          <p className="text-center text-slate-400 mt-10 text-sm font-medium">
           No comments submitted yet for this course.
          </p>
         )
        ) : (
         <p className="text-center text-slate-400 mt-10 text-sm">
          Select a course to see comments.
         </p>
        )}
       </div>
      </div>
     </div>
    </div>
   </div>
  </DashboardLayout>
 );
}

export default ProfessorDashboard;
