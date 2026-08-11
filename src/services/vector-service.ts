import { db } from "../db";
import { documentChunks } from "../db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { logger } from "../utils/logger";
import { config } from "../config";

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
        
        logger.info(`   Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunkData.length / batchSize)}`);
      }

      logger.info(` Stored all ${chunks.length} chunks`);
    } catch (error) {
      logger.error(`Failed to store chunks: ${error}`);
      throw new Error(`Failed to store chunks: ${error}`);
    }
  }

  static  async similaritySearch(queryEmbedding: number[],limit: number = 5,threshold: number = 0.7): Promise<Array<{
    id: string;
    content: string;
    documentId: string;
    chunkIndex: number;
    similarity: number;
  }>> {
    logger.info(`Searching for similar chunks (limit: ${limit}, threshold: ${threshold})...`);

    try {
      const embeddingStr = `[${queryEmbedding.join(",")}]`;
      const results = await db.execute(sql`
        SELECT 
          id,
          content,
          document_id as "documentId",
          chunk_index as "chunkIndex",
          1 - (embedding <=> ${embeddingStr}::vector) as similarity
        FROM document_chunks
        WHERE 1 - (embedding <=> ${embeddingStr}::vector) > ${threshold}
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `);

      logger.info(`Found ${results.rows.length} similar chunks`);
      return results.rows as any[];
    } catch (error) {
      logger.error(`Similarity search failed: ${error}`);
      throw new Error(`Similarity search failed: ${error}`);
    }
  }


  static async getChunksByDocumentId(documentId: string) {
    return await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, documentId))
      .orderBy(documentChunks.chunkIndex);
  }

  static async deleteChunksByDocumentId(documentId: string): Promise<void> {
    await db
      .delete(documentChunks)
      .where(eq(documentChunks.documentId, documentId));
    logger.info(`Deleted chunks for document ${documentId}`);
  }


  static async getChunkCount(documentId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(documentChunks)
      .where(eq(documentChunks.documentId, documentId));
    
    return result[0]?.count || 0;
  }
}