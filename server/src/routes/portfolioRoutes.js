import { Router } from "express";
import {
  createPortfolioItem,
  deletePortfolioItem,
  getMyPortfolioItems,
  getPublicPortfolioItems
} from "../controllers/portfolioController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/public", getPublicPortfolioItems);
router.get("/mine", requireAuth, getMyPortfolioItems);
router.post("/", requireAuth, createPortfolioItem);
router.delete("/:id", requireAuth, deletePortfolioItem);

export default router;
