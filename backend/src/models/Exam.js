import mongoose from "mongoose";

const exam = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizer",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    accessCode: {
      type: String,
      required: true,
      unique: true,
      // short shareable code, e.g. "X7K9PQ" - this is how students join
    },
    // Ordered list of question references - order matters since exam is sequential
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    isLeaderboardPublished: {
      type: Boolean,
      default: false,
    },
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
    settings: {
      // General Settings
      duration: { type: Number, default: 60 }, // minutes
      password: { type: String, default: "" },
      examVisibility: { type: String, default: "public" }, // public, private
      registrationEnabled: { type: Boolean, default: true },
      resultPublishTime: { type: Date, default: null },
      singleQuestionMode: { type: Boolean, default: false },
      enablePerQuestionTimer: { type: Boolean, default: false },
      questionListDisplayFormat: { type: String, default: "number_title_points" },
      showTimerInQuestionList: { type: Boolean, default: true },

      // Question Settings
      showQuestionNumbers: { type: Boolean, default: true },
      showQuestionTitles: { type: Boolean, default: true },
      showMarks: { type: Boolean, default: true },
      showNegativeMarks: { type: Boolean, default: true },
      showDifficulty: { type: Boolean, default: true },
      showTopic: { type: Boolean, default: true },
      showSampleExplanation: { type: Boolean, default: true },
      showSampleTestCases: { type: Boolean, default: true },
      allowPreviousQuestion: { type: Boolean, default: true },
      allowNextQuestion: { type: Boolean, default: true },
      sequentialNavigation: { type: Boolean, default: false },
      randomNavigation: { type: Boolean, default: true },
      shuffleMcqs: { type: Boolean, default: false },
      shuffleOptions: { type: Boolean, default: false },
      lockQuestions: { type: Boolean, default: false },
      allowQuestionReview: { type: Boolean, default: true },

      // Coding Settings
      allowedLanguages: { type: [String], default: ["python", "java", "cpp", "c"] },
      allowRunCode: { type: Boolean, default: true },
      allowCustomInput: { type: Boolean, default: true },
      visibleTestCases: { type: Boolean, default: true },
      hiddenTestCases: { type: Boolean, default: false },
      timeLimit: { type: Number, default: 5 }, // seconds
      memoryLimit: { type: Number, default: 256 }, // MB
      partialScoring: { type: Boolean, default: true },

      // Security Settings
      enableFullScreen: { type: Boolean, default: true },
      disableCopy: { type: Boolean, default: true },
      disablePaste: { type: Boolean, default: true },
      disableRightClick: { type: Boolean, default: true },
      disableRefresh: { type: Boolean, default: false },
      warningLimit: { type: Number, default: 3 },
      autoSubmit: { type: Boolean, default: true },

      // Result Settings
      showScoreImmediately: { type: Boolean, default: true },
      hideScore: { type: Boolean, default: false },
      showTestCases: { type: Boolean, default: true },
      hideTestCases: { type: Boolean, default: false },
      showRank: { type: Boolean, default: true },
      hideRank: { type: Boolean, default: false },
      showLeaderboard: { type: Boolean, default: true },

      // Pre-Exam Instructions Configurator
      instructions: [
        {
          id: { type: String },
          category: { type: String, default: "General Rule" },
          title: { type: String },
          description: { type: String },
          enabled: { type: Boolean, default: true },
          icon: { type: String, default: "📜" },
        },
      ],

      // Optional Per-Exam Landing Page Configuration
      landingPage: {
        enabled: { type: Boolean, default: false },
        eventName: { type: String, default: "COMPUTER SOCIETY OF INDIA" },
        eventTitle: { type: String, default: "CSI ROUND 3" },
        logo: { type: String, default: "/csi-logo.png" },
        mainHeading: { type: String, default: "CONGRATULATIONS, CODER!" },
        subHeading: { type: String, default: "YOU'VE MADE IT TO ROUND 3" },
        description: { type: String, default: "You successfully cleared Round 2 and earned your place in the next stage of the CSI Selection Process." },
        motivationalHeading: { type: String, default: "YOU EARNED YOUR SPOT. NOW MAKE IT COUNT." },
        challengeLabel: { type: String, default: "ROUND 3 — CODING CHALLENGE" },
        tagline: { type: String, default: "THINK • CODE • SOLVE • CONQUER" },
        primaryButtonText: { type: String, default: "ENTER ROUND 3 →" },
        footerText: { type: String, default: "Best of luck! Give it your best shot." },
        theme: {
          primaryColor: { type: String, default: "#0052cc" },
          secondaryColor: { type: String, default: "#002b66" },
          backgroundColor: { type: String, default: "#0a192f" },
        },
        journey: {
          enabled: { type: Boolean, default: true },
          stages: [
            {
              label: { type: String, default: "" },
              status: { type: String, default: "upcoming" },
            },
          ],
        },
        pillars: {
          enabled: { type: Boolean, default: true },
          items: [
            {
              icon: { type: String, default: "🧠" },
              title: { type: String, default: "LOGIC" },
              description: { type: String, default: "Problem Solving" },
            },
          ],
        },
      },
    },
  },
  { timestamps: true }
);

exam.index({ organizer: 1, createdAt: -1 });

const Exam = mongoose.model("Exam", exam);
export default Exam;
