import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createTeam,
  getMyTeam,
  joinTeam,
  removeMember
} from "../controllers/teamController.js";

const router = express.Router();

router.use(protect);

router.post("/", createTeam);
router.get("/my-team", getMyTeam);
router.post("/join", joinTeam);
router.delete("/members/:userId", removeMember);

export default router;
