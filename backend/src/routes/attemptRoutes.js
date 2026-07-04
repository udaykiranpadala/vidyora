import express from "express";
import {
  joinExam,
  getQuestionForAttempt,
  runCode,
  submitAnswer,
  completeAttempt,
  logCheatEvent,
  getAttemptLobby,
  startAttempt,
} from "../controllers/attemptController.js";

const router = express.Router();

router.post("/join/:accessCode", joinExam);
router.get("/:attemptId/lobby", getAttemptLobby);
router.post("/:attemptId/start", startAttempt);
router.get("/:attemptId/question/:index", getQuestionForAttempt);
router.post("/:attemptId/run", runCode);
router.post("/:attemptId/submit-answer", submitAnswer);
router.post("/:attemptId/complete", completeAttempt);
router.post("/:attemptId/log-event", logCheatEvent);

export default router;
