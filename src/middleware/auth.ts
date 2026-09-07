import { Request, Response, NextFunction } from "express";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

declare global {
  namespace Express {
    interface Request {
      apiKey?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (config.server.nodeEnv === "development" && !config.server.apiKey) {
    return next();
  }
  const apiKey = req.headers["x-api-key"] as string || 
                 req.query.api_key as string;

  if (!apiKey) {
    logger.warn(`Auth failed: No API key provided for ${req.path}`);
    res.status(401).json({
      success: false,
      error: "API key required. Provide it in 'X-API-Key' header or 'api_key' query parameter.",
    });
    return;
  }

  if (apiKey !== config.server.apiKey) {
    logger.warn(`Auth failed: Invalid API key for ${req.path}`);
    res.status(403).json({
      success: false,
      error: "Invalid API key",
    });
    return;
  }
  req.apiKey = apiKey;
  next();
}