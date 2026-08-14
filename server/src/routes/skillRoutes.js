import express from "express";

import {
  createSkill,
  getSkills,
  updateSkill,
  deleteSkill,
  getMatches
} from "../controllers/skillController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/match", protect, getMatches);

router.post("/", protect, createSkill);
router.get("/", protect, getSkills);
router.put("/:id", protect, updateSkill);
router.delete("/:id", protect, deleteSkill);

export default router;