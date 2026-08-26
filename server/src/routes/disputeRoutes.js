import express from "express";
import {
  fileDispute,
  getMyDisputes,
  getAllDisputes,
  getDisputeById,
  markUnderReview,
  resolveDispute,
  dismissDispute,
} from "../controllers/disputeController.js";
import { protect } from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

router.use(protect);

router.route("/").post(fileDispute).get(isAdmin, getAllDisputes);
router.get("/mine", getMyDisputes);
router.get("/:id", getDisputeById);

router.put("/:id/review", isAdmin, markUnderReview);
router.put("/:id/resolve", isAdmin, resolveDispute);
router.put("/:id/dismiss", isAdmin, dismissDispute);

export default router;
