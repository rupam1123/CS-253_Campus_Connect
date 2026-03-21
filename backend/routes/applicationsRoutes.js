const express = require("express");
const {
 applyToProject,
 getStudentDashboardData,
} = require("../controllers/applicationController");

const router = express.Router();

router.post("/apply", applyToProject);
// GET request to fetch dashboard application data for a specific student
router.get("/dashboard/:userId", getStudentDashboardData);

module.exports = router;
// routes/applicationRoutes.js
