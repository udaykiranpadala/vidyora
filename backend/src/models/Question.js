import mongoose from "mongoose";

// A single test case for a coding question, with its own point value.
// isHidden=false ones are shown to the student as examples (for "Run").
// isHidden=true ones are only used at final "Submit" grading time.
const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: "" },
  expectedOutput: { type: String, required: true },
  points: { type: Number, required: true, default: 10 },
  isHidden: { type: Boolean, default: true },
});

const mcqOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
});

const questionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    type: {
      type: String,
      enum: ["mcq", "coding"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    statement: {
      type: String,
      required: true,
      // problem description / question text. Supports markdown.
    },
    timerSeconds: {
      type: Number,
      required: true,
      // organizer-set countdown for THIS question specifically
    },

    // ---- MCQ-specific fields ----
    options: [mcqOptionSchema], // only used when type === "mcq"

    // ---- Coding-specific fields ----
    allowedLanguages: {
      type: [String],
      enum: ["c", "cpp", "java", "python"],
      default: [],
    },
    starterCode: {
      // map of language -> boilerplate code, e.g. { python: "...", java: "..." }
      type: Map,
      of: String,
      default: {},
    },
    testCases: [testCaseSchema], // only used when type === "coding"

    totalPoints: {
      type: Number,
      required: true,
      // for MCQ: flat points for correct answer
      // for coding: should equal sum of testCases[].points (kept in sync by controller)
    },

    order: {
      type: Number,
      required: true,
      // position within the exam sequence
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
