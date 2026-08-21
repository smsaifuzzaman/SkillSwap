import express from "express";
import { protect } from "../middleware/auth.js";
import { getConversation, sendMessage, getInbox } from "../controllers/chatController.js";

const router = express.Router();

router.use(protect);

router.get("/", getInbox);
router.get("/:userId", getConversation);
router.post("/:userId", sendMessage);

export default router;
