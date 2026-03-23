const db = require("../config/db");

// 1. Fetch Averages for the Bar Chart
const getCourseAnalytics = async (req, res) => {
  const { courseName } = req.params;

  try {
    const query = `
      SELECT 
        AVG(content_quality) AS contentQuality,
        AVG(teaching_delivery) AS teachingDelivery,
        AVG(clarity) AS clarity,
        AVG(engagement) AS engagement,
        AVG(lecture_pace) AS lecturePace
      FROM course_feedback 
      WHERE course_name = ?
    `;

    const [rows] = await db.promise().query(query, [courseName]);
    const averages = rows[0];

    // Format as a simple array of numbers [4.2, 3.8, ...] for Chart.js
    const chartDataArray = [
      Number(parseFloat(averages.contentQuality || 0).toFixed(1)),
      Number(parseFloat(averages.teachingDelivery || 0).toFixed(1)),
      Number(parseFloat(averages.clarity || 0).toFixed(1)),
      Number(parseFloat(averages.engagement || 0).toFixed(1)),
      Number(parseFloat(averages.lecturePace || 0).toFixed(1)),
    ];

    res.status(200).json({ chartData: chartDataArray });

  } catch (error) {
    console.error("Error fetching course analytics:", error);
    res.status(500).json({ message: "Server error while fetching analytics." });
  }
};

// 2. Fetch Written Comments for the Feed
const getCourseComments = async (req, res) => {
  const { courseName } = req.params;

  try {
    const query = `
      SELECT 
        feedback_id AS id, 
        course_name AS course,
        detailed_feedback AS text, 
        upvotes, 
        downvotes 
      FROM course_feedback 
      WHERE course_name = ? 
        AND detailed_feedback IS NOT NULL 
        AND TRIM(detailed_feedback) != ''
      ORDER BY created_at DESC
    `;

    const [rows] = await db.promise().query(query, [courseName]);
    
    // Add an empty replies array since we don't have a replies DB table yet
    const formattedComments = rows.map(row => ({
      ...row,
      replies: [] 
    }));

    res.status(200).json({ comments: formattedComments });

  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error while fetching comments." });
  }
};

module.exports = { getCourseAnalytics, getCourseComments };