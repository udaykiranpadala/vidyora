import Exam from "../models/Exam.js";
import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import { generateAccessCode } from "../utils/accessCode.js";

// Create a new exam (starts empty - questions added separately)
export const createExam = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Exam title is required" });
    }

    // Keep generating until we find a code that isn't already in use
    let accessCode;
    let isUnique = false;
    while (!isUnique) {
      accessCode = generateAccessCode();
      const existing = await Exam.findOne({ accessCode });
      if (!existing) isUnique = true;
    }

    const exam = await Exam.create({
      organizer: req.organizerId,
      title,
      description: description || "",
      accessCode,
    });

    res.status(201).json({ exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create exam" });
  }
};

// List all exams belonging to the logged-in organizer
export const getMyExams = async (req, res) => {
  try {
    const exams = await Exam.find({ organizer: req.organizerId })
      .sort({ createdAt: -1 })
      .lean();

    // Attach a quick question count and attempt count to each, useful for dashboard cards
    const examsWithCounts = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await Question.countDocuments({ exam: exam._id });
        const attemptCount = await Attempt.countDocuments({ exam: exam._id });
        return { ...exam, questionCount, attemptCount };
      })
    );

    res.json({ exams: examsWithCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};

// Get one exam (with its questions) - organizer-only, must own it
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.examId,
      organizer: req.organizerId,
    }).lean();

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const questions = await Question.find({ exam: exam._id }).sort({ order: 1 });

    res.json({ exam, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exam" });
  }
};

// Update exam title/description/settings
export const updateExam = async (req, res) => {
  try {
    const { title, description, settings, startAt, endAt, isLeaderboardPublished } = req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (settings) updateData.settings = settings;
    if (startAt !== undefined) updateData.startAt = startAt;
    if (endAt !== undefined) updateData.endAt = endAt;
    if (isLeaderboardPublished !== undefined) updateData.isLeaderboardPublished = isLeaderboardPublished;

    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.examId, organizer: req.organizerId },
      updateData,
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.json({ exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update exam" });
  }
};

// Publish exam - makes it joinable by students via the access code
export const publishExam = async (req, res) => {
  try {
    const questionCount = await Question.countDocuments({ exam: req.params.examId });
    if (questionCount === 0) {
      return res
        .status(400)
        .json({ message: "Add at least one question before publishing" });
    }

    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.examId, organizer: req.organizerId },
      { isPublished: true },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.json({ exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to publish exam" });
  }
};

// Close exam - stops new attempts, auto-completes all in-progress student attempts
export const closeExam = async (req, res) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.examId, organizer: req.organizerId },
      { isClosed: true },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Auto-complete any attempts still in_progress so they appear in results & leaderboard
    await Attempt.updateMany(
      { exam: exam._id, status: "in_progress" },
      { $set: { status: "completed", completedAt: new Date() } }
    );

    res.json({ exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to close exam" });
  }
};

// Delete exam and all its questions + attempts
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({
      _id: req.params.examId,
      organizer: req.organizerId,
    });

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    await Question.deleteMany({ exam: exam._id });
    await Attempt.deleteMany({ exam: exam._id });

    res.json({ message: "Exam deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete exam" });
  }
};
