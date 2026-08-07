import { Request, Response, NextFunction } from 'express';
import { createDocumentSchema, searchDocumentSchema, CreateDocumentInput, SearchDocumentInput } from '../types/index.js';
import * as documentService from '../services/document-Service.js';


export async function createDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData: CreateDocumentInput = createDocumentSchema.parse(req.body);
    const userId = req.user!.userId;
    const result = await documentService.createDocument(userId, validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}


export async function getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await documentService.getUserDocuments(userId);
    res.status(200).json({
      success: true,
      message: 'Documents retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}


export async function getDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const docId = req.params.id;
    const userId = req.user!.userId;
    
    const result = await documentService.getDocumentById(docId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Document retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}


export async function searchDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData: SearchDocumentInput = searchDocumentSchema.parse(req.body);
    const userId = req.user!.userId;
    
    const result = await documentService.searchDocuments(userId, validatedData);
    
    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}


export async function deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const docId = req.params.id;
    const userId = req.user!.userId;
    
    await documentService.deleteDocument(docId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}