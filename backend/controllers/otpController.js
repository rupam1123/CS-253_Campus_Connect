const db = require("../config/db");
const generateOTP = require("../utils/generateOTP");
const sendOTP = require("../utils/sendEmail");
const bcrypt = require("bcrypt");
exports.sendOTP = (req, res) => {
 const { email } = req.body;

 // ======================
 // VALIDATION
 // ======================
 if (!email) {
  return res.status(400).json({ message: "Email is required" });
 }

 // ======================
 // CHECK IF USER ALREADY EXISTS
 // ======================
 const checkQuery = "SELECT * FROM users WHERE email = ?";

 db.query(checkQuery, [email], (err, result) => {
  if (err) {
   console.error(err);
   return res.status(500).json({ message: "Database error" });
  }

  if (result.length > 0) {
   return res.status(400).json({ message: "Email already registered" });
  }

  // ======================
  // GENERATE OTP
  // ======================
  const otp = generateOTP();

  // Expiry: 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // ======================
  // DELETE OLD OTP (IF EXISTS)
  // ======================
  const deleteQuery = "DELETE FROM otp_codes WHERE email = ?";

  db.query(deleteQuery, [email], (err) => {
   if (err) {
    console.error(err);
    return res.status(500).json({ message: "Error clearing old OTP" });
   }

   // ======================
   // STORE NEW OTP
   // ======================
   const insertQuery =
    "INSERT INTO otp_codes (email, otp, expires_at) VALUES (?, ?, ?)";

   db.query(insertQuery, [email, otp, expiresAt], async (err) => {
    if (err) {
     console.error(err);
     return res.status(500).json({ message: "Error saving OTP" });
    }

    try {
     // ======================
     // SEND EMAIL
     // ======================
     await sendOTP(email, otp);

     return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
     console.error(error);
     return res.status(500).json({ message: "Email sending failed" });
    }
   });
  });
 });
};
exports.verifyOTP = async (req, res) => {
 const { name, email, password, role, otp } = req.body;

 // ======================
 // VALIDATION
 // ======================
 if (!name || !email || !password || !role || !otp) {
  return res.status(400).json({ message: "All fields are required" });
 }

 try {
  // ======================
  // CHECK OTP FROM DB
  // ======================
  const query = "SELECT * FROM otp_codes WHERE email = ?";

  db.query(query, [email], async (err, result) => {
   if (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
   }

   if (result.length === 0) {
    return res.status(400).json({ message: "OTP not found" });
   }

   const storedOTP = result[0].otp;
   const expiresAt = result[0].expires_at;

   // ======================
   // CHECK EXPIRY
   // ======================
   if (new Date() > new Date(expiresAt)) {
    return res.status(400).json({ message: "OTP expired" });
   }

   // ======================
   // VERIFY OTP
   // ======================
   if (storedOTP !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
   }

   // ======================
   // HASH PASSWORD
   // ======================
   const hashedPassword = await bcrypt.hash(password, 10);

   // ======================
   // INSERT USER
   // ======================
   const insertUserQuery =
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

   db.query(
    insertUserQuery,
    [name, email, hashedPassword, role.toLowerCase()],
    (err, userResult) => {
     if (err) {
      console.error(err);
      return res.status(500).json({ message: "User creation failed" });
     }

     const userId = userResult.insertId;

     // ======================
     // ROLE BASED INSERT
     // ======================
     if (role.toLowerCase() === "student") {
      const studentQuery = "INSERT INTO students (user_id) VALUES (?)";

      db.query(studentQuery, [userId]);
     } else if (role.toLowerCase() === "professor") {
      const professorQuery = "INSERT INTO professors (user_id) VALUES (?)";

      db.query(professorQuery, [userId]);
     }

     // ======================
     // DELETE OTP AFTER SUCCESS
     // ======================
     db.query("DELETE FROM otp_codes WHERE email = ?", [email]);

     return res.status(201).json({
      message: "User registered successfully",
     });
    },
   );
  });
 } catch (error) {
  console.error(error);
  res.status(500).json({ message: "Server error" });
 }
};
// ======================
// SEND OTP FOR RESET PASSWORD
// ======================
exports.sendOTPForReset = (req, res) => {
 const { email } = req.body;

 if (!email) {
  return res.status(400).json({ message: "Email is required" });
 }

 // CHECK USER EXISTS
 const checkQuery = "SELECT * FROM users WHERE email = ?";

 db.query(checkQuery, [email], (err, result) => {
  if (err) return res.status(500).json({ message: "DB error" });

  if (result.length === 0) {
   return res.status(400).json({ message: "User not found" });
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // delete old OTP
  db.query("DELETE FROM otp_codes WHERE email = ?", [email]);

  // insert new OTP
  db.query(
   "INSERT INTO otp_codes (email, otp, expires_at) VALUES (?, ?, ?)",
   [email, otp, expiresAt],
   async (err) => {
    if (err) return res.status(500).json({ message: "DB error" });

    await sendOTP(email, otp);

    res.json({ message: "OTP sent for password reset" });
   },
  );
 });
};
// ======================
// RESET PASSWORD CONTROLLER
// ======================
exports.resetPassword = async (req, res) => {
 const { email, otp, newPassword } = req.body;

 if (!email || !otp || !newPassword) {
  return res.status(400).json({ message: "All fields required" });
 }

 // CHECK OTP
 const query = "SELECT * FROM otp_codes WHERE email = ?";

 db.query(query, [email], async (err, result) => {
  if (err) return res.status(500).json({ message: "DB error" });

  if (result.length === 0) {
   return res.status(400).json({ message: "OTP not found" });
  }

  const storedOTP = result[0].otp;
  const expiresAt = result[0].expires_at;

  // CHECK EXPIRY
  if (new Date() > new Date(expiresAt)) {
   return res.status(400).json({ message: "OTP expired" });
  }

  // VERIFY OTP
  if (storedOTP !== otp) {
   return res.status(400).json({ message: "Invalid OTP" });
  }

  // HASH NEW PASSWORD
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // UPDATE PASSWORD
  db.query(
   "UPDATE users SET password = ? WHERE email = ?",
   [hashedPassword, email],
   (err) => {
    if (err) return res.status(500).json({ message: "Update failed" });

    // DELETE OTP
    db.query("DELETE FROM otp_codes WHERE email = ?", [email]);

    res.json({ message: "Password reset successful" });
   },
  );
 });
};
