// ============================================
// Status Routes
// ============================================
// This file ONLY defines routes.
// All logic is in the controller.
// ============================================

import { Router } from "express";
import * as statusController from "../controllers/status-controller";

const router = Router();

// GET /api/status/:id 
router.get("/:id", statusController.getStatus);

// GET /api/status 
router.get("/", statusController.listDocuments);

// GET /api/status/:id/chunks 
router.get("/:id/chunks", statusController.getChunks);

export default router;