import { Router } from "express";
import {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();
router.use(authenticate);
router.post("/", createDocument);
router.get("/", getAllDocuments);
router.get("/:id", getDocumentById);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export default router;