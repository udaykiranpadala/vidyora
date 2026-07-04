import Exam from "../models/Exam.js";
import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";

// Organizer-only: detailed results for every candidate in this exam
export const getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findOne({ _id: examId, organizer: req.organizerId });
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Fetch all attempts — completed first (sorted by score desc, time asc), then in_progress
    const completedAttempts = await Attempt.find({ exam: examId, status: "completed" })
      .sort({ totalScore: -1, totalTimeSeconds: 1 })
      .lean();

    const inProgressAttempts = await Attempt.find({ exam: examId, status: "in_progress" })
      .sort({ createdAt: 1 })
      .lean();

    const attempts = [...completedAttempts, ...inProgressAttempts];

    const questions = await Question.find({ exam: examId }).sort({ order: 1 }).lean();

    res.json({ exam, questions, attempts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch results" });
  }
};

// Public: leaderboard for a closed exam, identified by access code.
// Only basic ranking info - no answer content, no question details.
export const getPublicLeaderboard = async (req, res) => {
  try {
    const { accessCode } = req.params;
    const exam = await Exam.findOne({ accessCode: accessCode.toUpperCase() }).lean();
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const attempts = await Attempt.find({
      exam: exam._id,
      status: "completed",
    })
      .sort({ totalScore: -1, totalTimeSeconds: 1 })
      .select("candidateName candidateRollNumber totalScore totalTimeSeconds")
      .lean();

    const leaderboard = attempts.map((a, idx) => ({
      rank: idx + 1,
      candidateName: a.candidateName,
      candidateRollNumber: a.candidateRollNumber,
      totalScore: a.totalScore,
      totalTimeSeconds: a.totalTimeSeconds,
    }));

    res.json({
      examTitle: exam.title,
      isClosed: exam.isClosed || (exam.endAt && new Date() > new Date(exam.endAt)),
      isLeaderboardPublished: exam.isLeaderboardPublished || false,
      leaderboard,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};
