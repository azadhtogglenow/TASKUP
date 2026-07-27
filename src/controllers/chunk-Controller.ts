import { Response } from 'express';
import { ChunkService } from '../services/chunk-Service';
import { createChunkSchema } from '../validators/schemas';
import { AuthRequest, authMiddleware } from '../middleware/auth-Middleware';

export class ChunkController {
  async getByDocument(req: AuthRequest, res: Response) {
    try {
      const chunks = await ChunkService.getByDocumentId(req.params.documentId);
      res.json(chunks);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const input = createChunkSchema.parse({ ...req.body, document_id: req.params.documentId });
      const chunk = await ChunkService.create(input);
      res.status(201).json(chunk);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await ChunkService.delete(req.params.id);
      res.json({ message: 'Chunk deleted' });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }
}

export const chunkController = new ChunkController();
export const chunkRoutes = {
  getByDocument: [authMiddleware, chunkController.getByDocument.bind(chunkController)],
  create: [authMiddleware, chunkController.create.bind(chunkController)],
  delete: [authMiddleware, chunkController.delete.bind(chunkController)],
};