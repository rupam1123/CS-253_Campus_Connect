const db = require("../config/db");
const nodemailer = require("nodemailer");
require("dotenv").config();
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

  const query = `
      INSERT INTO projects 
      (title, department, program, min_cpi, team_size, skills, duration, description, professor_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const [result] = await db
   .promise()
   .query(query, [
    title,
    department,
    program,
    min_cpi,
    team_size,
    skills,
    duration,
    description,
    professor_id,
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
exports.getAllProjects = async (req, res) => {
 try {
  const [projects] = await db.promise().query("SELECT * FROM projects");
  res.status(200).json(projects);
 } catch (error) {
  // THIS LINE will print the exact problem in your terminal!
  console.log("Error in getAllProjects:", error);
  res.status(500).json({ message: "Server error" });
 }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
 try {
  const { id } = req.params;
  const [project] = await db
   .promise()
   .query("SELECT * FROM projects WHERE id = ?", [id]);

  if (project.length === 0) {
   return res.status(404).json({ message: "Project not found" });
  }

  res.status(200).json(project[0]);
 } catch (error) {
  res
   .status(500)
   .json({ error: "Failed to retrieve project", details: error.message });
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

  const query = `
      UPDATE projects SET 
      title = ?, department = ?, program = ?, min_cpi = ?, 
      team_size = ?, skills = ?, duration = ?, description = ?, professor_id = ? 
      WHERE id = ?
    `;

  const [result] = await db
   .promise()
   .query(query, [
    title,
    department,
    program,
    min_cpi,
    team_size,
    skills,
    duration,
    description,
    professor_id,
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
  const [result] = await db.query("DELETE FROM projects WHERE id = ?", [id]);

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

exports.getApplicationsByProject = (req, res) => {
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

 db.query(query, [project_id], (err, results) => {
  if (err) {
   console.error(err);
   return res.status(500).json({ message: "Error fetching applications" });
  }

  res.status(200).json(results);
 });
};

exports.updateApplicationStatus = (req, res) => {
 const { application_id, status, email, name } = req.body;
 //console.log(req.body);
 const query = `
    UPDATE applications 
    SET status = ? 
    WHERE application_id = ?
  `;

 db.query(query, [status, application_id], async (err, result) => {
  if (err) {
   console.error(err);
   return res.status(500).json({ message: "DB update failed" });
  }

  // ================= EMAIL PART =================
  try {
   const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
     user: process.env.EMAIL_USER,
     pass: process.env.EMAIL_PASS,
    },
   });

   const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Application ${status.toUpperCase()}`,
    text: `Hello ${name}, your application has been ${status}.`,
   };

   await transporter.sendMail(mailOptions);

   res.json({ message: "Status updated + email sent" });
  } catch (emailErr) {
   console.error(emailErr);
   res.json({ message: "Status updated but email failed" });
  }
 });
};
