import { Router } from "express";
import { SynopsisController } from "../controllers/synopsis-controller.js";

const router = Router();

router.get("/:documentId", SynopsisController.handleGetSynopsis);

export { router as synopsisRouter };
