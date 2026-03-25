// import mysql library so Node.js can talk to MySQL
const mysql = require("mysql2");

// load environment variables from .env file
require("dotenv").config();

// create a database connection using values stored in .env
const db = mysql.createConnection({
 host: process.env.DB_HOST,
 port: process.env.DB_PORT,
 user: process.env.DB_USER,
 password: process.env.DB_PASSWORD,
 database: process.env.DB_NAME,
 ssl: {
  rejectUnauthorized: false, // REQUIRED for Aiven
 },
});
db.connect((err) => {
 if (err) {
  console.error("❌ DB Connection Failed:", err);
 } else {
  console.log("✅ Connected to Aiven MySQL");
 }
});

// export the database connection so other files can use it
module.exports = db;
