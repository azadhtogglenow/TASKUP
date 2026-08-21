// C:\Users\Azadh-desktop\OneDrive\Desktop\document-api\src\controllers\synopsis-controller.ts
import { Request, Response, NextFunction } from "express";
import { SynthesisService } from "../services/synthesis-service.js";
import { logger } from "../utils/logger.js";

export class SynopsisController {
  /**
   * HTTP Handler to process and return a document executive summary
   */
  static async handleGetSynopsis(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { documentId } = req.params;

    if (!documentId) {
      res.status(400).json({ error: "Missing required route parameter: documentId" });
      return;
    }

    try {
      const summary = await SynthesisService.summarizeDocument(documentId);
      
      res.status(200).json({
        success: true,
        documentId,
        synopsis: summary
      });
    } catch (error: any) {
      logger.error(`Error in SynopsisController: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        error: error.message || "An internal error occurred during synthesis" 
      });
    }
  }
}
