const db = require("../config/db");
const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

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
 const numericRatings = [
  contentQuality,
  teachingDelivery,
  clarity,
  engagement,
  lecturePace,
 ].map((value) => Number.parseInt(value, 10));

 // Basic validation to ensure no missing fields
 if (
  !userId ||
  !courseName ||
  !contentQuality ||
  !teachingDelivery ||
  !clarity ||
  !engagement ||
  !lecturePace
 ) {
  return res
   .status(400)
   .json({ message: "Please fill out all rating fields." });
 }

 if (numericRatings.some((value) => Number.isNaN(value) || value < 1 || value > 5)) {
  return res
   .status(400)
   .json({ message: "Ratings must stay between 1 and 5." });
 }

 try {
  const query = `
      INSERT INTO course_feedback 
      (user_id, course_name, content_quality, teaching_delivery, clarity, engagement, lecture_pace, detailed_feedback) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const values = [
   userId,
   courseName.trim(),
   ...numericRatings,
   detailedFeedback?.trim() || "",
  ];

  await db.promise().execute(query, values);

  res.status(201).json({ message: "Feedback submitted successfully!" });
 } catch (error) {
  console.error("Error inserting feedback:", error);

  // ER_DUP_ENTRY is MySQL's error code when a Primary Key rule is broken
  if (error.code === "ER_DUP_ENTRY") {
   return res.status(409).json({
    message: "You have already submitted feedback for this specific course.",
   });
  }

  res.status(500).json({ message: "Server error while submitting feedback." });
 }
};
// Add this below your submitFeedback function in feedbackController.js

const getCourseDiscussions = async (req, res) => {
 const courseName = normalizeText(req.params.courseName);
 const { userId } = req.query; // Extract user ID from the new query param

 try {
  // Join the new votes table to see if THIS user voted on these comments
  const query = `
      SELECT 
        f.feedback_id, f.detailed_feedback AS text, f.upvotes, f.downvotes, f.created_at,
        COALESCE(NULLIF(u.anonymous_username, ''), CONCAT('anonymous_', f.user_id)) AS anonymous_username,
        v.vote_type AS userVote
      FROM course_feedback f
      LEFT JOIN users u ON u.user_id = f.user_id
      LEFT JOIN feedback_votes v 
        ON f.feedback_id = v.feedback_id AND v.user_id = ?
      WHERE f.course_name = ? 
        AND f.detailed_feedback IS NOT NULL 
        AND TRIM(f.detailed_feedback) != ''
      ORDER BY f.created_at DESC
    `;

  const [rows] = await db.promise().query(query, [userId, courseName]);

  const formattedFeedbacks = rows.map((row) => ({
   id: row.feedback_id,
   course: courseName,
   text: row.text,
   date: row.created_at,
   alias: row.anonymous_username,
   upvotes: row.upvotes || 0,
   downvotes: row.downvotes || 0,
   userVote: row.userVote || null, // Will be 'up', 'down', or null
   replies: [],
  }));

  res.status(200).json({ feedbacks: formattedFeedbacks });
 } catch (error) {
  console.error("Error fetching discussions:", error);
  res.status(500).json({ message: "Server error" });
 }
};
const voteFeedback = async (req, res) => {
 const { feedbackId, userId, voteType } = req.body;

 if (
  !feedbackId ||
  !userId ||
  !voteType ||
  !["up", "down"].includes(voteType)
 ) {
  return res.status(400).json({ message: "Missing data" });
 }

 try {
  // 1. Attempt to record the user's specific vote
  await db
   .promise()
   .query(
    "INSERT INTO feedback_votes (feedback_id, user_id, vote_type) VALUES (?, ?, ?)",
    [feedbackId, String(userId), voteType],
   );

  // 2. If the insert succeeds (no duplicate error), safely increment the main table
  const columnToUpdate = voteType === "up" ? "upvotes" : "downvotes";
  await db
   .promise()
   .query(
    `UPDATE course_feedback SET ${columnToUpdate} = ${columnToUpdate} + 1 WHERE feedback_id = ?`,
    [feedbackId],
   );

  res.json({ message: "Vote successfully locked in." });
 } catch (err) {
  // Catch the duplicate entry rule we set up in SQL
  if (err.code === "ER_DUP_ENTRY") {
   return res
    .status(403)
    .json({ message: "You have already voted on this comment." });
  }
  console.error("Feedback Vote Error:", err);
  res.status(500).json({ message: "Database error" });
 }
};

// Don't forget to export it!
module.exports = { submitFeedback, getCourseDiscussions, voteFeedback };
