import mongoose from "mongoose";

// One answer record per question within an attempt.
const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  type: { type: String, enum: ["mcq", "coding"], required: true },

  // MCQ answer
  selectedOptionIndex: { type: Number, default: null },

  // Coding answer
  language: { type: String, default: null },
  code: { type: String, default: "" },
  testCaseResults: [
    {
      passed: { type: Boolean, default: false },
      pointsEarned: { type: Number, default: 0 },
    },
  ],

  pointsEarned: { type: Number, default: 0 },
  autoSubmitted: { type: Boolean, default: false }, // true if timer ran out
  timeTakenSeconds: { type: Number, default: 0 },
});

const attemptSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    candidateRollNumber: {
      type: String,
      default: "",
    },

    // Academic details — mandatory at join time
    candidateYear: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
      required: true,
    },
    candidateSection: {
      type: String,
      required: true,
      trim: true,
    },
    candidateBranch: {
      type: String,
      required: true,
      trim: true,
    },

    answers: [answerSchema],

    totalScore: {
      type: Number,
      default: 0,
    },
    totalTimeSeconds: {
      type: Number,
      default: 0,
      // used as leaderboard tiebreaker - lower is better
    },

    // ---- Anti-cheat tracking ----
    tabSwitchCount: { type: Number, default: 0 },
    fullscreenExitCount: { type: Number, default: 0 },
    pasteAttemptCount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },

    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    questionRemainingTimes: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

const Attempt = mongoose.model("Attempt", attemptSchema);
export default Attempt;
