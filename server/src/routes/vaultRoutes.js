import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

import {
  createVaultResource,
  deleteVaultResource,
  getMyVaultResources
} from "../controllers/vaultController.js";

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
    cb(
      null,
      `${req.user._id}-vault-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only PDF, PNG, JPG, TXT, DOC, and DOCX files are allowed."
        )
      );
    }

    cb(null, true);
  }
});

router.get(
  "/mine",
  requireAuth,
  getMyVaultResources
);

router.post(
  "/",
  requireAuth,
  upload.single("file"),
  createVaultResource
);

router.delete(
  "/:id",
  requireAuth,
  deleteVaultResource
);

export default router;