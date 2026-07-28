import { JobModel, Job } from '../models/job-Model';
import { CreateJobInput, UpdateJobInput } from '../validators/schemas';

export const JobService = {
  async getById(id: string): Promise<Job> {
    const job = await JobModel.findById(id);
    if (!job) throw new Error('Job not found');
    return job;
  },

  async getUserJobs(userId: string): Promise<Job[]> {
    return JobModel.findByUserId(userId);
  },

  async getDocumentJobs(documentId: string): Promise<Job[]> {
    return JobModel.findByDocumentId(documentId);
  },

  async getAll(): Promise<Job[]> {
    return JobModel.findAll();
  },

  async create(userId: string, input: CreateJobInput): Promise<Job> {
    return JobModel.create(userId, input.type, input.document_id);
  },

  async update(id: string, input: UpdateJobInput): Promise<Job> {
    const job = await JobModel.update(id, input);
    if (!job) throw new Error('Job not found');
    return job;
  },
};