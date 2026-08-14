import express from "express";
import {
  createSession,
  deleteSession,
  getSessions,
  updateSessionStatus
} from "../controllers/sessionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getSessions);
router.post("/", protect, createSession);
router.patch("/:id/status", protect, updateSessionStatus);
router.delete("/:id", protect, deleteSession);

export default router;
