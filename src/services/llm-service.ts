import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger.js";

export class LlmService {
  private static ai: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI {
    if (!this.ai) {
      logger.info("Initializing Official Google Gen AI SDK...");
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
      });
    }
    return this.ai;
  }

  static async summarizeText(documentText: string): Promise<string> {
    if (!documentText || documentText.trim().length === 0) {
      throw new Error("Document content is empty; cannot generate summary.");
    }

    logger.info("Routing document payload directly to Gemini 2.5 Flash...");

    try {
      const client = this.getClient();
      const truncatedText = documentText.substring(0, 300000);
      const response = await client.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an expert document analysis assistant. Provide a concise, well-structured summary of the following document. Use bullet points for key takeaways.\n\nDocument content:\n\n${truncatedText}`
              }
            ]
          }
        ]
      });

      if (!response.text) {
        throw new Error("Gemini returned an empty text payload response.");
      }

      logger.info("Gemini summary successfully generated.");
      return response.text;

    } catch (error: any) {
      logger.error(`Gemini Direct SDK Service Error: ${error.message || error}`);
      throw new Error(`LLM_PROCESSING_FAILED: ${error.message}`);
    }
  }
}
