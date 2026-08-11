import { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../db"; 
import { documents } from "../db/schema"; 
import { DocumentProcessingJobData, DocumentProcessingJobResult, DocumentProcessingProgress } from "../types/job";
import { logger } from "../utils/logger";
import { StorageService } from "../services/storage-service";
import { ParserService } from "../services/parser-service";
import { ChunkerService } from "../services/chunker-service";
import { EmbeddingService } from "../services/embedding-service";
import { VectorService } from "../services/vector-service";

export async function processDocument(data: DocumentProcessingJobData,job: Job<DocumentProcessingJobData, DocumentProcessingJobResult, string>
): Promise<DocumentProcessingJobResult> {
  const { documentId, s3Key, filename, filetype } = data;
  
  logger.info(`\n${"=".repeat(50)}`);
  logger.info(`Processing: ${filename}`);
  logger.info(`Document ID: ${documentId}`);
  logger.info(`${"=".repeat(50)}\n`);

  try {

    updateProgress(job, {
      stage: "downloading",
      current: 0,
      message: `Downloading ${filename} from storage...`,
    });

    logger.info(" Step 1: Downloading file from S3...");
    const fileBuffer = await StorageService.downloadFile(s3Key);
    logger.info(`Downloaded ${fileBuffer.length} bytes`);
    logger.info(`AWS ERROR SNIPPET: \n${fileBuffer.subarray(0, 400).toString("utf-8")}\n`);

    updateProgress(job, {
      stage: "parsing",
      current: 1,
      message: `Parsing ${filetype.toUpperCase()} document...`,
    });

    logger.info(" Step 2: Parsing document...");
    const parsedText = await ParserService.parse(fileBuffer, filetype, filename);
    logger.info(`   Parsed ${parsedText.length} characters of text`);

    // Guard against empty extractions
    if (parsedText.trim().length === 0) {
      throw new Error("EMPTY_TEXT_EXTRACTION: No text content could be extracted from this document.");
    }


    updateProgress(job, {
      stage: "chunking",
      current: 2,
      message: "Splitting text into chunks...",
    });

    logger.info("Step 3: Chunking text...");
    const chunks = await ChunkerService.splitText(parsedText);
    logger.info(`   Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new Error("EMPTY_CHUNKS: Document text produced zero chunk fragments.");
    }

    updateProgress(job, {
      stage: "embedding",
      current: 3,
      total: chunks.length,
      message: `Generating embeddings (0/${chunks.length})...`,
    });

    logger.info("Step 4: Generating embeddings...");
    const embeddings = await EmbeddingService.generateEmbeddings(
      chunks,
      (current) => {
        updateProgress(job, {
          stage: "embedding",
          current: 3,
          total: chunks.length,
          message: `Generating embeddings (${current}/${chunks.length})...`,
        });
      }
    );
    logger.info(`   Generated ${embeddings.length} embeddings`);
    updateProgress(job, {
      stage: "storing",
      current: 4,
      total: chunks.length,
      message: "Storing chunks in database...",
    });

    logger.info("Step 5: Storing in database...");
    await VectorService.storeChunks(documentId, chunks, embeddings);
    logger.info(`   Stored ${chunks.length} chunks with embeddings`);

    updateProgress(job, {
      stage: "completed",
      current: 5,
      total: 5,
      message: "Processing complete!",
    });

    logger.info(`\n Document processing complete!`);
    logger.info(`Chunks: ${chunks.length}`);
    logger.info(`${"=".repeat(50)}\n`);

    return {
      documentId,
      chunkCount: chunks.length,
      success: true,
    };

  }catch (error: any) {
  const errorMessage = error.message || String(error);
  logger.error(` Pipeline failed on document ${documentId}: ${errorMessage}`);

  try {
    await db
      .update(documents)
      .set({
        status: "failed", 
        errorMessage: errorMessage.substring(0, 500), 
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));
  } catch (dbError) {
    logger.error(`Drizzle status sync failed: ${dbError}`);
  }
  const fatalErrors = [
    "MALFORMED_PDF", 
    "EMPTY_TEXT_EXTRACTION", 
    "EMPTY_CHUNKS", 
    "INVALID_STORAGE_FILE",
    "bad XRef entry",          
    "Command token too long"  
  ];
  const isFatal = fatalErrors.some(flag => errorMessage.includes(flag));

  if (isFatal) {
    return {
      documentId,
      chunkCount: 0,
      success: false,
      errorMessage
    } as any;
  }
  throw error;
}


function updateProgress(
  job: Job,
  progress: DocumentProcessingProgress
): void {
  job.updateProgress(progress).catch(err => logger.warn(`Failed updating job execution metrics: ${err.message}`));
}
}
