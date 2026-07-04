import Exam from "../models/Exam.js";
import Question from "../models/Question.js";

// Helper: confirms the exam exists and belongs to this organizer
const assertOwnsExam = async (examId, organizerId) => {
  const exam = await Exam.findOne({ _id: examId, organizer: organizerId });
  return exam;
};

// Add a question (MCQ or coding) to an exam
export const addQuestion = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await assertOwnsExam(examId, req.organizerId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const {
      type,
      title,
      statement,
      timerSeconds,
      options, // mcq
      allowedLanguages, // coding
      starterCode, // coding
      testCases, // coding
    } = req.body;

    if (!type || !title || !statement || !timerSeconds) {
      return res.status(400).json({
        message: "type, title, statement, and timerSeconds are required",
      });
    }

    let totalPoints = 0;

    if (type === "mcq") {
      if (!options || options.length < 2) {
        return res
          .status(400)
          .json({ message: "MCQ needs at least 2 options" });
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        return res
          .status(400)
          .json({ message: "MCQ must have exactly one correct option" });
      }
      totalPoints = req.body.totalPoints || 10;
    } else if (type === "coding") {
      if (!testCases || testCases.length === 0) {
        return res
          .status(400)
          .json({ message: "Coding question needs at least one test case" });
      }
      if (!allowedLanguages || allowedLanguages.length === 0) {
        return res
          .status(400)
          .json({ message: "Select at least one allowed language" });
      }
      totalPoints = testCases.reduce((sum, tc) => sum + (tc.points || 0), 0);
    } else {
      return res.status(400).json({ message: "type must be 'mcq' or 'coding'" });
    }

    const currentCount = await Question.countDocuments({ exam: examId });

    const question = await Question.create({
      exam: examId,
      type,
      title,
      statement,
      timerSeconds,
      options: type === "mcq" ? options : [],
      allowedLanguages: type === "coding" ? allowedLanguages : [],
      starterCode: type === "coding" ? starterCode || {} : {},
      testCases: type === "coding" ? testCases : [],
      totalPoints,
      order: currentCount,
    });

    exam.questions.push(question._id);
    await exam.save();

    res.status(201).json({ question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add question" });
  }
};

// Update an existing question
export const updateQuestion = async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const exam = await assertOwnsExam(examId, req.organizerId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const updates = { ...req.body };

    // Keep totalPoints in sync if testCases or options were edited
    if (updates.type === "coding" && updates.testCases) {
      updates.totalPoints = updates.testCases.reduce(
        (sum, tc) => sum + (tc.points || 0),
        0
      );
    }

    const question = await Question.findOneAndUpdate(
      { _id: questionId, exam: examId },
      updates,
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({ question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update question" });
  }
};

// Delete a question, and re-sequence the order of remaining ones
export const deleteQuestion = async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const exam = await assertOwnsExam(examId, req.organizerId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const question = await Question.findOneAndDelete({
      _id: questionId,
      exam: examId,
    });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    exam.questions = exam.questions.filter(
      (qId) => qId.toString() !== questionId
    );
    await exam.save();

    // Re-sequence remaining questions so order has no gaps
    const remaining = await Question.find({ exam: examId }).sort({ order: 1 });
    await Promise.all(
      remaining.map((q, idx) => Question.updateOne({ _id: q._id }, { order: idx }))
    );

    res.json({ message: "Question deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete question" });
  }
};

// Reorder questions - body: { orderedQuestionIds: [id1, id2, ...] }
export const reorderQuestions = async (req, res) => {
  try {
    const { examId } = req.params;
    const { orderedQuestionIds } = req.body;
    const exam = await assertOwnsExam(examId, req.organizerId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    await Promise.all(
      orderedQuestionIds.map((qId, idx) =>
        Question.updateOne({ _id: qId, exam: examId }, { order: idx })
      )
    );

    res.json({ message: "Order updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reorder questions" });
  }
};
