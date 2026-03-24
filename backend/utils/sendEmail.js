// const nodemailer = require("nodemailer");
// require("dotenv").config();

// const transporter = nodemailer.createTransport({
//  host: "smtp.gmail.com",
//  port: 587,
//  secure: false,
//  auth: {
//   user: process.env.EMAIL_USER,
//   pass: process.env.EMAIL_PASS,
//  },
// });

// async function sendOTP(email, otp) {
//  await transporter.sendMail({
//   from: process.env.EMAIL_USER,

//   to: email,

//   subject: "Campus Connect OTP Verification",

//   text: `Hi, Your OTP is ${otp}. It expires in 5 minutes.`,
//  });
// }

// module.exports = sendOTP;
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
 host: "smtp.gmail.com",
 port: 587,
 secure: false, // true for 465, false for other ports
 auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS, // Must be the 16-character Google App Password
 },
});

async function sendOTP(email, otp) {
 try {
  const info = await transporter.sendMail({
   from: `"Campus Connect" <${process.env.EMAIL_USER}>`,
   to: email,
   subject: "Campus Connect OTP Verification",
   text: `Hi, Your OTP is ${otp}. It expires in 5 minutes.`,
  });

  console.log(
   `✅ OTP sent successfully to ${email}. Message ID: ${info.messageId}`,
  );
  return true;
 } catch (error) {
  console.error("❌ Error sending OTP email:", error);
  // Throwing the error ensures your route handler knows it failed
  // and can send that 500 status code back to the frontend
  throw new Error("Failed to send OTP");
 }
}

module.exports = sendOTP;
