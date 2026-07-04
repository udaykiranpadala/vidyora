import mongoose from "mongoose";

// Stores OTPs temporarily during signup email verification.
// Auto-deletes itself after 10 minutes via the TTL index below.
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // 10 minutes in seconds - document auto-deletes after this
  },
});

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
