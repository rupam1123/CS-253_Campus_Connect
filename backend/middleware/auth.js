const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
 const authHeader = req.headers.authorization || "";

 if (!authHeader.startsWith("Bearer ")) {
  return res.status(401).json({ message: "Authorization required." });
 }

 const token = authHeader.slice(7);

 try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
 } catch (error) {
  return res.status(401).json({ message: "Invalid or expired token." });
 }
};
