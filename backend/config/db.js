// import mysql library so Node.js can talk to MySQL
const mysql = require("mysql2");

// load environment variables from .env file
require("dotenv").config();

// create a database connection using values stored in .env
const db = mysql.createConnection({
 host: process.env.DB_HOST,
 port: process.env.DB_PORT, // 🔥 IMPORTANT
 user: process.env.DB_USER,
 password: process.env.DB_PASSWORD,
 database: process.env.DB_NAME,
});

// attempt to connect to MySQL
db.connect((err) => {
 // if connection fails
 if (err) {
  console.log("Database connection failed", err);
 }

 // if connection successful
 else {
  console.log("MySQL Connected");
 }
});

// export the database connection so other files can use it
module.exports = db;
