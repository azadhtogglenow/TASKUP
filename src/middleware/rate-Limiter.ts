import rateLimit from "express-rate-limit";
import { env } from "../config/env";
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false, 
  message: {
    message: "Too many requests. Please try again later.",
  },
  skip: () => env.NODE_ENV === "test",
});
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: env.RATE_LIMIT_MAX_LOGIN,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  skip: () => env.NODE_ENV === "test",
});