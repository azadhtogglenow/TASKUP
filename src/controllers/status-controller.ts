//C:\Users\Azadh-desktop\OneDrive\Desktop\document-api\src\controllers\status-controller.ts
import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { documents, documentChunks } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { AppError } from "../middleware/error-handler.js";
import { logger } from "../utils/logger.js";
import { DocumentStatusResponse } from "../types/document.js";


export async function getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new AppError("Document not found", 404);
    }

    const doc = result[0];
    
    const response: DocumentStatusResponse = {
      id: doc.id,
      filename: doc.filename,
      status: doc.status as any,
      chunkCount: doc.chunkCount,
      errorMessage: doc.errorMessage,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    res.json({
      success: true,
      data: response,
    });

  } catch (error) {
    next(error);
  }
}

export async function listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents);
    const total = countResult[0]?.count || 0;
    let query = db.select().from(documents).$dynamic();
    
    if (status && ["uploaded", "processing", "completed", "failed"].includes(status)) {
      query = query.where(eq(documents.status, status));
    }
    
    const results = await query
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: {
        documents: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    next(error);
  }
}


export async function getChunks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    
    const docResult = await db
      .select({ id: documents.id, status: documents.status })
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (docResult.length === 0) {
      throw new AppError("Document not found", 404);
    }

    if (docResult[0].status !== "completed") {
      throw new AppError(`Document is not yet processed. Current status: ${docResult[0].status}`, 400);
    }

    // Fetch chunks (exclude the huge embedding array for performance)
    const chunks = await db
      .select({
        id: documentChunks.id,
        content: documentChunks.content,
        chunkIndex: documentChunks.chunkIndex,
        metadata: documentChunks.metadata,
        createdAt: documentChunks.createdAt,
      })
      .from(documentChunks)
      .where(eq(documentChunks.documentId, id))
      .orderBy(documentChunks.chunkIndex);

    res.json({
      success: true,
      data: {
        documentId: id,
        chunkCount: chunks.length,
        chunks,
      },
    });

  } catch (error) {
    next(error);
  }
}