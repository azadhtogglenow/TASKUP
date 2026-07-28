import { Response } from 'express';
import { DocumentService } from '../services/document-Service';
import { createDocumentSchema, updateDocumentSchema } from '../validators/schemas';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth-Middleware';

export class DocumentController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const docs = await DocumentService.getAll();
      res.json(docs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getMine(req: AuthRequest, res: Response) {
    try {
      const docs = await DocumentService.getUserDocuments(req.user!.id);
      res.json(docs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const doc = await DocumentService.getById(req.params.id);
      res.json(doc);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const input = createDocumentSchema.parse(req.body);
      const doc = await DocumentService.create(req.user!.id, input);
      res.status(201).json(doc);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const input = updateDocumentSchema.parse(req.body);
      const doc = await DocumentService.update(req.params.id, input);
      res.json(doc);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await DocumentService.delete(req.params.id);
      res.json({ message: 'Document deleted' });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }
}

export const documentController = new DocumentController();
export const documentRoutes = {
  getAll: [authMiddleware, adminMiddleware, documentController.getAll.bind(documentController)],
  getMine: [authMiddleware, documentController.getMine.bind(documentController)],
  getById: [authMiddleware, documentController.getById.bind(documentController)],
  create: [authMiddleware, documentController.create.bind(documentController)],
  update: [authMiddleware, documentController.update.bind(documentController)],
  delete: [authMiddleware, documentController.delete.bind(documentController)],
};