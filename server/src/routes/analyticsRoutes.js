import express from "express";
import {
  getMyAnalytics,
  getPopularSkills,
  getEngagementTrends,
  getRecommendations,
} from "../controllers/analyticsController.js";
import { protect } from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

router.use(protect);

router.get("/me", getMyAnalytics);
router.get("/popular-skills", getPopularSkills);
router.get("/recommendations", getRecommendations);
router.get("/engagement", isAdmin, getEngagementTrends);

export default router;
