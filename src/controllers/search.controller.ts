import { Request, Response } from "express";
import { EmbeddingService } from "../services/embedding-service.js";
import { VectorService } from "../services/vector-service.js";
import { logger } from "../utils/logger.js";
import { db } from "../db/index.js"; 
import { documentChunks } from "../db/schema.js"; 
import { count } from "drizzle-orm"; 
export class SearchController {
  static async search(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit, threshold, documentId } = req.body; 

      if (!query || typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: "Invalid request. The 'query' parameter cannot be blank or empty spaces.",
        });
        return;
      }
      const sanitizedQuery = query.trim();
      const searchLimit = limit ? parseInt(limit as string, 10) : 5;
      const searchThreshold = threshold ? parseFloat(threshold as string) : 0.3;

      logger.info(`Hybrid search request. Query: "${sanitizedQuery}" | DocID Filter: ${documentId || "None"}`);
      const countResult = await db.select({ total: count() }).from(documentChunks);
      const totalRowsInDb = countResult[0]?.total ?? 0;
      logger.info(`[DIAGNOSTIC] Total records inside document_chunks table: ${totalRowsInDb}`);
      const queryEmbeddings = await EmbeddingService.generateEmbeddings([sanitizedQuery]);
      if (!queryEmbeddings || queryEmbeddings.length === 0) {
        throw new Error("Failed to generate embedding for the search query.");
      }
      const queryVector = queryEmbeddings[0];
      logger.info(`[DIAGNOSTIC] Generated vector dimension array length: ${queryVector.length}`);
      const rawSample = await db.select({ id: documentChunks.id }).from(documentChunks).limit(1);
      logger.info(`[DIAGNOSTIC] Raw database connection test row count check: ${rawSample.length}`);

      const matchedChunks = await VectorService.hybridSearch(
        sanitizedQuery,
        queryVector,
        searchLimit,
        searchThreshold,
        documentId
      );
      
      res.status(200).json({
        success: true,
        count: matchedChunks.length,
        diagnostics: {
          totalDatabaseRows: totalRowsInDb,
          vectorDimensionCount: queryVector.length,
          connectionVerificationRows: rawSample.length
        },
        query: sanitizedQuery, 
        documentIdFilter: documentId || "none",
        results: matchedChunks,
      });

    } catch (error: any) {
      logger.error(`Search controller error: ${error.message}`);
      
      if (
        error?.message?.includes("429") || 
        error?.message?.includes("RESOURCE_EXHAUSTED") ||
        error?.message?.includes("quota")
      ) {
        res.status(429).json({
          success: false,
          error: "The embedding server is temporarily rate-limited. Please wait 60 seconds and try again.",
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "An internal server error occurred during hybrid search.",
      });
    }
  }
}
