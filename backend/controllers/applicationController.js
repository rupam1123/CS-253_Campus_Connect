const db = require("../config/db");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const isValidUrl = (value) => {
 try {
  const parsedUrl = new URL(value);
  return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
 } catch (error) {
  return false;
 }
};

const getStudentProfile = async (connection, userId) => {
 const [rows] = await connection.query(
  `
   SELECT
    u.name,
    u.email,
    u.role,
    s.roll_number,
    s.branch,
    s.cpi,
    s.resume
   FROM users u
   LEFT JOIN students s ON s.user_id = u.user_id
   WHERE u.user_id = ?
   ORDER BY s.student_id DESC
   LIMIT 1
  `,
  [userId],
 );

 return rows[0] || null;
};

exports.applyToProject = async (req, res) => {
 const connection = db.promise();
 const projectId = Number.parseInt(req.body.project_id, 10);
 const userId = Number.parseInt(req.body.user_id, 10);

 if (!projectId || !userId) {
  return res.status(400).json({
   message: "A valid project and user are required.",
  });
 }

 try {
  const [projectRows] = await connection.query(
   "SELECT id, title, min_cpi FROM projects WHERE id = ? LIMIT 1",
   [projectId],
  );

  if (projectRows.length === 0) {
   return res.status(404).json({ message: "Project not found." });
  }

  const profile = await getStudentProfile(connection, userId);

  if (!profile) {
   return res.status(404).json({ message: "Student profile not found." });
  }

  if ((profile.role || "").toLowerCase() !== "student") {
   return res
    .status(403)
    .json({ message: "Only student accounts can apply to projects." });
  }

  const project = projectRows[0];
  const effectiveName = normalizeText(req.body.full_name) || normalizeText(profile.name);
  const effectiveRollNo =
   normalizeText(req.body.roll_no) || normalizeText(profile.roll_number);
  const effectiveBranch =
   normalizeText(req.body.branch) || normalizeText(profile.branch);
  const effectiveResume =
   normalizeText(req.body.resume) || normalizeText(profile.resume);
  const effectiveEmail =
   normalizeText(req.body.email_id).toLowerCase() ||
   normalizeText(profile.email).toLowerCase();
  const bodyCpi = Number.parseFloat(req.body.cpi);
  const storedCpi =
   profile.cpi === null || profile.cpi === undefined
    ? Number.NaN
    : Number.parseFloat(profile.cpi);
  const effectiveCpi = Number.isFinite(storedCpi) ? storedCpi : bodyCpi;
  const minimumCpi = Number.parseFloat(project.min_cpi) || 0;

  if (
   !effectiveEmail ||
   !effectiveName ||
   !effectiveRollNo ||
   !effectiveBranch ||
   !Number.isFinite(effectiveCpi) ||
   !effectiveResume
  ) {
   return res.status(400).json({
    message:
     "Complete your profile with roll number, branch, CPI, and resume before applying.",
   });
  }

  if (effectiveCpi < 0 || effectiveCpi > 10) {
   return res.status(400).json({
    message: "CPI must be between 0 and 10.",
   });
  }

  if (effectiveCpi < minimumCpi) {
   return res.status(400).json({
    message: `Your CPI is below the minimum requirement of ${minimumCpi.toFixed(2)} for this project.`,
   });
  }

  if (!EMAIL_REGEX.test(effectiveEmail)) {
   return res.status(400).json({
    message: "Please provide a valid email address.",
   });
  }

  if (!isValidUrl(effectiveResume)) {
   return res.status(400).json({
    message: "Please provide a valid resume link.",
   });
  }

  await connection.query(
   `
    INSERT INTO applications
    (project_id, user_id, full_name, roll_no, branch, cpi, email_id, resume, sop)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
   `,
   [
    projectId,
    userId,
    effectiveName,
    effectiveRollNo,
    effectiveBranch,
    effectiveCpi,
    effectiveEmail,
    effectiveResume,
    normalizeText(req.body.sop),
   ],
  );

  res.status(201).json({
   message: "Application submitted successfully",
  });
 } catch (error) {
  if (error.code === "ER_DUP_ENTRY") {
   return res.status(400).json({
    message: "You have already applied to this project",
   });
  }

  console.error("Database error during application:", error);
  return res.status(500).json({
   error: error.message,
  });
 }
};

exports.getStudentDashboardData = async (req, res) => {
 const { userId } = req.params;

 try {
  const pendingQuery = `
      SELECT COUNT(*) as pendingCount
      FROM applications
      WHERE user_id = ? AND status = 'pending'
    `;
  const [pendingResult] = await db.promise().query(pendingQuery, [userId]);
  const totalPending = pendingResult[0].pendingCount || 0;

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
