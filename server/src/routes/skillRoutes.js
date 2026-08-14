import express from "express";

import {
  createSkill,
  getSkills,
  getSkillMatches,
  updateSkill,
  deleteSkill,
  getMatches,
  boostSkill,
  renewSkillBoost,
  getFeaturedSkills
} from "../controllers/skillController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/match", protect, getMatches);
router.get("/featured", getFeaturedSkills);
router.post("/", protect, createSkill);
router.get("/", protect, getSkills);
router.get("/matches", protect, getSkillMatches);
router.post("/:id/boost", protect, boostSkill);
router.post("/:id/renew-boost", protect, renewSkillBoost);
router.put("/:id", protect, updateSkill);
router.delete("/:id", protect, deleteSkill);

export default router;
