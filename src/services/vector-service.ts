import { db } from "../db/index.js";
import { documentChunks } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { logger } from "../utils/logger.js";

export interface SearchResult {
  id: string;
  content: string;
  documentId: string;
  chunkIndex: number;
  similarity: number;
}

export class VectorService {
  static async storeChunks(
    documentId: string,
    chunks: string[],
    embeddings: number[][]
  ): Promise<void> {
    logger.info(`Storing ${chunks.length} chunks for document ${documentId}...`);
    const EXPECTED_DIMENSIONS = 3072;
    const BATCH_SIZE = 50;

    try {
      // Build pure, type-checked JavaScript objects matching your table schema
      const insertRows = chunks.map((content, index) => {
        let rawEmbedding = embeddings[index] || [];

        // Handle dimension mismatch safely
        if (rawEmbedding.length < EXPECTED_DIMENSIONS) {
          rawEmbedding = [...rawEmbedding, ...new Array(EXPECTED_DIMENSIONS - rawEmbedding.length).fill(0)];
        } else if (rawEmbedding.length > EXPECTED_DIMENSIONS) {
          rawEmbedding = rawEmbedding.slice(0, EXPECTED_DIMENSIONS);
        }

        const formattedVectorParam = `[${rawEmbedding.join(",")}]`;

        return {
          documentId: documentId, // Maps correctly to database column layout
          content: content,
          chunkIndex: index,
          // SUCCESS FIX: Wraps formatting string correctly so data types bind smoothly on creation
          embedding: sql.raw(`'${formattedVectorParam}'::halfvec`) as any, 
          metadata: {
            charCount: content.length,
            wordCount: content.split(/\s+/).filter(Boolean).length
          }
        };
      });

      for (let i = 0; i < insertRows.length; i += BATCH_SIZE) {
        const batch = insertRows.slice(i, i + BATCH_SIZE);
        await db.insert(documentChunks).values(batch);
        
        logger.info(`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(insertRows.length / BATCH_SIZE)}`);
      }

      logger.info(`  Stored all ${chunks.length} chunks successfully!`);
    } catch (error) {
      logger.error(`Failed to store chunks: ${error}`);
      throw new Error(`Failed to store chunks: ${error}`);
    }
  }
  static async hybridSearch(
    queryText: string, 
    queryEmbedding: number[],
    limit: number = 5,
    threshold: number = 0, 
    documentId?: string
  ): Promise<SearchResult[]> {
    try {
      if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        throw new Error("Invalid query vector layout provided to vector service.");
      }

      const formattedQueryVector = `[${queryEmbedding.join(",")}]`;
      const distanceExpression = sql`"embedding" <=> ${sql.raw(`'${formattedQueryVector}'`)}::halfvec`;
      const similarityExpression = sql`(1 - (${distanceExpression}))::float`;
      const filters = [];
      if (threshold > 0) {
        filters.push(sql`${similarityExpression} >= ${threshold}`);
      }
      if (documentId) {
        filters.push(eq(documentChunks.documentId, documentId));
      }
      const queryBuilder = db
        .select({
          id: documentChunks.id,
          content: documentChunks.content,
          documentId: documentChunks.documentId, // Drizzle maps snake_case -> camelCase automatically
          chunkIndex: documentChunks.chunkIndex,
          similarity: similarityExpression,      
        })
        .from(documentChunks);

      if (filters.length > 0) {
        queryBuilder.where(sql.join(filters, sql` AND `));
      }
      const matchedRecords = await queryBuilder
        .orderBy(distanceExpression) 
        .limit(limit);

      return matchedRecords as SearchResult[];

    } catch (error) {
      logger.error(`Hybrid search error: ${error}`);
      throw new Error(`Vector database search failed: ${error}`);
    }
  }
}
