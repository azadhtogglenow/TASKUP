import { Request, Response } from "express";
import { EmbeddingService } from "../services/embedding-service.js";
import { VectorService } from "../services/vector-service.js";
import { logger } from "../utils/logger.js";

export class SearchController {
  static async search(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit, threshold, documentId } = req.body; 
      if (!query || typeof query !== "string" || query.trim() === "") {
        res.status(400).json({
          success: false,
          error: "Missing or invalid 'query' parameter in request body.",
        });
        return;
      }
      const searchLimit = limit ? parseInt(limit as string, 10) : 5;
      const searchThreshold = threshold ? parseFloat(threshold as string) : 0.3;

      logger.info(`Hybrid search request. Query: "${query}" | DocID Filter: ${documentId || "None"} | Limit: ${searchLimit}`);
      const queryEmbeddings = await EmbeddingService.generateEmbeddings([query]);
      
      if (!queryEmbeddings || queryEmbeddings.length === 0) {
        throw new Error("Failed to generate embedding for the search query.");
      }
      
      const queryVector = queryEmbeddings[0];
      const matchedChunks = await VectorService.hybridSearch(
        query,
        queryVector,
        searchLimit,
        searchThreshold,
        documentId
      );
      
      res.status(200).json({
        success: true,
        count: matchedChunks.length,
        query,
        documentIdFilter: documentId || "none",
        results: matchedChunks,
      });

    } catch (error: any) {
      logger.error(`Search controller error: ${error.message}`);
      res.status(500).json({
        success: false,
        error: "An internal server error occurred during hybrid search.",
      });
    }
  }
}
