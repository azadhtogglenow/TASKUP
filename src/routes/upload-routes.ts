import { Router } from "express";
import multer from "multer";
import * as uploadController from "../controllers/upload-controller.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF and DOCX are allowed.`));
    }
  },
});


router.post("/", upload.single("file"), uploadController.uploadSingle);
export default router;