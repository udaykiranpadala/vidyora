import Exam from "../models/Exam.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import { runAgainstTestCases } from "../utils/judge0.js";

// STEP 1: Candidate enters access code + name -> starts (or resumes) an attempt
export const joinExam = async (req, res) => {
  try {
    const { accessCode } = req.params;
    const { candidateName, candidateRollNumber, password, candidateYear, candidateSection, candidateBranch } = req.body;

    if (!candidateName || !candidateName.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!candidateYear) {
      return res.status(400).json({ message: "Year is required" });
    }
    if (!candidateSection || !candidateSection.trim()) {
      return res.status(400).json({ message: "Section is required" });
    }
    if (!candidateBranch || !candidateBranch.trim()) {
      return res.status(400).json({ message: "Branch is required" });
    }

    const exam = await Exam.findOne({ accessCode: accessCode.toUpperCase() });
    if (!exam) {
      return res.status(404).json({ message: "Invalid exam code" });
    }
    if (!exam.isPublished) {
      return res.status(403).json({ message: "This exam has not been published yet" });
    }
    if (exam.isClosed || (exam.endAt && new Date() > new Date(exam.endAt))) {
      return res.status(403).json({ message: "This exam has closed" });
    }
    // Verify Password if required by the organizer
    const settings = exam.settings || {};
    if (settings.password && settings.password.trim() !== "") {
      if (!password || password.trim() !== settings.password.trim()) {
        return res.status(401).json({ message: "Incorrect exam password. Please request it from the organizer." });
      }
    }

    // Verify Student Roster if restricted
    if (settings.roster && Array.isArray(settings.roster) && settings.roster.length > 0) {
      const isAllowed = settings.roster.some(item => 
        (candidateRollNumber && candidateRollNumber.trim().toLowerCase() === item.toLowerCase()) ||
        (candidateName && candidateName.trim().toLowerCase() === item.toLowerCase())
      );
      if (!isAllowed) {
        return res.status(403).json({ message: "Access Restricted: Your name or roll number is not listed in the enrolled student roster." });
      }
    }

    const questions = await Question.find({ exam: exam._id }).sort({ order: 1 });
    if (questions.length === 0) {
      return res.status(400).json({ message: "This exam has no questions yet" });
    }

    // Reuse or create attempt if candidate re-joins with the same roll number and name
    let attempt;
    if (candidateRollNumber && candidateRollNumber.trim() !== "") {
      attempt = await Attempt.findOne({
        exam: exam._id,
        candidateRollNumber: candidateRollNumber.trim(),
        candidateName: candidateName.trim(),
        status: "in_progress"
      });
    }

    if (!attempt) {
      const remainingTimes = {};
      questions.forEach((q) => {
        remainingTimes[q._id.toString()] = q.timerSeconds;
      });

      attempt = await Attempt.create({
        exam: exam._id,
        candidateName: candidateName.trim(),
        candidateRollNumber: candidateRollNumber?.trim() || "",
        candidateYear,
        candidateSection: candidateSection.trim(),
        candidateBranch: candidateBranch.trim(),
        questionRemainingTimes: remainingTimes,
      });
    }

    res.status(201).json({
      attemptId: attempt._id,
      examTitle: exam.title,
      totalQuestions: questions.length,
      settings: exam.settings || {},
      startedAt: attempt.startedAt,
      startAt: exam.startAt,
      endAt: exam.endAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to join exam" });
  }
};

// Helper - shapes a question for the test-taker, hiding answer-revealing fields
const sanitizeQuestionForCandidate = (question) => {
  const base = {
    _id: question._id,
    type: question.type,
    title: question.title,
    statement: question.statement,
    timerSeconds: question.timerSeconds,
    totalPoints: question.totalPoints,
  };

  if (question.type === "mcq") {
    return {
      ...base,
      options: question.options.map((o) => ({ text: o.text })), // isCorrect stripped
    };
  }

  // coding - only expose non-hidden (sample) test cases, never the hidden ones
  return {
    ...base,
    allowedLanguages: question.allowedLanguages,
    starterCode: question.starterCode,
    sampleTestCases: question.testCases
      .filter((tc) => !tc.isHidden)
      .map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput, points: tc.points })),
  };
};

// Get the question at a given index (0-based) for this attempt
export const getQuestionForAttempt = async (req, res) => {
  try {
    const { attemptId, index } = req.params;
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    if (attempt.status === "completed") {
      return res.status(403).json({ message: "This exam attempt is already complete" });
    }

    const exam = await Exam.findById(attempt.exam).lean();
    if (exam && exam.endAt && new Date() > new Date(exam.endAt)) {
      attempt.status = "completed";
      attempt.completedAt = new Date();
      await attempt.save({ validateBeforeSave: false });
      return res.status(403).json({ message: "This exam has ended" });
    }

    if (exam && exam.startAt && new Date() < new Date(exam.startAt)) {
      return res.status(403).json({ message: "This exam has not started yet" });
    }

    const idx = parseInt(index, 10);

    // Optimize: Fetch only the specific question by order, plus lightweight metadata for all questions
    const [currentQuestion, allQuestions, totalQuestionsCount] = await Promise.all([
      Question.findOne({ exam: attempt.exam, order: idx }),
      Question.find({ exam: attempt.exam })
        .select("_id type title order totalPoints timerSeconds")
        .sort({ order: 1 })
        .lean(),
      Question.countDocuments({ exam: attempt.exam })
    ]);

    if (!currentQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({
      question: sanitizeQuestionForCandidate(currentQuestion),
      questionIndex: idx,
      totalQuestions: totalQuestionsCount,
      settings: exam?.settings || {},
      startedAt: attempt.startedAt,
      endAt: exam?.endAt,
      questionList: allQuestions,
      questionRemainingTimes: (attempt.questionRemainingTimes instanceof Map)
        ? Object.fromEntries(attempt.questionRemainingTimes)
        : (attempt.questionRemainingTimes || {}),
      answers: attempt.answers.map((a) => ({
        question: a.question,
        type: a.type,
        selectedOptionIndex: a.selectedOptionIndex,
        language: a.language,
        code: a.code,
        pointsEarned: a.pointsEarned,
      })),
      tabSwitchCount: attempt.tabSwitchCount || 0,
      fullscreenExitCount: attempt.fullscreenExitCount || 0,
      pasteAttemptCount: attempt.pasteAttemptCount || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load question" });
  }
};

// Run code against SAMPLE test cases only (instant feedback, not graded)
export const runCode = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, code, language, customInput } = req.body;

    const attempt = await Attempt.findById(attemptId);
    if (!attempt || attempt.status === "completed") {
      return res.status(403).json({ message: "Attempt not available" });
    }

    const question = await Question.findById(questionId);
    if (!question || question.type !== "coding") {
      return res.status(404).json({ message: "Coding question not found" });
    }
    if (!question.allowedLanguages.includes(language)) {
      return res.status(400).json({ message: "Language not allowed for this question" });
    }

    let testCasesToRun;
    if (customInput !== undefined) {
      testCasesToRun = [{
        input: customInput,
        expectedOutput: "",
        points: 0,
        isHidden: false
      }];
    } else {
      testCasesToRun = question.testCases.filter((tc) => !tc.isHidden);
    }

    if (testCasesToRun.length === 0) {
      return res.json({ results: [], message: "No sample test cases to run against" });
    }

    let results;
    try {
      const runRes = await runAgainstTestCases(code, language, testCasesToRun);
      results = runRes.results;
    } catch (err) {
      console.warn("Judge0 service error:", err.message);
      return res.status(503).json({
        message: err.message || "Code execution service unavailable. Please try again later.",
      });
    }

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to run code. Check your execution parameters." });
  }
};

// Submit final answer for a question (MCQ option or coding submission).
export const submitAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const {
      questionId,
      type,
      selectedOptionIndex, // mcq
      code, // coding
      language, // coding
      timeTakenSeconds,
      autoSubmitted,
      remainingSeconds,
    } = req.body;

    const attempt = await Attempt.findById(attemptId);
    if (!attempt || attempt.status === "completed") {
      return res.status(403).json({ message: "Attempt not available" });
    }

    if (remainingSeconds !== undefined && remainingSeconds !== null) {
      if (!attempt.questionRemainingTimes) {
        attempt.questionRemainingTimes = {};
      }
      attempt.questionRemainingTimes.set(questionId.toString(), remainingSeconds);
    }

    const exam = await Exam.findById(attempt.exam).lean();
    if (exam && exam.endAt && new Date() > new Date(exam.endAt)) {
      attempt.status = "completed";
      attempt.completedAt = new Date();
      await attempt.save();
      return res.status(403).json({ message: "Attempt not available (Exam has ended)" });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    let answerRecord;
    let pointsEarned = 0;

    if (type === "mcq") {
      const isCorrect =
        selectedOptionIndex !== null &&
        question.options[selectedOptionIndex]?.isCorrect === true;
      pointsEarned = isCorrect ? question.totalPoints : 0;

      answerRecord = {
        question: question._id,
        type: "mcq",
        selectedOptionIndex: selectedOptionIndex ?? null,
        pointsEarned,
        autoSubmitted: !!autoSubmitted,
        timeTakenSeconds: timeTakenSeconds || 0,
      };
    } else {
      let testCaseResults = [];

      if (code && code.trim() && language) {
        try {
          const { results, totalPointsEarned } = await runAgainstTestCases(
            code,
            language,
            question.testCases
          );
          testCaseResults = results.map((r) => ({
            passed: r.passed,
            pointsEarned: r.pointsEarned,
          }));
          pointsEarned = totalPointsEarned;
        } catch (err) {
          console.error("Judge0 grading service offline, auto-saving answer code:", err.message);
          
          // Save the code but score as 0 if execution service fails. Show message.
          testCaseResults = question.testCases.map((tc) => ({
            passed: false,
            pointsEarned: 0,
          }));
          pointsEarned = 0;
        }
      }

      answerRecord = {
        question: question._id,
        type: "coding",
        language: language || null,
        code: code || "",
        testCaseResults,
        pointsEarned,
        autoSubmitted: !!autoSubmitted,
        timeTakenSeconds: timeTakenSeconds || 0,
      };
    }

    // Support updating answers if they were already answered
    const existingIndex = attempt.answers.findIndex(
      (a) => a.question.toString() === questionId
    );

    if (existingIndex > -1) {
      // Subtract old scores, add new ones
      const oldPoints = attempt.answers[existingIndex].pointsEarned;
      attempt.totalScore = Math.max(0, attempt.totalScore - oldPoints + pointsEarned);

      const oldTime = attempt.answers[existingIndex].timeTakenSeconds;
      attempt.totalTimeSeconds = Math.max(0, attempt.totalTimeSeconds - oldTime + (timeTakenSeconds || 0));

      attempt.answers[existingIndex] = answerRecord;
    } else {
      attempt.answers.push(answerRecord);
      attempt.totalScore += pointsEarned;
      attempt.totalTimeSeconds += (timeTakenSeconds || 0);
    }

    await attempt.save({ validateBeforeSave: false });

    res.json({ 
      message: "Answer recorded successfully", 
      pointsEarned,
      totalScore: attempt.totalScore 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save question response." });
  }
};

// Mark the whole attempt as completed (called when candidate finishes last question)
export const completeAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await Attempt.findByIdAndUpdate(
      attemptId,
      { status: "completed", completedAt: new Date() },
      { new: true }
    );
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    res.json({ message: "Exam submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to complete attempt" });
  }
};

// Anti-cheat event logging (tab switch / fullscreen exit / paste attempt)
export const logCheatEvent = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { eventType } = req.body; // "tab_switch" | "fullscreen_exit" | "paste_attempt"

    const fieldMap = {
      tab_switch: "tabSwitchCount",
      fullscreen_exit: "fullscreenExitCount",
      paste_attempt: "pasteAttemptCount",
    };
    const field = fieldMap[eventType];
    if (!field) {
      return res.status(400).json({ message: "Unknown event type" });
    }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt || attempt.status === "completed") {
      return res.status(403).json({ message: "Attempt not available" });
    }

    const exam = await Exam.findById(attempt.exam).lean();
    if (exam && exam.endAt && new Date() > new Date(exam.endAt)) {
      attempt.status = "completed";
      attempt.completedAt = new Date();
      await attempt.save({ validateBeforeSave: false });
      return res.status(403).json({ message: "Attempt not available (Exam has ended)" });
    }

    attempt[field] = (attempt[field] || 0) + 1;

    const totalWarnings = (attempt.tabSwitchCount || 0) + (attempt.fullscreenExitCount || 0) + (attempt.pasteAttemptCount || 0);
    
    // Load exam settings to check limits
    const settings = exam?.settings || {};

    let autoSubmitted = false;
    if (settings.autoSubmit && totalWarnings >= settings.warningLimit) {
      attempt.status = "completed";
      attempt.completedAt = new Date();
      autoSubmitted = true;
    }

    await attempt.save({ validateBeforeSave: false });

    res.json({ 
      message: "Security violation logged", 
      eventType,
      totalWarnings,
      warningLimit: settings.warningLimit,
      autoSubmitted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to log event" });
  }
};

// GET /api/attempts/:attemptId/lobby - fetch exam lobby metadata without exposing actual question details
export const getAttemptLobby = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    const exam = await Exam.findById(attempt.exam).lean();
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const questions = await Question.find({ exam: exam._id }).sort({ order: 1 });

    res.json({
      examTitle: exam.title,
      accessCode: exam.accessCode,
      isLeaderboardPublished: exam.isLeaderboardPublished || false,
      isClosed: exam.isClosed || (exam.endAt && new Date() > new Date(exam.endAt)),
      startAt: exam.startAt,
      endAt: exam.endAt,
      settings: exam.settings || {},
      startedAt: attempt.startedAt,
      questionsList: questions.map((q, idx) => ({
        _id: q._id,
        order: q.order || (idx + 1),
        title: q.title,
        totalPoints: q.totalPoints,
        type: q.type
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch lobby details" });
  }
};

// POST /api/attempts/:attemptId/start - officially start the student's attempt timer
export const startAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    const exam = await Exam.findById(attempt.exam);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (exam.startAt && new Date() < new Date(exam.startAt)) {
      return res.status(400).json({ message: "Exam has not started yet" });
    }

    if (exam.isClosed || (exam.endAt && new Date() > new Date(exam.endAt))) {
      return res.status(403).json({ message: "This exam has closed" });
    }

    // Initialize startedAt if not set yet
    if (!attempt.startedAt) {
      attempt.startedAt = new Date();
      await attempt.save({ validateBeforeSave: false });
    }

    res.json({ message: "Attempt started", startedAt: attempt.startedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to start attempt" });
  }
};
