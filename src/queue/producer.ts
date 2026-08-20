import { Backoffs, delay, Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { DOCUMENT_QUEUE_NAME, DocumentProcessingJobData } from "../types/job.js";
import { logger } from "../utils/logger.js";

const documentQueue = new Queue(DOCUMENT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      count: 1000,
      age: 24 * 60 * 60,
    },
    removeOnFail: {
      count: 500,
    },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, 
    },
  },
});

export async function addDocumentJob(data: DocumentProcessingJobData): Promise<string> {
  logger.info(`Adding job for document: ${data.documentId}`);
  
  const job = await documentQueue.add("process-document", data, {
    jobId: `doc-${data.documentId}`,
    attempts : 3,
    backoff :{
      type : 'exponential',
      delay : 1000,
    }
  });
  
  logger.info(`Job added with ID: ${job.id}`);
  return job.id!;
}

export async function addBulkDocumentJobs(jobs: DocumentProcessingJobData[]): Promise<string[]> {
  logger.info(`Adding ${jobs.length} jobs to queue`);
  const jobIds: string[] = [];
  for (const jobData of jobs) {
    const jobId = await addDocumentJob(jobData);
    jobIds.push(jobId);
  }
  
  logger.info(`Added ${jobIds.length} jobs`);
  return jobIds;
}
export { documentQueue };