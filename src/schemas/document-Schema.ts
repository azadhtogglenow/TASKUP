import { z } from "zod";

export const documentSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters"),
    content: z.string().min(1, "Content is required"),
  })
  .strict();

export type DocumentInput = z.infer<typeof documentSchema>;