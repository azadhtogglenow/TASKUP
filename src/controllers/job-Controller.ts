import { Response } from 'express';
import { JobService } from '../services/job-Service';
import { createJobSchema, updateJobSchema } from '../validators/schemas';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth-Middleware';

export class JobController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const jobs = await JobService.getAll();
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getMine(req: AuthRequest, res: Response) {
    try {
      const jobs = await JobService.getUserJobs(req.user!.id);
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getByDocument(req: AuthRequest, res: Response) {
    try {
      const jobs = await JobService.getDocumentJobs(req.params.documentId);
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const job = await JobService.getById(req.params.id);
      res.json(job);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const input = createJobSchema.parse(req.body);
      const job = await JobService.create(req.user!.id, input);
      res.status(201).json(job);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const input = updateJobSchema.parse(req.body);
      const job = await JobService.update(req.params.id, input);
      res.json(job);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}

export const jobController = new JobController();
export const jobRoutes = {
  getAll: [authMiddleware, adminMiddleware, jobController.getAll.bind(jobController)],
  getMine: [authMiddleware, jobController.getMine.bind(jobController)],
  getByDocument: [authMiddleware, jobController.getByDocument.bind(jobController)],
  getById: [authMiddleware, jobController.getById.bind(jobController)],
  create: [authMiddleware, jobController.create.bind(jobController)],
  update: [authMiddleware, jobController.update.bind(jobController)],
};