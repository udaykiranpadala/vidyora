import mongoose from "mongoose";

const organizerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    collegeName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Organizer = mongoose.model("Organizer", organizerSchema);
export default Organizer;
