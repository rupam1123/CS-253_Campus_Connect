const db = require("../config/db");

const submitFeedback = async (req, res) => {
  const {
    userId,
    courseName,
    contentQuality,
    teachingDelivery,
    clarity,
    engagement,
    lecturePace,
    detailedFeedback,
  } = req.body;

  // Basic validation to ensure no missing fields
  if (!userId || !courseName || !contentQuality || !teachingDelivery || !clarity || !engagement || !lecturePace) {
    return res.status(400).json({ message: "Please fill out all rating fields." });
  }

  try {
    const query = `
      INSERT INTO course_feedback 
      (user_id, course_name, content_quality, teaching_delivery, clarity, engagement, lecture_pace, detailed_feedback) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId,
      courseName,
      contentQuality,
      teachingDelivery,
      clarity,
      engagement,
      lecturePace,
      detailedFeedback || "", // Fallback to empty string if no text comment is provided
    ];

    await db.promise().execute(query, values);

    res.status(201).json({ message: "Feedback submitted successfully!" });

  } catch (error) {
    console.error("Error inserting feedback:", error);

    // ER_DUP_ENTRY is MySQL's error code when a Primary Key rule is broken
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        message: "You have already submitted feedback for this specific course." 
      });
    }

    res.status(500).json({ message: "Server error while submitting feedback." });
  }
};
// Add this below your submitFeedback function in feedbackController.js

const getCourseDiscussions = async (req, res) => {
  const { courseName } = req.params;

  try {
    // Fetch feedback that actually has a text comment
    const query = `
      SELECT 
        feedback_id,
        user_id, 
        detailed_feedback AS text, 
        upvotes,
        downvotes,
        created_at 
      FROM course_feedback 
      WHERE course_name = ? 
        AND detailed_feedback IS NOT NULL 
        AND TRIM(detailed_feedback) != ''
      ORDER BY created_at DESC
    `;

    const [rows] = await db.promise().query(query, [courseName]);

    // Format the data to match your frontend's expected structure.
    // Note: Since we haven't built a voting/reply table yet, we default those to 0/empty.
    const formattedFeedbacks = rows.map((row, index) => ({
      id: row.feedback_id, // Generate a unique ID for React's key
      course: courseName,
      text: row.text,
      date: row.created_at,
      upvotes: row.upvotes || 0,
      downvotes: row.downvotes || 0,
      userVote: null,
      replies: []
    }));

    res.status(200).json({ feedbacks: formattedFeedbacks });

  } catch (error) {
    console.error("Error fetching discussions:", error);
    res.status(500).json({ message: "Server error while fetching discussions" });
  }
};
const voteFeedback = async (req, res) => {
  try {
    // Grab the exact calculated numbers we sent from React
    const { feedbackId, upvotes, downvotes } = req.body;

    // Validate that all necessary data was provided
    if (!feedbackId || upvotes === undefined || downvotes === undefined) {
      return res.status(400).json({ message: "Missing data" });
    }

    // Overwrite the database with the correct frontend math
    await db.promise().query(
      "UPDATE course_feedback SET upvotes = ?, downvotes = ? WHERE feedback_id = ?",
      [upvotes, downvotes, feedbackId]
    );

    res.json({ message: "Feedback vote updated successfully" });
  } catch (err) {
    console.error("Feedback Vote Error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// Don't forget to export it!
module.exports = { submitFeedback, getCourseDiscussions,voteFeedback };
