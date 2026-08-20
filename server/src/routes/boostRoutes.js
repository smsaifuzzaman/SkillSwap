import express from "express";
import {
  activateBoost,
  renewBoost,
  getMyBoostTransactions
} from "../controllers/boostController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/:skillId/activate", protect, activateBoost);
router.post("/:skillId/renew", protect, renewBoost);
router.get("/transactions/me", protect, getMyBoostTransactions);

export default router;