import { db } from "../db/index.js";
import { documentChunks } from "../db/schema.js";
import { eq, sql, desc } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

export class VectorService {
  static async storeChunks(
    documentId: string,
    chunks: string[],
    embeddings: number[][]
  ): Promise<void> {
    logger.info(`Storing ${chunks.length} chunks for document ${documentId}...`);

    try {
      const chunkData = chunks.map((content, index) => ({
        documentId,
        content,
        chunkIndex: index,
        embedding: embeddings[index],
        metadata: {
          charCount: content.length,
          wordCount: content.split(/\s+/).length,
        },
      }));
      const batchSize = 100;
      for (let i = 0; i < chunkData.length; i += batchSize) {
        const batch = chunkData.slice(i, i + batchSize);
        await db.insert(documentChunks).values(batch);
        
        logger.info(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunkData.length / batchSize)}`);
      }

      logger.info(` Stored all ${chunks.length} chunks`);
    } catch (error) {
      logger.error(`Failed to store chunks: ${error}`);
      throw new Error(`Failed to store chunks: ${error}`);
    }
  }

}