import { db } from "../db/index.js";
import { documentChunks, documents } from "../db/schema.js";
import { EmbeddingService } from "./embedding-service.js";
import { eq, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

export interface AskResponse {
  answer: string;
  sources: {
    filename: string;
    chunkIndex: number;
    content: string;
  }[];
}

export class AskService {
  private static ai: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY || (config as any).geminiApiKey;
      if (!apiKey) {
        throw new Error("CRITICAL_ENV_MISSING: GEMINI_API_KEY environment variable is missing.");
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  static async answerQuestion(question: string): Promise<AskResponse> {
    logger.info(`Processing ask request for question: "${question}"`);

    const queryEmbeddings = await EmbeddingService.generateEmbeddings([question]);
    const questionVector = queryEmbeddings;

    const similarityThreshold = 0.3; 
    const vectorString = `[${questionVector.join(",")}]`;
    
    const matchedChunksRaw = await db
      .select({
        content: documentChunks.content,
        chunkIndex: documentChunks.chunkIndex,
        filename: documents.filename,
        similarity: sql<number>`1 - (${documentChunks.embedding} <=> ${vectorString}::vector)`
      })
      .from(documentChunks)
      .innerJoin(documents, eq(documentChunks.documentId, documents.id))
      .where(sql`1 - (${documentChunks.embedding} <=> ${vectorString}::vector) > ${similarityThreshold}`)
      .orderBy(sql`${documentChunks.embedding} <=> ${vectorString}::vector`)
      .limit(15); 

    const seenChunks = new Set<string>();
    const matchedChunks = matchedChunksRaw.filter((chunk) => {
      const uniqueKey = `${chunk.filename}-${chunk.chunkIndex}`;
      if (seenChunks.has(uniqueKey)) {
        return false;
      }
      seenChunks.add(uniqueKey);
      return true;
    }).slice(0, 5); 
    if (matchedChunks.length === 0) {
      return {
        answer: "I am sorry, but the answer to your question is not available in the provided documents.",
        sources: []
      };
    }

    const contextText = matchedChunks
      .map((c, i) => `[Source ${i + 1}] File: ${c.filename} (Chunk ${c.chunkIndex})\nContent: ${c.content}`)
      .join("\n\n---\n\n");

    const aiClient = this.getClient();
    const systemInstruction = 
      "You are a helpful assistant that answers questions strictly based on the provided document context.\n" +
      "Guidelines:\n" +
      "1. Rely ONLY on the clear facts mentioned directly in the context. Do not use external knowledge.\n" +
      "2. You must cite your facts using the Source notation present in the context (e.g., [Source 1], [Source 2]).\n" +
      "3. If the context does not contain the answer to the user's question, respond exactly with: 'I am sorry, but the answer to your question is not available in the provided documents.' Do not make up information.";

    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `Context:\n${contextText}\n\nQuestion: ${question}` }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.1
        }
      });

      const answer = response.text || "Could not generate an answer response.";

      const sources = matchedChunks.map(chunk => ({
        filename: chunk.filename,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content
      }));

      return { answer, sources };

    } catch (error) {
      logger.error(`Error during LLM context synthesis: ${error}`);
      throw new Error(`Failed to generate answer from model: ${error}`);
    }
  }
}
