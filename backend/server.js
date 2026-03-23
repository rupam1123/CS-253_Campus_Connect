// ======================
// IMPORT DB
// ======================
// const db = require("./config/db");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const otpRoutes = require("./routes/otpRoutes");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes.js");
const forumroutes = require("./routes/forum.js");
const applicationRoutes = require("./routes/applicationsRoutes.js");
const coursesRoutes = require("./routes/courseRoutes.js");
const feedbackRoutes = require("./routes/feedbackRoutes.js");
const professorRoutes = require("./routes/professorRoutes.js");

// Mount the routes

dotenv.config();

const app = express();

/* VERY IMPORTANT: put CORS BEFORE routes */

app.use(
 cors({
  origin: "http://localhost:5173",
  credentials: true,
 }),
);

app.use(express.json());

app.use("/api/applications", applicationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/forum", forumroutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/professor", professorRoutes);

app.listen(process.env.PORT, () => {
 console.log(`Server running on port ${process.env.PORT}`);
});
