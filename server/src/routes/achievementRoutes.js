import express from "express";

import {
  evaluateAchievements,
  generateCertificate,
  getCertificateEligibleTrackers,
  getMyAchievements,
  getMyCertificates,
  verifyCertificate,
} from "../controllers/achievementController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

// ----------------------------------------------------
// BADGES
// ----------------------------------------------------

router.post(
  "/evaluate",
  protect,
  evaluateAchievements
);

router.get(
  "/me",
  protect,
  getMyAchievements
);

// ----------------------------------------------------
// CERTIFICATES
// ----------------------------------------------------

router.get(
  "/certificates/eligible",
  protect,
  getCertificateEligibleTrackers
);

router.post(
  "/certificates",
  protect,
  generateCertificate
);

router.get(
  "/certificates/me",
  protect,
  getMyCertificates
);

// Public verification endpoint
router.get(
  "/certificates/verify/:verificationCode",
  verifyCertificate
);

export default router;