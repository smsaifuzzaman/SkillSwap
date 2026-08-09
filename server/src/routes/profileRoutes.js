import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  getProfile,
  updateProfile,
  uploadPhoto,
} from "../controllers/profileController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.get("/", protect, getProfile);
router.put("/", protect, updateProfile);
router.post("/photo", protect, upload.single("photo"), uploadPhoto);


export default router;