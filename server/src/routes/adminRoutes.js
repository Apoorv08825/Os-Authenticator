import { Router } from "express";
import { getAdminSummary } from "../controllers/adminController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/summary", authenticate, requireRole("admin"), getAdminSummary);

export default router;
