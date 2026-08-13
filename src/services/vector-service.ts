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
        
        logger.info(`   Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunkData.length / batchSize)}`);
      }

      logger.info(` Stored all ${chunks.length} chunks`);
    } catch (error) {
      logger.error(`Failed to store chunks: ${error}`);
      throw new Error(`Failed to store chunks: ${error}`);
    }
  }




static async hybridSearch(
  queryText: string,
  queryEmbedding: number[],
  limit: number = 5,
  threshold: number = 0.3, 
  documentId?: string): Promise<Array<{ id: string; content: string; documentId: string; chunkIndex: number; similarity: number; }>> {
  logger.info(`Executing hybrid search (limit: ${limit}, threshold: ${threshold}, docId: ${documentId || 'ALL'})...`);
  
  try {
    const embeddingStr = `[${queryEmbedding.join(",")}]`;
    const documentFilter = documentId ? sql`AND document_id = ${documentId}` : sql``;
    const formattedTextQuery = queryText.trim().split(/\s+/).join(' | ');

    const results = await db.execute(sql`
      WITH vector_search AS (
        SELECT 
          id, content, document_id, chunk_index,
          1 - (embedding <=> ${embeddingStr}::vector) as similarity,
          ROW_NUMBER() OVER (ORDER BY embedding <=> ${embeddingStr}::vector) as rank
        FROM document_chunks
        WHERE 1 - (embedding <=> ${embeddingStr}::vector) > ${threshold}
        ${documentFilter}
        LIMIT ${limit} * 2
      ),
      text_search AS (
        SELECT 
          id, content, document_id, chunk_index,
          ts_rank_cd(to_tsvector('english', content), to_tsquery('english', ${formattedTextQuery})) as text_score,
          ROW_NUMBER() OVER (ORDER BY ts_rank_cd(to_tsvector('english', content), to_tsquery('english', ${formattedTextQuery})) DESC) as rank
        FROM document_chunks
        WHERE to_tsvector('english', content) @@ to_tsquery('english', ${formattedTextQuery})
        ${documentFilter}
        LIMIT ${limit} * 2
      )
      SELECT 
        COALESCE(v.id, t.id) as id,
        COALESCE(v.content, t.content) as content,
        COALESCE(v.document_id, t.document_id) as "documentId",
        COALESCE(v.chunk_index, t.chunk_index) as "chunkIndex",
        COALESCE(v.similarity, 0.0) as similarity,
        -- Reciprocal Rank Fusion (RRF) Algorithm (60 is the standard constant penalty factor)
        (COALESCE(1.0 / (60 + v.rank), 0.0) + COALESCE(1.0 / (60 + t.rank), 0.0)) as rrf_score
      FROM vector_search v
      FULL OUTER JOIN text_search t ON v.id = t.id
      ORDER BY rrf_score DESC
      LIMIT ${limit}
    `);

    logger.info(`Hybrid search found ${results.rows.length} relevant chunks`);
    return results.rows as any[];
  } catch (error) {
    logger.error(`Hybrid search failed: ${error}`);
    throw new Error(`Failed hybrid search operation: ${error}`);
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