import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';


export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}


export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {

  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  
  if (err.name === 'ZodError') {
    const response: ApiResponse = {
      success: false,
      error: 'Validation error',
    };
    res.status(400).json(response);
    return;
  }

  
  console.error(' Unexpected error:', err);

  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  };

  res.status(500).json(response);
}


export function notFoundHandler(_req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: 'Route not found',
  };
  res.status(404).json(response);
}