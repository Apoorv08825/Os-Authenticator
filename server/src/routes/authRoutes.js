import { Router } from "express";
import { getCurrentUser, login, logout, signup } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/signup", authRateLimiter, signup);
router.post("/login", authRateLimiter, login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getCurrentUser);

export default router;
