import express from "express";
import {
  createSwapRequest,
  getMySwapRequests,
  getSwapRequestById,
  acceptSwapRequest,
  declineSwapRequest,
  counterSwapRequest,
  cancelSwapRequest,
} from "../controllers/swapController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createSwapRequest).get(getMySwapRequests);
router.route("/:id").get(getSwapRequestById).delete(cancelSwapRequest);

router.put("/:id/accept", acceptSwapRequest);
router.put("/:id/decline", declineSwapRequest);
router.put("/:id/counter", counterSwapRequest);

export default router;
