import { GoogleGenAI } from "@google/genai";
import { VectorService } from "./vector-service.js";
import { logger } from "../utils/logger.js";
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  logger.error("System configuration error: GEMINI_API_KEY is missing from environment variables.");
}
const ai = new GoogleGenAI({ apiKey: geminiApiKey });
export class SynthesisService {
  static async summarizeDocument(documentId: string): Promise<string> {
    logger.info(`Starting synthesis generation for document: ${documentId}`);

    if (!geminiApiKey) {
      throw new Error("Gemini API key is not configured on the server environment variables");
    }

    const chunks = await VectorService.getChunksByDocumentId(documentId);
    if (!chunks || chunks.length === 0) {
      throw new Error(`No document text content found for ID: ${documentId}`);
    }

    const fullText = chunks.map((chunk) => chunk.content).join("\n\n");
    logger.info(`Consolidated ${chunks.length} chunks (${fullText.length} characters) for processing`);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Provide a clear, cohesive, and comprehensive summary of the following document text. Highlight key topics, findings, and major takeaways:\n\n${fullText}`
              }
            ]
          }
        ]
      });

      if (!response.text) {
        throw new Error("Received an empty response payload from Gemini API");
      }

      return response.text;
    } catch (error) {
      logger.error(`Gemini API text synthesis failed: ${error}`);
      throw new Error(`Failed to generate summary: ${error}`);
    }
  }
}
