import { Router } from "express";
import * as statusController from "../controllers/status-controller.js";
const router = Router();
router.get("/:id", statusController.getStatus);
router.get("/", statusController.listDocuments);
router.get("/:id/chunks", statusController.getChunks);
export default router;