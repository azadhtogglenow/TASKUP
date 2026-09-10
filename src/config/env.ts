import "dotenv/config";
import { z } from "zod";
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  OPENAI_API_KEY: z.string().default("groq-free-mode-enabled"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_BASE_URL: z.string().trim().optional().transform((v) => v || undefined),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required for free inference execution"),
  GROQ_MODEL: z.string().default("qwen/qwen3.6-27b"),
  
  MAX_AGENT_ITERATIONS: z.coerce.number().int().positive().default(8),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "[env] Invalid environment configuration:",
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}

export const env = {
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  openaiApiKey: parsed.data.OPENAI_API_KEY,
  openaiModel: parsed.data.OPENAI_MODEL,
  openaiBaseUrl: parsed.data.OPENAI_BASE_URL,
  groqApiKey: parsed.data.GROQ_API_KEY,
  groqModel: parsed.data.GROQ_MODEL,
  maxAgentIterations: parsed.data.MAX_AGENT_ITERATIONS,
};
