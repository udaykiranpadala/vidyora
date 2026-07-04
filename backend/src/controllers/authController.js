import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import Organizer from "../models/Organizer.js";
import Otp from "../models/Otp.js";
import { sendOtpEmail, sendResetOtpEmail } from "../utils/email.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateSixDigitOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (organizerId) =>
  jwt.sign({ organizerId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// STEP 1: Candidate organizer enters email -> we send an OTP
export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existing = await Organizer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists. Please log in instead." });
    }

    const otp = generateSixDigitOtp();

    // Remove any previous unused OTPs for this email, then store the fresh one
    await Otp.deleteMany({ email: email.toLowerCase() });
    await Otp.create({ email: email.toLowerCase(), otp });

    await sendOtpEmail(email, otp);

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// STEP 2: Organizer enters the OTP -> we verify it (but don't create account yet)
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const record = await Otp.findOne({ email: email.toLowerCase(), otp });
    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark verified by deleting the OTP (one-time use) - frontend will now
    // show the username/password setup form, and pass a short-lived signal forward.
    await Otp.deleteOne({ _id: record._id });

    res.json({ message: "Email verified", verified: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

// STEP 3: Organizer sets username + password -> account is actually created
export const completeSignup = async (req, res) => {
  try {
    const { email, username, password, collegeName } = req.body;
    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ message: "Email, username, and password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingEmail = await Organizer.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const existingUsername = await Organizer.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const organizer = await Organizer.create({
      email: email.toLowerCase(),
      username,
      passwordHash,
      collegeName: collegeName || "",
      isEmailVerified: true,
    });

    const token = signToken(organizer._id);

    res.status(201).json({
      message: "Account created successfully",
      token,
      organizer: {
        id: organizer._id,
        email: organizer.email,
        username: organizer.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create account" });
  }
};

// Regular login for returning organizers
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const organizer = await Organizer.findOne({
      $or: [
        { username: username },
        { email: username.toLowerCase() }
      ]
    });
    if (!organizer) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (!organizer.passwordHash) {
      return res.status(401).json({
        message: "This account uses Google sign-in. Please log in with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, organizer.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = signToken(organizer._id);

    res.json({
      message: "Login successful",
      token,
      organizer: {
        id: organizer._id,
        email: organizer.email,
        username: organizer.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to log in" });
  }
};

const generateUniqueUsername = async (base) => {
  const sanitized = base.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) || "user";
  let candidate = sanitized;
  let suffix = 1;
  while (await Organizer.findOne({ username: candidate })) {
    candidate = `${sanitized}${suffix}`;
    suffix += 1;
  }
  return candidate;
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ message: "Google sign-in is not configured on the server" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    let organizer = await Organizer.findOne({ googleId });
    if (!organizer) {
      organizer = await Organizer.findOne({ email: email.toLowerCase() });
      if (organizer) {
        organizer.googleId = googleId;
        organizer.isEmailVerified = true;
        await organizer.save();
      } else {
        const username = await generateUniqueUsername(
          name?.split(" ")[0] || email.split("@")[0]
        );
        organizer = await Organizer.create({
          email: email.toLowerCase(),
          username,
          googleId,
          isEmailVerified: true,
          passwordHash: "",
        });
      }
    }

    const token = signToken(organizer._id);

    res.json({
      message: "Login successful",
      token,
      organizer: {
        id: organizer._id,
        email: organizer.email,
        username: organizer.username,
        collegeName: organizer.collegeName || "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Google sign-in failed. Please try again." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, collegeName, newPassword, confirmPassword } = req.body;
    const updateData = {};
    if (username) updateData.username = username;
    if (collegeName !== undefined) updateData.collegeName = collegeName;

    if (newPassword) {
      if (!confirmPassword || newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      updateData.passwordHash = passwordHash;
    }

    // Check if username is already taken by someone else
    if (username) {
      const existing = await Organizer.findOne({ username, _id: { $ne: req.organizerId } });
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }
    }

    const organizer = await Organizer.findByIdAndUpdate(
      req.organizerId,
      updateData,
      { new: true }
    );

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    res.json({
      message: "Profile updated successfully",
      organizer: {
        id: organizer._id,
        email: organizer.email,
        username: organizer.username,
        collegeName: organizer.collegeName || "",
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile settings" });
  }
};

export const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const organizer = await Organizer.findOne({ email: email.toLowerCase() });
    if (!organizer) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const otp = generateSixDigitOtp();

    // Clear previous unused OTPs for this email, then store the fresh one
    await Otp.deleteMany({ email: email.toLowerCase() });
    await Otp.create({ email: email.toLowerCase(), otp });

    await sendResetOtpEmail(email, otp);

    res.json({ message: "Reset OTP sent to your registered email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send reset OTP" });
  }
};

export const forgotPasswordReset = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Email, OTP, new password and confirmation are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const record = await Otp.findOne({ email: email.toLowerCase(), otp });
    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const organizer = await Organizer.findOneAndUpdate(
      { email: email.toLowerCase() },
      { passwordHash },
      { new: true }
    );

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Delete verified OTP
    await Otp.deleteOne({ _id: record._id });

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
