const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

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

const {
 changePassword,
 deleteAccount,
 getProfile,
 loginUser,
 updateProfile,
} = require("../controllers/authController");

// ======================
// ROUTES
// ======================
router.post("/login", loginUser);
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);
router.put("/change-password", auth, changePassword);
router.delete("/delete-account", auth, deleteAccount);

module.exports = router;
