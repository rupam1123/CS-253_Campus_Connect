// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const { getStudentCourses } = require("../controllers/courseController");

// GET /api/courses/:userId
router.get("/:userId", getStudentCourses);

module.exports = router;
