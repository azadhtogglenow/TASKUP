import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

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
    const targetModel = "gemini-embedding-2";
    const targetDimension = 3072; 

    logger.info(`Generating embeddings for ${texts.length} chunks via Gemini (${targetModel}, target dimension: ${targetDimension})...`);
    const aiClient = this.getClient();

    try {
      const response = await aiClient.models.embedContent({
        model: targetModel,
        contents: texts,
        config: {
          outputDimensionality: 768 
        }
      });

      const embeddings: number[][] = (response.embeddings || []).map((emb) => {
        let values = emb.values || [];
        
        if (values.length < targetDimension) {
          const padding = new Array(targetDimension - values.length).fill(0);
          values = values.concat(padding);
        }
        
        return values;
      });
      
      if (onProgress) {
        onProgress(texts.length);
      }

      logger.info(`Progress: ${texts.length}/${texts.length}`);
      logger.info(`Generated ${embeddings.length} stable 3072-dimension vectors.`);
      return embeddings;

    } catch (error) {
      logger.error(`Batch embedding generation error: ${error}`);
      throw new Error(`Failed to generate batch embeddings: ${error}`);
    }
  }

  static async generatePdfEmbedding(filePath: string, mimeType = "application/pdf"): Promise<number[]> {
    const aiClient = this.getClient();
    const targetModel = "gemini-embedding-2";
    const targetDimension = 3072;

    try {
      logger.info(`Sending raw PDF to Gemini for native embedding...`);
      
      const pdfPart = {
        inlineData: {
          data: fs.readFileSync(filePath).toString("base64"),
          mimeType
        }
      };

      const response = await aiClient.models.embedContent({
        model: targetModel,
        contents: pdfPart, 
        config: {
          outputDimensionality: 768
        }
      });

      const firstEmbedding = response.embeddings?.[0];
      let embeddingValues = firstEmbedding?.values;

      if (!embeddingValues) {
        throw new Error("API response did not contain embedding values.");
      }

      // Pad out the PDF embedding vector to 3072
      if (embeddingValues.length < targetDimension) {
        const padding = new Array(targetDimension - embeddingValues.length).fill(0);
        embeddingValues = embeddingValues.concat(padding);
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
    logger.info("Gemini Embedding client initialized successfully!");
  }
}
