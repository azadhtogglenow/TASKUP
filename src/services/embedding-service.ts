import { GoogleGenAI} from "@google/genai";
import * as fs from "fs";
import { config } from "../config";
import { logger } from "../utils/logger";
import dotenv from 'dotenv';
dotenv.config()

export class EmbeddingService {
private static ai: GoogleGenAI | null = null;
private static getClient(): GoogleGenAI {
  if (!this.ai) {
    const apiKey = process.env.GEMINI_API_KEY || (config as any).geminiApiKey;
    if (!apiKey) {
      throw new Error(
        "CRITICAL_ENV_MISSING: GEMINI_API_KEY environment variable is missing or undefined!"
      );
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey });
  }
  return this.ai;
}

  static async generateEmbeddings(
    texts: string[],
    onProgress?: (current: number) => void
  ): Promise<number[][]> {
    logger.info(`Generating embeddings for ${texts.length} chunks via Gemini API...`);
    const aiClient = this.getClient();

    try {
      const response = await aiClient.models.embedContent({
        model: "gemini-embedding-2",
        contents: texts,
      });
      const embeddings: number[][] = (response.embeddings || []).map((emb) => {
        const values = emb.values || [];
        return values.slice(0, config.embedding.dimension);
      });
      if (onProgress) {
        onProgress(texts.length);
      }

      logger.info(`Progress: ${texts.length}/${texts.length}`);
      logger.info(`Generated ${embeddings.length} embeddings`);
      return embeddings;

    } catch (error) {
      logger.error(`Batch embedding generation error: ${error}`);
      throw new Error(`Failed to generate batch embeddings: ${error}`);
    }
  }

   static async generatePdfEmbedding(filePath: string, mimeType = "application/pdf"): Promise<number[]> {
    const aiClient = this.getClient();

    try {
      logger.info(`Sending raw PDF to Gemini for native embedding...`);
      
      const pdfPart = {
        inlineData: {
          data: fs.readFileSync(filePath).toString("base64"),
          mimeType
        }
      };

      const response = await aiClient.models.embedContent({
        model: config.embedding.model,
        contents: pdfPart, 
      });

      const firstEmbedding = response.embeddings?.[0];
      const embeddingValues = firstEmbedding?.values;

      if (!embeddingValues) {
        throw new Error("API response did not contain embedding values.");
      }

      return embeddingValues.slice(0, config.embedding.dimension);
    } catch (error) {
      logger.error(`PDF embedding generation error: ${error}`);
      throw new Error(`Failed to generate PDF embedding: ${error}`);
    }
  }
  static isLoaded(): boolean {
    return this.ai !== null;
  }
  static async preload(): Promise<void> {
    this.getClient();
    logger.info(" Gemini Embedding client initialized!");
  }
}
