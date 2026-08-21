import express from "express";
import {
  createOrUpdateReview,
  deleteReview,
  getReviews,
  getTrustSummary
} from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/summary", protect, getTrustSummary);
router.get("/", protect, getReviews);
router.post("/", protect, createOrUpdateReview);
router.delete("/:id", protect, deleteReview);

export default router;

