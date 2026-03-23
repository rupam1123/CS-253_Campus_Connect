const express = require("express");
const router = express.Router();
const { submitFeedback, getCourseDiscussions } = require("../controllers/feedbackController");
const { voteFeedback } = require("../controllers/feedbackController");

// POST /api/feedback/submit
router.post("/submit", submitFeedback);
router.get("/discussions/:courseName", getCourseDiscussions);
router.put("/vote", voteFeedback);
module.exports = router;