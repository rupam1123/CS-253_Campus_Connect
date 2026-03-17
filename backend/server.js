// ======================
// IMPORT DB
// ======================
// const db = require("./config/db");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const otpRoutes = require("./routes/otpRoutes");
const authRoutes = require("./routes/authRoutes");

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

app.use("/api/otp", otpRoutes);
app.use("/api/auth", authRoutes);

app.listen(process.env.PORT, () => {
 console.log(`Server running on port ${process.env.PORT}`);
});
