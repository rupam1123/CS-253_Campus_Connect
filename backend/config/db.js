// import mysql library so Node.js can talk to MySQL
const mysql = require("mysql2");

// load environment variables from .env file
require("dotenv").config();

// create a database connection using values stored in .env
const db = mysql.createConnection({
 // MySQL server location
 host: process.env.DB_HOST,

 // MySQL username
 user: process.env.DB_USER,

 // MySQL password
 password: process.env.DB_PASSWORD,

 // database name we created earlier
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
