const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.loginUser = async (req, res) => {
 const { email, password } = req.body;

 // 1. NEW: Check if inputs actually exist before doing anything
 if (!email || !password) {
  return res
   .status(400)
   .json({ message: "Please provide both email and password" });
 }

 try {
  const checkQuery = "SELECT * FROM users WHERE email = ?";
  const [rows] = await db.promise().query(checkQuery, [email]);

  // 2. CHANGED: Generic error message to prevent email guessing
  if (rows.length === 0) {
   return res.status(400).json({ message: "Invalid email or password" });
  }

  const user = rows[0];

  const isMatch = await bcrypt.compare(password, user.password);

  // 3. CHANGED: Match the error message from above
  if (!isMatch) {
   return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, {
   expiresIn: "7d",
  });

  res.json({
   token,
   user: {
    id: user.user_id,
    email: user.email,
    role: user.role,
    name: user.name,
   },
  });
 } catch (error) {
  console.error("Login Error: ", error);
  // Kept your custom 500 message
  res.status(500).json({ message: "Server11 error" });
 }
};
