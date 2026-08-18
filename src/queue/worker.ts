import { Worker, Job, Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { DOCUMENT_QUEUE_NAME } from "../types/job.js";
import { DocumentProcessingJobData, DocumentProcessingJobResult } from "../types/job.js";
import { processDocument } from "./processor.js";
import { logger } from "../utils/logger.js";
import { db } from "../db/index.js";
import { documents } from "../db/schema.js";
import { eq } from "drizzle-orm";
import dotenv from 'dotenv'
dotenv.config();

const DOCUMENT_DLQ_NAME = `${DOCUMENT_QUEUE_NAME}-dlq`;
const dlqQueue = new Queue(DOCUMENT_DLQ_NAME, { connection: redisConnection,
  defaultJobOptions : {
    removeOnComplete:true
  }
 });

export const documentWorker = new Worker<DocumentProcessingJobData, DocumentProcessingJobResult, string>(
  DOCUMENT_QUEUE_NAME,
  async (job: Job<DocumentProcessingJobData, DocumentProcessingJobResult, string>) => {
    logger.info(` Processing job ${job.id} (Attempt ${job.attemptsMade + 1}) for document ${job.data.documentId}`);

    if (job.attemptsMade === 0) {
      await db
        .update(documents)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(documents.id, job.data.documentId));
    }
    
    try {
      const result = await processDocument(job.data, job);
      if (result && result.success === false) {
        logger.warn(`Job ${job.id} completed execution loop but reported file processing failure.`);
        return result; 
      }
      await db
        .update(documents)
        .set({
          status: "completed",
          chunkCount: result.chunkCount,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, job.data.documentId));
      
      logger.info(`Job ${job.id} completed. Chunks: ${result.chunkCount}`);
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const maxAttempts = job.opts.attempts || 1;
      const isFinalFailure = job.attemptsMade + 1 >= maxAttempts;

      await db
        .update(documents)
        .set({
          status: isFinalFailure ? "failed" : "retrying",
          errorMessage: `${errorMessage} (Attempt ${job.attemptsMade + 1}/${maxAttempts})`,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, job.data.documentId));
      
      logger.error(` Job ${job.id} failed attempt ${job.attemptsMade + 1}: ${errorMessage}`);
      throw error; 
    }
  },
   {
    connection: redisConnection,
    concurrency: 1,
    autorun: true, 
  }

);

documentWorker.on("completed", (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

documentWorker.on("failed", async (job, err) => {
  if (!job) return;

  logger.error(`Job ${job.id} failed: ${err.message}`);
  logger.error(`Document ID: ${job.data?.documentId}`);
  logger.error(`Attempt: ${job.attemptsMade}/${job.opts?.attempts}`);

  const maxAttempts = job.opts.attempts || 1;
  
  if (job.attemptsMade >= maxAttempts) {
    logger.warn(`Job ${job.id} exhausted all retries. Moving to Dead-Letter Queue: ${DOCUMENT_DLQ_NAME}`);
    
    try {
      await dlqQueue.add(
        `dlq-${job.name}`, 
        {
          ...job.data,
          failedReason: err.message,
          originalJobId: job.id,
          failedAt: new Date().toISOString()
        },
        {
          removeOnComplete: true
        }
      );
      logger.info(`Job ${job.id} successfully moved to DLQ.`);
    } catch (dlqError) {
      const dlqMsg = dlqError instanceof Error ? dlqError.message : "Unknown DLQ error";
      logger.error(`Failed to move Job ${job.id} to DLQ: ${dlqMsg}`);
    }
  }
});

documentWorker.on("ready", () => {
  logger.info("Worker is ready and listening for jobs");
});
documentWorker.on("closing", () => {
  logger.info("Worker is shutting down...");
});
documentWorker.on("error", (err) => {
  logger.error(`Worker error: ${err.message}`);
});

export async function startWorker(): Promise<void> {
  logger.info("Starting document processing worker...");
  logger.info("Worker initialization verified!");
}
export async function stopWorker(): Promise<void> {
  logger.info("Stopping worker...");
  await documentWorker.close();
  await dlqQueue.close(); 
  logger.info("Worker stopped!");
}
startWorker().catch((err) => {
  logger.error(`Failed to start worker execution: ${err.message}`);
});