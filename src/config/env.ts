import dotenv from "dotenv";
import { z } from "zod";
dotenv.config(); 
const envSchema = z.object({
  PORT: z.coerce.number().default(9000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ADMIN_PASSWORD: z.string()
  .min(12, "Must be at least 12 characters")
  .regex(/[A-Z]/, "Must contain uppercase")
  .regex(/[a-z]/, "Must contain lowercase")
  .regex(/[0-9]/, "Must contain number")
  .regex(/[^A-Za-z0-9]/, "Must contain special character"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_MAX_LOGIN: z.coerce.number().default(5),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
export const isDev = env.NODE_ENV === "development";
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";