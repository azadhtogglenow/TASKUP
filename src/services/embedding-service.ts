import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import dotenv from 'dotenv';
dotenv.config();

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
    const embeddingsList: number[][] = [];

    
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      const batchSize = 5; 

      for (let i = 0; i < texts.length; i += batchSize) {
        const textBatch = texts.slice(i, i + batchSize);
        
        const batchPromises = textBatch.map(async (text) => {
          const response = await aiClient.models.embedContent({
            model: "gemini-embedding-2",
            contents: text,
          });

          const values = response.embeddings?.[0]?.values;
          if (!values) {
            throw new Error("Gemini API returned an empty or malformed embedding vector.");
          }
          return values;
        });

        const batchResults = await Promise.all(batchPromises);
        embeddingsList.push(...batchResults);

        if (onProgress) {
          onProgress(embeddingsList.length);
        }
        logger.info(`Progress: ${embeddingsList.length}/${texts.length}`);
        if (i + batchSize < texts.length) {
          await sleep(4000); 
        }
      }

      logger.info(`Generated ${embeddingsList.length} embeddings`);
      return embeddingsList;

    } catch (error) {
      logger.error(`Batch embedding generation error: ${error}`);
      throw new Error(`Failed to generate batch embeddings: ${error}`);
    }
  }


 
  static async generatePdfEmbedding(filePath: string, mimeType = "application/pdf"): Promise<number[]> {
    const aiClient = this.getClient();

    try {
      logger.info(` Sending raw PDF to Gemini for native embedding...`);
      
      const pdfPart = {
        inlineData: {
          data: fs.readFileSync(filePath).toString("base64"),
          mimeType
        }
      };

      const response = await aiClient.models.embedContent({
        model: "gemini-embedding-2", 
        contents: pdfPart, 
      });

      const embeddingValues = response.embeddings?.[0]?.values;

      if (!embeddingValues) {
        throw new Error("API response did not contain embedding values.");
      }

      return embeddingValues; 
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
