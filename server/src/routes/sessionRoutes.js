import express from "express";
import {
  createSession,
  deleteSession,
  getSessions,
  rateSessionPartner,
  updateSessionStatus,
  joinGroupSession
} from "../controllers/sessionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getSessions);
router.post("/", protect, createSession);
router.patch("/:id/status", protect, updateSessionStatus);
router.patch("/:id/rating", protect, rateSessionPartner);
router.delete("/:id", protect, deleteSession);
router.post("/:id/join", protect, joinGroupSession);

export default router;
