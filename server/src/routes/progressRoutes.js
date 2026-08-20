import express from "express";

import {
  createProgressTracker,
  getMyProgressTrackers,
  getProgressTracker,
  updateProgressTracker,
  addMilestone,
  updateMilestone,
  toggleMilestone,
  deleteMilestone
} from "../controllers/progressController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

// ----------------------------------------------------
// PROGRESS TRACKERS
// ----------------------------------------------------

router.get(
  "/",
  protect,
  getMyProgressTrackers
);

router.post(
  "/",
  protect,
  createProgressTracker
);

router.get(
  "/:id",
  protect,
  getProgressTracker
);

router.patch(
  "/:id",
  protect,
  updateProgressTracker
);

// ----------------------------------------------------
// MILESTONES
// ----------------------------------------------------

router.post(
  "/:id/milestones",
  protect,
  addMilestone
);

router.patch(
  "/:id/milestones/:milestoneId",
  protect,
  updateMilestone
);

router.patch(
  "/:id/milestones/:milestoneId/toggle",
  protect,
  toggleMilestone
);

router.delete(
  "/:id/milestones/:milestoneId",
  protect,
  deleteMilestone
);

export default router;