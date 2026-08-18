//C:\Users\Azadh-desktop\OneDrive\Desktop\document-api\src\controllers\status-controller.ts
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { documents } from "../db/schema.js";
import { addDocumentJob } from "../queue/producer.js";
import { StorageService } from "../services/storage-service.js";
import { AppError } from "../middleware/error-handler.js";
import { logger } from "../utils/logger.js";
import { UploadResponse, FileType } from "../types/document.js";
import { VectorService } from "@/services/vector-service.js";

export async function uploadSingle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("No file provided. Use 'file' as the form field name.", 400);
    }
    const file = req.file;
    const documentId = uuidv4();
    let filetype: FileType;
    if (file.mimetype === "application/pdf") {
      filetype = "pdf";
    } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      filetype = "docx";
    } else {
      throw new AppError("Invalid file type. Only PDF and DOCX are supported.", 400);
    }
    logger.info(`\nUpload request received: ${file.originalname} (${filetype})`);
    const s3Key = await StorageService.uploadFile(file.buffer, file.originalname, file.mimetype);
    await db.insert(documents).values({
      id: documentId,
      filename: file.originalname,
      filetype,
      filesize: file.size,
      s3Key,
      status: "uploaded",
    });
    await addDocumentJob({
      documentId,
      s3Key,
      filename: file.originalname,
      filetype,
    });
    const response: UploadResponse = {
      id: documentId,
      filename: file.originalname,
      status: "uploaded",
      message: "Document uploaded successfully. Processing has started.",
    };

    logger.info(` Upload complete, job queued: ${documentId}\n`);

    res.status(202).json({
      success: true,
      data: response,
    });

  } catch (error) {
    next(error);
  }
}

