import express from "express";

import {
  createSkill,
  getSkills,
  getSkillMatches,
  updateSkill,
  deleteSkill
} from "../controllers/skillController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createSkill);
router.get("/", protect, getSkills);
router.get("/matches", protect, getSkillMatches);
router.put("/:id", protect, updateSkill);
router.delete("/:id", protect, deleteSkill);

export default router;
