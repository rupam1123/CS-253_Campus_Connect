const db = require("../config/db");

// 1. Updated to use async/await matching your dashboard code
exports.applyToProject = async (req, res) => {
 const {
  project_id,
  user_id,
  full_name,
  roll_no,
  branch,
  cpi,
  email_id,
  resume,
  sop,
 } = req.body;

 // Basic validation
 if (!project_id || !user_id || !email_id || !full_name) {
  return res.status(400).json({
   message: "Missing required fields",
  });
 }

 console.log(req.body);

 const query = `
    INSERT INTO applications 
    (project_id, user_id, full_name, roll_no, branch, cpi, email_id, resume, sop)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

 try {
  // Using .promise().query() to match the other function
  await db
   .promise()
   .query(query, [
    project_id,
    user_id,
    full_name,
    roll_no,
    branch,
    cpi,
    email_id,
    resume,
    sop,
   ]);

  res.status(201).json({
   message: "Application submitted successfully",
  });
 } catch (err) {
  // Duplicate application check
  if (err.code === "ER_DUP_ENTRY") {
   return res.status(400).json({
    message: "You have already applied to this project",
   });
  }

  console.error("Database error during application:", err);
  return res.status(500).json({
   error: err.message,
  });
 }
};

// 2. Kept exactly as you had it
exports.getStudentDashboardData = async (req, res) => {
 const { userId } = req.params;

 try {
  // Get the total number of "pending" applications for this user
  const pendingQuery = `
      SELECT COUNT(*) as pendingCount
      FROM applications
      WHERE user_id = ? AND status = 'pending'
    `;
  const [pendingResult] = await db.promise().query(pendingQuery, [userId]);
  const totalPending = pendingResult[0].pendingCount || 0;

  // Get the recent applications list by JOINING applications and projects
  const recentAppsQuery = `
      SELECT
        a.application_id as id,
        a.status,
        DATE_FORMAT(a.created_at, '%b %d') as date,
        p.title,
        p.professor_id as prof
      FROM applications a
      LEFT JOIN projects p ON a.project_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
      LIMIT 5
    `;
  const [recentApplications] = await db
   .promise()
   .query(recentAppsQuery, [userId]);

  // Send everything back to the frontend
  res.status(200).json({
   success: true,
   data: {
    pendingCount: totalPending,
    recentApplications: recentApplications,
   },
  });
 } catch (error) {
  console.error("Error fetching dashboard data:", error);
  res.status(500).json({
   success: false,
   message: "Server error fetching application data",
  });
 }
};
