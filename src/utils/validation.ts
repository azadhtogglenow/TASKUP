import { z } from 'zod';



export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(5, 'Email must be at least 5 characters')
      .max(255, 'Email must be at most 255 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be at most 100 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must be at most 255 characters')
      .trim(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});



export const createDocumentSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be at most 255 characters')
      .trim(),
    content: z.string().max(100000, 'Content is too long').default(''),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
  }),
});

export const updateDocumentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(255, 'Title must be at most 255 characters')
      .trim()
      .optional(),
    content: z.string().max(100000, 'Content is too long').optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  }),
});

export const documentIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
  }),
});

export const listDocumentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    search: z.string().max(255).optional(),
    userId: z.string().uuid().optional(),
  }),
});



export type ValidationSchema = z.ZodObject<{
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
}>;

import { Request, Response, NextFunction } from 'express';

export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
        return;
      }

      // Replace request properties with validated data
      if (result.data.body) req.body = result.data.body;
      if (result.data.params) req.params = result.data.params as any;
      if (result.data.query) req.query = result.data.query as any;

      next();
    } catch (error) {
      next(error);
    }
  };
}