import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  file_path: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
});

export const createChunkSchema = z.object({
  document_id: z.string().uuid('Invalid document ID'),
  content: z.string().min(1, 'Content is required'),
  chunk_index: z.number().int().min(0),
});

export const createJobSchema = z.object({
  document_id: z.string().uuid('Invalid document ID').optional(),
  type: z.string().min(1, 'Job type is required'),
});

export const updateJobSchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
  result: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateChunkInput = z.infer<typeof createChunkSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;