import { Router } from "express";
import { disableMfa, enableMfa, setupMfa } from "../controllers/mfaController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/setup", authenticate, setupMfa);
router.post("/enable", authenticate, enableMfa);
router.post("/disable", authenticate, disableMfa);

export default router;
