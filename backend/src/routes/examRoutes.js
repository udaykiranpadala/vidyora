import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  createExam,
  getMyExams,
  getExamById,
  updateExam,
  publishExam,
  closeExam,
  deleteExam,
} from "../controllers/examController.js";
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from "../controllers/questionController.js";
import { getExamResults } from "../controllers/resultsController.js";

const router = express.Router();

router.use(requireAuth); // every route below requires organizer login

router.post("/", createExam);
router.get("/", getMyExams);
router.get("/:examId", getExamById);
router.get("/:examId/results", getExamResults);
router.patch("/:examId", updateExam);
router.post("/:examId/publish", publishExam);
router.post("/:examId/close", closeExam);
router.delete("/:examId", deleteExam);

router.post("/:examId/questions", addQuestion);
router.patch("/:examId/questions/:questionId", updateQuestion);
router.delete("/:examId/questions/:questionId", deleteQuestion);
router.post("/:examId/questions/reorder", reorderQuestions);

export default router;
