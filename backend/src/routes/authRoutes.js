import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  requestOtp,
  verifyOtp,
  completeSignup,
  login,
  googleLogin,
  updateProfile,
  forgotPasswordRequest,
  forgotPasswordReset,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup/request-otp", requestOtp);
router.post("/signup/verify-otp", verifyOtp);
router.post("/signup/complete", completeSignup);
router.post("/login", login);
router.post("/google", googleLogin);
router.patch("/profile", requireAuth, updateProfile);
router.post("/forgot-password-request", forgotPasswordRequest);
router.post("/forgot-password-reset", forgotPasswordReset);

export default router;
