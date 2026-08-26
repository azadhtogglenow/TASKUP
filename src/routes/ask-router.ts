import { Router } from "express";
import { AskController } from "../controllers/ask-controller.js";

const router = Router();
router.post("/ask", AskController.handleAsk);

export { router as askRouter };
