import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import {
  createPortfolioItem,
  deletePortfolioItem,
  getMyPortfolioItems,
  getPublicPortfolioItems
} from "../controllers/portfolioController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-portfolio-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.get("/public", getPublicPortfolioItems);
router.get("/mine", requireAuth, getMyPortfolioItems);
router.post("/", requireAuth, upload.single("image"), createPortfolioItem);
router.delete("/:id", requireAuth, deletePortfolioItem);

export default router;
