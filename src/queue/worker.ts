import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis";
import { DOCUMENT_QUEUE_NAME } from "../types/job";
import { DocumentProcessingJobData, DocumentProcessingJobResult } from "../types/job";
import { processDocument } from "./processor";
import { logger } from "../utils/logger";
import { db } from "../db";
import { documents } from "../db/schema";
import { eq } from "drizzle-orm";
import dotenv from 'dotenv'
dotenv.config();


export const documentWorker = new Worker<DocumentProcessingJobData,DocumentProcessingJobResult,string>(DOCUMENT_QUEUE_NAME,
  async (job: Job<DocumentProcessingJobData, DocumentProcessingJobResult, string>) => {
    logger.info(` Processing job ${job.id} for document ${job.data.documentId}`);
  
    await db
      .update(documents)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(documents.id, job.data.documentId));
    
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

      await db
        .update(documents)
        .set({
          status: "failed",
          errorMessage: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, job.data.documentId));
      
      logger.error(` Job ${job.id} failed: ${errorMessage}`);
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

documentWorker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed: ${err.message}`);
  logger.error(`Document ID: ${job?.data?.documentId}`);
  logger.error(`Attempt: ${job?.attemptsMade}/${job?.opts?.attempts}`);
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
  logger.info("Worker stopped!");
}
startWorker().catch((err) => {
  logger.error(`Failed to start worker execution: ${err.message}`);
});
