import express from "express";
import {
  createSession,
  deleteSession,
  getSessions,
  rateSessionPartner,
  syncSessionCalendar,
  updateSessionStatus,
  joinGroupSession,
  getGoogleAuthUrl,
  googleAuthCallback
} from "../controllers/sessionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getSessions);

router.get("/auth/google", protect, getGoogleAuthUrl);
router.get("/auth/google/callback", googleAuthCallback);

router.post("/", protect, createSession);
router.post("/:id/calendar-sync", protect, syncSessionCalendar);
router.patch("/:id/status", protect, updateSessionStatus);
router.patch("/:id/rating", protect, rateSessionPartner);
router.delete("/:id", protect, deleteSession);
router.post("/:id/join", protect, joinGroupSession);

export default router;
