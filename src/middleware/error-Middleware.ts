import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';


export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}


export function errorHandler(err: AppError,req: Request,res: Response,next: NextFunction): void {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';
  
  res.status(statusCode).json({
    success: false,
    message,
    error: code,
  });
}


export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    error: 'NOT_FOUND',
  });
}