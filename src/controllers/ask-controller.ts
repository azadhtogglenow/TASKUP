// C:\Users\Azadh-desktop\OneDrive\Desktop\document-api\src\controllers\ask-controller.ts
import { Request, Response, NextFunction } from "express";
import { AskService } from "../services/ask-service.js";
import { logger } from "../utils/logger.js";

export class AskController {
  static async handleAsk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question } = req.body;

      if (!question || typeof question !== "string" || question.trim() === "") {
        res.status(400).json({
          error: "Bad Request",
          message: "The property 'question' must be a non-empty string inside the request body."
        });
        return;
      }

      const result = await AskService.answerQuestion(question.trim());
      
      res.status(200).json(result);
    } catch (error: any) {
      logger.error(`AskController Error: ${error.message}`);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message || "An unexpected error occurred while processing your question."
      });
    }
  }
}
