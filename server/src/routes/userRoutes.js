import express from "express";
import { protect } from "../middleware/auth.js";
import { searchUsers, getUserProfile } from "../controllers/userController.js";

const router = express.Router();

router.use(protect);

router.get("/search", searchUsers);
router.get("/:id", getUserProfile);

export default router;
