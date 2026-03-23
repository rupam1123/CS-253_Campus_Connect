const express = require("express");
const router = express.Router();
const { getCourseAnalytics, getCourseComments } = require("../controllers/professorController");

// Routes for the Professor Dashboard
router.get("/analytics/:courseName", getCourseAnalytics);
router.get("/comments/:courseName", getCourseComments);

module.exports = router;