const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const ALIAS_REGEX = /^[A-Za-z0-9][A-Za-z0-9._ -]{2,39}$/;
const PASSWORD_REGEX =
 /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const PASSWORD_REQUIREMENTS_MESSAGE =
 "New password must be 8-64 characters long and include uppercase, lowercase, number, and special character.";

const normalizeText = (value) =>
 typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const normalizeAlias = (value) => normalizeText(value);

const parseOptionalCpi = (value) => {
 if (value === null || value === undefined || value === "") {
  return null;
 }

 const parsed = Number.parseFloat(value);
 return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const isValidAlias = (value) => ALIAS_REGEX.test(value);

const getFallbackAlias = (userId) => `anonymous_${userId}`;

const PROFILE_QUERY = `
 SELECT
  u.user_id,
  u.name,
  u.email,
  u.role,
  u.anonymous_username,
  (
   SELECT s.roll_number
   FROM students s
   WHERE s.user_id = u.user_id
   ORDER BY s.student_id DESC
   LIMIT 1
  ) AS roll_number,
  (
   SELECT s.branch
   FROM students s
   WHERE s.user_id = u.user_id
   ORDER BY s.student_id DESC
   LIMIT 1
  ) AS student_branch,
  (
   SELECT s.cpi
   FROM students s
   WHERE s.user_id = u.user_id
   ORDER BY s.student_id DESC
   LIMIT 1
  ) AS student_cpi,
  (
   SELECT s.resume
   FROM students s
   WHERE s.user_id = u.user_id
   ORDER BY s.student_id DESC
   LIMIT 1
  ) AS resume,
  (
   SELECT p.department
   FROM professors p
   WHERE p.user_id = u.user_id
   ORDER BY p.professor_id DESC
   LIMIT 1
  ) AS professor_branch
 FROM users u
 WHERE u.user_id = ?
 LIMIT 1
`;

const mapProfileRow = (row) => {
 const role = (row.role || "").toLowerCase();
 const cpiValue =
  row.student_cpi === null || row.student_cpi === undefined
   ? null
   : Number.parseFloat(row.student_cpi);

 return {
  id: row.user_id,
  name: row.name,
  email: row.email,
  role,
  anonymousUsername:
   normalizeAlias(row.anonymous_username) || getFallbackAlias(row.user_id),
  branch:
   role === "student"
    ? normalizeText(row.student_branch)
    : normalizeText(row.professor_branch),
  cpi: role === "student" && Number.isFinite(cpiValue) ? cpiValue : null,
  rollNumber: role === "student" ? normalizeText(row.roll_number) : "",
  resume: role === "student" ? normalizeText(row.resume) : "",
 };
};

const getProfileByUserId = async (connection, userId) => {
 const [rows] = await connection.query(PROFILE_QUERY, [userId]);
 return rows[0] ? mapProfileRow(rows[0]) : null;
};

exports.loginUser = async (req, res) => {
 const email = normalizeText(req.body.email).toLowerCase();
 const { password } = req.body;

 if (!email || !password) {
  return res
   .status(400)
   .json({ message: "Please provide both email and password" });
 }

 try {
  const connection = db.promise();
  const [rows] = await connection.query(
   "SELECT user_id, password FROM users WHERE email = ? LIMIT 1",
   [email],
  );

  if (rows.length === 0) {
   return res.status(400).json({ message: "Invalid email or password" });
  }

  const account = rows[0];
  const isMatch = await bcrypt.compare(password, account.password);

  if (!isMatch) {
   return res.status(400).json({ message: "Invalid email or password" });
  }

  const profile = await getProfileByUserId(connection, account.user_id);

  if (!profile) {
   return res.status(404).json({ message: "User profile not found" });
  }

  const token = jwt.sign({ id: profile.id }, process.env.JWT_SECRET, {
   expiresIn: "7d",
  });

  res.json({
   token,
   user: profile,
  });
 } catch (error) {
  console.error("Login Error:", error);
  res.status(500).json({ message: "Internal server error" });
 }
};

exports.getProfile = async (req, res) => {
 try {
  const profile = await getProfileByUserId(db.promise(), req.user.id);

  if (!profile) {
   return res.status(404).json({ message: "Profile not found." });
  }

  res.json({ user: profile });
 } catch (error) {
  console.error("Get Profile Error:", error);
  res.status(500).json({ message: "Unable to load profile right now." });
 }
};

exports.updateProfile = async (req, res) => {
 const userId = Number.parseInt(req.user?.id, 10);
 const anonymousUsername = normalizeAlias(req.body.anonymousUsername);
 const branch = normalizeText(req.body.branch);
 const rollNumber = normalizeText(req.body.rollNumber);
 const resume = normalizeText(req.body.resume);
 const parsedCpi = parseOptionalCpi(req.body.cpi);

 if (!userId) {
  return res.status(401).json({ message: "Invalid session." });
 }

 if (!anonymousUsername || !isValidAlias(anonymousUsername)) {
  return res.status(400).json({
   message:
    "Anonymous username must be 3-40 characters and can use letters, numbers, spaces, dots, underscores, or hyphens.",
  });
 }

 if (parsedCpi !== null && (Number.isNaN(parsedCpi) || parsedCpi < 0 || parsedCpi > 10)) {
  return res.status(400).json({ message: "CPI must stay between 0 and 10." });
 }

 const connection = db.promise();
 let transactionStarted = false;

 try {
  const [users] = await connection.query(
   "SELECT user_id, role FROM users WHERE user_id = ? LIMIT 1",
   [userId],
  );

  if (users.length === 0) {
   return res.status(404).json({ message: "User not found." });
  }

  const user = users[0];

  await connection.beginTransaction();
  transactionStarted = true;
  await connection.query(
   "UPDATE users SET anonymous_username = ? WHERE user_id = ?",
   [anonymousUsername, userId],
  );

  if (user.role === "student") {
   const [studentRows] = await connection.query(
    "SELECT student_id FROM students WHERE user_id = ? ORDER BY student_id DESC LIMIT 1",
    [userId],
   );

   if (studentRows.length > 0) {
    await connection.query(
     `UPDATE students
      SET roll_number = ?, branch = ?, cpi = ?, resume = ?
      WHERE student_id = ?`,
     [
      rollNumber || null,
      branch || null,
      parsedCpi,
      resume || null,
      studentRows[0].student_id,
     ],
    );
   } else {
    await connection.query(
     `INSERT INTO students (user_id, roll_number, branch, cpi, resume)
      VALUES (?, ?, ?, ?, ?)`,
     [userId, rollNumber || null, branch || null, parsedCpi, resume || null],
    );
   }
  } else {
   const [professorRows] = await connection.query(
    "SELECT professor_id FROM professors WHERE user_id = ? ORDER BY professor_id DESC LIMIT 1",
    [userId],
   );

   if (professorRows.length > 0) {
    await connection.query(
     "UPDATE professors SET department = ? WHERE professor_id = ?",
     [branch || null, professorRows[0].professor_id],
    );
   } else {
    await connection.query(
     "INSERT INTO professors (user_id, department) VALUES (?, ?)",
     [userId, branch || null],
    );
   }
  }

  await connection.commit();

  const profile = await getProfileByUserId(connection, userId);

  res.json({
   message: "Profile updated successfully.",
   user: profile,
  });
 } catch (error) {
  if (transactionStarted) {
   await connection.rollback();
  }
 console.error("Update Profile Error:", error);
 res.status(500).json({ message: "Unable to update profile right now." });
 }
};

exports.changePassword = async (req, res) => {
 const userId = Number.parseInt(req.user?.id, 10);
 const currentPassword =
  typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
 const newPassword =
  typeof req.body.newPassword === "string" ? req.body.newPassword : "";
 const confirmPassword =
  typeof req.body.confirmPassword === "string" ? req.body.confirmPassword : "";

 if (!userId) {
  return res.status(401).json({ message: "Invalid session." });
 }

 if (!currentPassword || !newPassword || !confirmPassword) {
  return res.status(400).json({
   message: "Current password, new password, and confirmation are required.",
  });
 }

 if (newPassword !== confirmPassword) {
  return res.status(400).json({ message: "New password and confirmation must match." });
 }

 if (!PASSWORD_REGEX.test(newPassword)) {
  return res.status(400).json({ message: PASSWORD_REQUIREMENTS_MESSAGE });
 }

 try {
  const connection = db.promise();
  const [rows] = await connection.query(
   "SELECT user_id, password FROM users WHERE user_id = ? LIMIT 1",
   [userId],
  );

  if (rows.length === 0) {
   return res.status(404).json({ message: "User not found." });
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
   return res.status(400).json({ message: "Current password is incorrect." });
  }

  const isSameAsExisting = await bcrypt.compare(newPassword, user.password);

  if (isSameAsExisting) {
   return res.status(400).json({
    message: "Choose a new password different from your current password.",
   });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await connection.query("UPDATE users SET password = ? WHERE user_id = ?", [
   hashedPassword,
   userId,
  ]);

  res.json({ message: "Password changed successfully." });
 } catch (error) {
  console.error("Change Password Error:", error);
  res.status(500).json({ message: "Unable to change password right now." });
 }
};

exports.deleteAccount = async (req, res) => {
 const requestUserId =
  Number.parseInt(req.body.userId, 10) || Number.parseInt(req.user?.id, 10);
 const authenticatedUserId = Number.parseInt(req.user?.id, 10);

 if (!requestUserId || requestUserId !== authenticatedUserId) {
  return res
   .status(403)
   .json({ message: "You can only delete your own account." });
 }

 const connection = db.promise();
 let transactionStarted = false;

 try {
  const [rows] = await connection.query(
   "SELECT user_id, role, name, email FROM users WHERE user_id = ? LIMIT 1",
   [requestUserId],
  );

  if (rows.length === 0) {
   return res.status(404).json({ message: "User not found." });
  }

  const user = rows[0];

  await connection.beginTransaction();
  transactionStarted = true;

  if (user.role === "professor") {
   await connection.query(
    `DELETE a
     FROM applications a
     INNER JOIN projects p ON a.project_id = p.id
     WHERE p.professor_id = ?`,
    [user.name],
   );
   await connection.query("DELETE FROM projects WHERE professor_id = ?", [
    user.name,
   ]);
   await connection.query(
    "UPDATE courses SET primary_professor_id = NULL WHERE primary_professor_id = ?",
    [requestUserId],
   );
  }

  await connection.query(
   `DELETE du
    FROM doubt_upvotes du
    INNER JOIN lecture_doubts ld ON du.doubt_id = ld.id
    WHERE ld.author_id = ?`,
   [requestUserId],
  );
  await connection.query(
   `DELETE child
    FROM lecture_doubts child
    INNER JOIN lecture_doubts parent ON child.parent_id = parent.id
    WHERE parent.author_id = ?`,
   [requestUserId],
  );
  await connection.query(
   `DELETE fv
    FROM feedback_votes fv
    INNER JOIN course_feedback cf ON fv.feedback_id = cf.feedback_id
    WHERE cf.user_id = ?`,
   [requestUserId],
  );
  await connection.query(
   `DELETE pv
    FROM post_votes pv
    INNER JOIN forum_posts fp ON pv.post_id = fp.id
    WHERE fp.author_id = ?`,
   [requestUserId],
  );
  await connection.query(
   `DELETE child
    FROM comments child
    INNER JOIN comments parent ON child.parent_id = parent.id
    WHERE parent.author_id = ?`,
   [requestUserId],
  );
  await connection.query(
   `DELETE c
    FROM comments c
    INNER JOIN forum_posts fp ON c.post_id = fp.id
    WHERE fp.author_id = ?`,
   [requestUserId],
  );
  await connection.query("DELETE FROM comments WHERE author_id = ?", [
   requestUserId,
  ]);
  await connection.query("DELETE FROM forum_posts WHERE author_id = ?", [
   requestUserId,
  ]);
  await connection.query("DELETE FROM feedback_votes WHERE user_id = ?", [
   String(requestUserId),
  ]);
  await connection.query("DELETE FROM post_votes WHERE user_id = ?", [
   String(requestUserId),
  ]);
  await connection.query("DELETE FROM applications WHERE user_id = ?", [
   requestUserId,
  ]);
  await connection.query("DELETE FROM course_feedback WHERE user_id = ?", [
   requestUserId,
  ]);
  await connection.query("DELETE FROM course_instructors WHERE user_id = ?", [
   requestUserId,
  ]);
  await connection.query("DELETE FROM course_enrollments WHERE student_id = ?", [
   requestUserId,
  ]);
  await connection.query(
   "DELETE FROM student_course_aliases WHERE student_id = ?",
   [requestUserId],
  );
  await connection.query("DELETE FROM lecture_feedback WHERE student_id = ?", [
   requestUserId,
  ]);
  await connection.query("DELETE FROM lecture_doubts WHERE author_id = ?", [
   requestUserId,
  ]);
  await connection.query("DELETE FROM doubt_upvotes WHERE user_id = ?", [
   requestUserId,
  ]);
  await connection.query("DELETE FROM student_courses WHERE user_id = ?", [
   requestUserId,
  ]);
  await connection.query("DELETE FROM students WHERE user_id = ?", [
   requestUserId,
  ]);
  await connection.query("DELETE FROM professors WHERE user_id = ?", [
   requestUserId,
  ]);
  await connection.query("DELETE FROM otp_codes WHERE email = ?", [user.email]);
  await connection.query("DELETE FROM users WHERE user_id = ?", [requestUserId]);

  await connection.commit();
  res.status(200).json({ message: "Account deleted successfully." });
 } catch (error) {
  if (transactionStarted) {
   await connection.rollback();
  }
  console.error("Delete Account Error:", error);
  res.status(500).json({ message: "Unable to delete account right now." });
 }
};
