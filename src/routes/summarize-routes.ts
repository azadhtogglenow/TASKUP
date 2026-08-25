import { Router } from "express";
import multer from "multer";
import { SummarizeController } from "../controllers/summarize-controller.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, 
  },
});

router.post("/", upload.single("file"), SummarizeController.handleSummarize);

export default router;
