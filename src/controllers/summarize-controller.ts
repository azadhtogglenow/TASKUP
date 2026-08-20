import { Request, Response } from "express";
import { ParserService } from "../services/parser-service.js";
import { LlmService } from "../services/llm-service.js";
import { logger } from "../utils/logger.js";

export class SummarizeController {
  static async handleSummarize(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "No file provided in the payload." });
        return;
      }
      const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
      
      if (fileExtension !== "pdf" && fileExtension !== "docx") {
        res.status(400).json({ 
          error: `Unsupported file extension '.${fileExtension}'. Only PDF and DOCX files are allowed.` 
        });
        return;
      }
      const rawExtractedText = await ParserService.parse(
        file.buffer,
        fileExtension, 
        file.originalname
      ); 
      const cleanedText = ParserService.cleanText(rawExtractedText);
      const summary = await LlmService.summarizeText(cleanedText);
      res.status(200).json({
        filename: file.originalname,
        characterCount: cleanedText.length,
        summary: summary,
      });
      
    } catch (error: any) {
      logger.error(`Controller caught endpoint process crash: ${error.message}`);
      
      if (error.message.includes("MALFORMED_PDF") || error.message.includes("signature")) {
        res.status(422).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: "Internal processing engine breakdown.", details: error.message });
    }
  }
}
