import { Router } from "express";
import { signup, login, getMe } from "../controllers/auth-Controller";
import { authenticate } from "../middleware/auth-Middleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, getMe);

export default router;