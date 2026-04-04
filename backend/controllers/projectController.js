const db = require("../config/db");
const nodemailer = require("nodemailer");
require("dotenv").config();

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");
const isValidCpi = (value) =>
 Number.isFinite(value) && value >= 0 && value <= 10;
// Create a new project
exports.createProject = async (req, res) => {
 try {
 const {
  title,
  department,
  program,
  min_cpi,
  team_size,
  skills,
   duration,
   description,
   professor_id,
  } = req.body;
  const normalizedCpi = Number.parseFloat(min_cpi) || 0;

  if (!title || !description || !professor_id) {
   return res.status(400).json({
    message: "Project title, description, and professor are required.",
   });
  }

  if (!isValidCpi(normalizedCpi)) {
   return res.status(400).json({
    message: "Minimum CPI must stay between 0 and 10.",
   });
  }

  const query = `
      INSERT INTO projects 
      (title, department, program, min_cpi, team_size, skills, duration, description, professor_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const [result] = await db
   .promise()
   .query(query, [
    normalizeText(title),
    normalizeText(department),
    normalizeText(program),
    normalizedCpi,
    normalizeText(team_size),
    normalizeText(skills),
    normalizeText(duration),
    normalizeText(description),
    normalizeText(professor_id),
   ]);

  res.status(201).json({
   message: "Project created successfully",
   projectId: result.insertId,
  });
 } catch (error) {
  res
   .status(500)
   .json({ error: "Failed to create project", details: error.message });
 }
};

// Get all projects
// Get all projects
exports.getAllProjects = async (req, res) => {
 try {
  const requestedUserId = Number.parseInt(req.query.userId, 10) || null;
  const query = `
    SELECT p.*,
    (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id AND a.status = 'pending') AS applicant_count,
    ua.status AS application_status,
    ua.created_at AS application_created_at
    FROM projects p
    LEFT JOIN applications ua
      ON ua.project_id = p.id AND ua.user_id = ?
    ORDER BY p.id DESC 
  `;
  const [projects] = await db.promise().query(query, [requestedUserId]);
  res.status(200).json(projects);
 } catch (error) {
  console.log("Error in getAllProjects:", error);
  res.status(500).json({ message: "Server error" });
 }
};
// Get a single project by ID
// Get projects ONLY for a specific professor
exports.getProjectsByProfessor = async (req, res) => {
 try {
  const { profName } = req.params; // Changed variable to profName

  const query = `
    SELECT p.*, 
    (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id AND a.status = 'pending') AS applicant_count 
    FROM projects p
    WHERE p.professor_id = ?
    ORDER BY p.id DESC 
  `;

  const [projects] = await db.promise().query(query, [profName]);
  res.status(200).json(projects);
 } catch (error) {
  console.error("Error in getProjectsByProfessor:", error);
  res.status(500).json({ message: "Server error" });
 }
};

// Update a project
exports.updateProject = async (req, res) => {
 try {
  const { id } = req.params;
  const {
   title,
   department,
   program,
   min_cpi,
   team_size,
  skills,
  duration,
  description,
  professor_id,
  } = req.body;
  const normalizedCpi = Number.parseFloat(min_cpi) || 0;

  if (!title || !description || !professor_id) {
   return res.status(400).json({
    message: "Project title, description, and professor are required.",
   });
  }

  if (!isValidCpi(normalizedCpi)) {
   return res.status(400).json({
    message: "Minimum CPI must stay between 0 and 10.",
   });
  }

  const query = `
      UPDATE projects SET 
      title = ?, department = ?, program = ?, min_cpi = ?, 
      team_size = ?, skills = ?, duration = ?, description = ?, professor_id = ? 
      WHERE id = ?
    `;

  const [result] = await db
   .promise()
   .query(query, [
    normalizeText(title),
    normalizeText(department),
    normalizeText(program),
    normalizedCpi,
    normalizeText(team_size),
    normalizeText(skills),
    normalizeText(duration),
    normalizeText(description),
    normalizeText(professor_id),
    id,
   ]);

  if (result.affectedRows === 0) {
   return res.status(404).json({ message: "Project not found" });
  }

  res.status(200).json({ message: "Project updated successfully" });
 } catch (error) {
  res
   .status(500)
   .json({ error: "Failed to update project", details: error.message });
 }
};

// Delete a project
exports.deleteProject = async (req, res) => {
 try {
  const { id } = req.params;
  const [result] = await db
   .promise()
   .query("DELETE FROM projects WHERE id = ?", [id]);

  if (result.affectedRows === 0) {
   return res.status(404).json({ message: "Project not found" });
  }

  res.status(200).json({ message: "Project deleted successfully" });
 } catch (error) {
  res
   .status(500)
   .json({ error: "Failed to delete project", details: error.message });
 }
};

exports.getApplicationsByProject = async (req, res) => {
 try {
  const { project_id } = req.params;

  const query = `
    SELECT
      application_id,
      project_id,
      user_id,
      full_name,
      roll_no,
      branch,
      cpi,
      email_id,
      resume,
      sop,
      status,
      created_at
    FROM applications
    WHERE project_id = ?
    ORDER BY created_at DESC
  `;

  // Use await instead of a callback!
  const [results] = await db.promise().query(query, [project_id]);

  res.status(200).json(results);
 } catch (error) {
  console.error("Error fetching applications:", error);
  res.status(500).json({ message: "Error fetching applications" });
 }
};
exports.updateApplicationStatus = async (req, res) => {
 try {
  // Extract the new variables from the frontend request
  const { application_id, status, email, name, projectTitle, profName } =
   req.body;
  const normalizedStatus = normalizeText(status).toLowerCase();

  if (
   !application_id ||
   !["accepted", "rejected", "pending"].includes(normalizedStatus)
  ) {
   return res.status(400).json({ message: "Invalid application status update." });
  }

  const query = `
    UPDATE applications 
    SET status = ? 
    WHERE application_id = ?
  `;

  // Await the DB update
  await db.promise().query(query, [normalizedStatus, application_id]);

  // ================= EMAIL PART =================
  try {
   if (!email) {
    return res.json({ message: "Status updated successfully." });
   }

   const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
     user: process.env.EMAIL_USER,
     pass: process.env.EMAIL_PASS,
    },
   });

   // Constructing a more professional, multi-line email
   const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Application Update: ${projectTitle}`,
    text: `Dear ${name},\n\nWe are writing to inform you that the status of your application for the project "${projectTitle}" under Professor ${profName} has been updated.\n\nYour application is currently marked as: ${normalizedStatus.toUpperCase()}.\n\nThank you for your interest and effort.\n\nBest regards,\nCampus Connect Platform`,
   };

   await transporter.sendMail(mailOptions);
   res.json({ message: "Status updated + email sent" });
  } catch (emailErr) {
   console.error("Email failed to send:", emailErr);
   res.json({ message: "Status updated but email notification failed." });
  }
 } catch (err) {
  console.error("DB update failed:", err);
  res.status(500).json({ message: "Database update failed." });
 }
};
