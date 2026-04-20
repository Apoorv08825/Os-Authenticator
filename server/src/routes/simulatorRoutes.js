import { Router } from "express";
import { runAuthSimulation, simulateAttack } from "../controllers/simulatorController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/auth-flow", authenticate, runAuthSimulation);
router.post("/attack", authenticate, simulateAttack);

export default router;
