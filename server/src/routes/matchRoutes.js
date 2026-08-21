import express from "express";
import { protect } from "../middleware/auth.js";
import { requestMatch, respondToMatch, getMatches } from "../controllers/matchController.js";

const router = express.Router();

router.use(protect);

router.get("/", getMatches);
router.post("/:userId", requestMatch);
router.put("/:matchId/respond", respondToMatch);

export default router;
