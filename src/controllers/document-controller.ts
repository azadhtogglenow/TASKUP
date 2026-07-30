import { Request, Response, NextFunction } from 'express';
import * as documentService from '../services/document-Service';
import { ApiResponse, DocumentWithUser, DocumentListResponse } from '../types';


export async function createDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    const document = await documentService.createDocument({
      ...req.body,
      userId: req.user.userId,
    });

    const response: ApiResponse<DocumentWithUser> = {
      success: true,
      data: document,
      message: 'Document created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getDocuments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = req.query as {
      page?: number;
      limit?: number;
      status?: 'draft' | 'published' | 'archived';
      search?: string;
      userId?: string;
    };
    const filterUserId = req.user?.role !== 'admin' ? req.user?.userId : query.userId;

    const result = await documentService.getDocuments({
      ...query,
      userId: filterUserId,
    });

    const response: ApiResponse<DocumentListResponse> = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}


export async function getDocumentById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    const document = await documentService.getDocumentById(req.params.id, req.user);

    const response: ApiResponse<DocumentWithUser> = {
      success: true,
      data: document,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    const document = await documentService.updateDocument(
      req.params.id,
      req.body,
      req.user
    );

    const response: ApiResponse<DocumentWithUser> = {
      success: true,
      data: document,
      message: 'Document updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
export async function deleteDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    await documentService.deleteDocument(req.params.id, req.user);

    const response: ApiResponse = {
      success: true,
      message: 'Document deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}