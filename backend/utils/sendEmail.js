const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
 service: "gmail",

 auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
 },
});

async function sendOTP(email, otp) {
 await transporter.sendMail({
  from: process.env.EMAIL_USER,

  to: email,

  subject: "Campus Connect OTP Verification",

  text: `Hi, Your OTP is ${otp}. It expires in 5 minutes.`,
 });
}

module.exports = sendOTP;
