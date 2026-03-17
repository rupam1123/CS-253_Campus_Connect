const express = require("express");
const router = express.Router();

const {
 sendOTP,
 verifyOTP,
 sendOTPForReset,
 resetPassword,
} = require("../controllers/otpController");

router.post("/send-otp", sendOTP);

router.post("/verify-otp", verifyOTP);
router.post("/send-reset-otp", sendOTPForReset);
router.post("/reset-password", resetPassword);

module.exports = router;
