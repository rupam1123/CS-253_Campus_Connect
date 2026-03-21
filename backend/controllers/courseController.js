// controllers/courseController.js
const db = require("../config/db"); // Adjust this path based on your db config file

const getStudentCourses = async (req, res) => {
  const { userId } = req.params;
  //console.log("hhhhhhhhhhh");
  try {
    // Fetch the courses for the specific user
    const [rows] = await db.promise().query(
      "SELECT * FROM student_courses WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No courses found for this user." });
    }

    const courseData = rows[0];

    // Extract the courses and filter out any empty or null values
    const courses = [
      courseData.course1,
      courseData.course2,
      courseData.course3,
      courseData.course4,
      courseData.course5,
    ].filter((course) => course && course.trim() !== "");

    res.status(200).json({ courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server error while fetching courses" });
  }
};

module.exports = { getStudentCourses };