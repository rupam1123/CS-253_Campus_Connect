// // ======================
// // IMPORT DB
// // ======================
// // const db = require("./config/db");

// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const otpRoutes = require("./routes/otpRoutes");
// const authRoutes = require("./routes/authRoutes");
// const projectRoutes = require("./routes/projectRoutes.js");
// const forumroutes = require("./routes/forum.js");
// const applicationRoutes = require("./routes/applicationsRoutes.js");
// const coursesRoutes = require("./routes/courseRoutes.js");
// const feedbackRoutes = require("./routes/feedbackRoutes.js");
// const professorRoutes = require("./routes/professorRoutes.js");

// // Mount the routes

// dotenv.config();

// const app = express();

// app.use(
//  cors({
//   origin: [
//    "http://localhost:5173",
//    "https://campusconnect-green-pi.vercel.app",
//   ],
//   credentials: true,
//  }),
// );

// app.use(express.json());

// app.use("/api/applications", applicationRoutes);
// app.use("/api/projects", projectRoutes);
// app.use("/api/otp", otpRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/forum", forumroutes);
// app.use("/api/courses", coursesRoutes);
// app.use("/api/feedback", feedbackRoutes);
// app.use("/api/professor", professorRoutes);

// app.listen(process.env.PORT, () => {
//  console.log(`Server running on port ${process.env.PORT}`);
// });
// Load env variables FIRST before any other imports
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

// Import Routes
const otpRoutes = require("./routes/otpRoutes");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes.js");
const forumroutes = require("./routes/forum.js");
const applicationRoutes = require("./routes/applicationsRoutes.js");
const coursesRoutes = require("./routes/courseRoutes.js");
const feedbackRoutes = require("./routes/feedbackRoutes.js");
const professorRoutes = require("./routes/professorRoutes.js");

const app = express();

// Middleware
app.use(
 cors({
  origin: [
   "http://localhost:5173",
   "https://campusconnect-green-pi.vercel.app",
  ],
  credentials: true,
 }),
);

app.use(express.json());

// ======================
// HEALTH CHECK ROUTE
// ======================
// Render pings this to make sure your server deployed successfully
app.get("/", (req, res) => {
 res.status(200).send("Campus Connect API is running securely!");
});

// ======================
// MOUNT ROUTES
// ======================
app.use("/api/applications", applicationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/forum", forumroutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/professor", professorRoutes);

// ======================
// START SERVER
// ======================
// Fallback to 5000 for local testing if Render's PORT isn't found
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
 console.log(`🚀 Server running on port ${PORT}`);
});
