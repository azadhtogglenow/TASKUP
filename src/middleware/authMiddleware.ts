import { Request, Response, NextFunction } from "express";
import { jwtUtils, JwtPayload } from "../utils/jwt";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
        code: "MISSING_TOKEN"
      });
      return;
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwtUtils.verify(token);
    req.user = decoded;
    next();
  } catch (error) {
    const err = error as Error;
    console.error("Authentication error:", err.message);
    res.status(401).json({
      success: false,
      message: err.name === "TokenExpiredError" 
        ? "Token expired. Please login again." 
        : "Invalid or expired token.",
      code: err.name === "TokenExpiredError" 
        ? "TOKEN_EXPIRED" 
        : "INVALID_TOKEN"
    });
  }
};
