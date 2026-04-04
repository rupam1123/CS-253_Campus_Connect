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
const port = Number(process.env.PORT) || 5001;
const allowedOrigins = (
 process.env.CLIENT_URLS || "http://localhost:5173,http://localhost:4173"
)
 .split(",")
 .map((origin) => origin.trim())
 .filter(Boolean);

const isAllowedOrigin = (origin) => {
 if (!origin) {
  return true;
 }

 if (allowedOrigins.includes(origin)) {
  return true;
 }

 try {
  const parsedOrigin = new URL(origin);
  return parsedOrigin.hostname.endsWith(".vercel.app");
 } catch (error) {
  return false;
 }
};

app.use(
 cors({
  origin(origin, callback) {
   if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
   }

   callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
 }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
 res.status(200).json({ status: "ok" });
});

app.use("/api/applications", applicationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/forum", forumroutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/professor", professorRoutes);

app.use((_req, res) => {
 res.status(404).json({ message: "Route not found." });
});

app.use((err, _req, res, _next) => {
 console.error("Unhandled server error:", err);
 res.status(500).json({ message: "Internal server error." });
});

if (require.main === module) {
 app.listen(port, () => {
  console.log(`Server running on port ${port}`);
 });
}

module.exports = app;
