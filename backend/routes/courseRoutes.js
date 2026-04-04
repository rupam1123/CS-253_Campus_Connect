// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
 addCourseStaff,
 addCourseStudents,
 createProfessorCourse,
 deleteProfessorCourse,
 getLectureDiscussion,
 getLectureLiveHub,
 getProfessorCourseDetail,
 getProfessorManagedCourses,
 getStudentCourseTimeline,
 getStudentCourses,
 postLectureLiveComment,
 submitLectureRating,
} = require("../controllers/courseController");

router.get("/professor/managed", auth, getProfessorManagedCourses);
router.get("/professor/:courseId", auth, getProfessorCourseDetail);
router.post("/professor", auth, createProfessorCourse);
router.delete("/professor/:courseId", auth, deleteProfessorCourse);
router.post("/professor/:courseId/staff", auth, addCourseStaff);
router.post("/professor/:courseId/students", auth, addCourseStudents);
router.get(
 "/professor/:courseId/lectures/:lectureId/discussion",
 auth,
 getLectureDiscussion,
);
router.get("/student/timeline", auth, getStudentCourseTimeline);
router.get("/:courseId/lectures/:lectureId/live", auth, getLectureLiveHub);
router.post(
 "/:courseId/lectures/:lectureId/live-comments",
 auth,
 postLectureLiveComment,
);
router.post(
 "/:courseId/lectures/:lectureId/live-rating",
 auth,
 submitLectureRating,
);

// GET /api/courses/:userId
router.get("/:userId", getStudentCourses);

module.exports = router;
