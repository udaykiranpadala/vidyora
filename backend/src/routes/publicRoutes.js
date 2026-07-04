import express from "express";
import { getPublicLeaderboard } from "../controllers/resultsController.js";

const router = express.Router();

router.get("/leaderboard/:accessCode", getPublicLeaderboard);

export default router;
