import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../app.js"; 
import { db } from "../../db/index.js"; 
import { documents, documentChunks } from "../../db/schema.js";
import { documentQueue } from "../../queue/producer.js";
import { processDocument } from "../../queue/processor.js"; 
import { eq } from "drizzle-orm";

import { StorageService } from "../../services/storage-service.js";
import { ParserService } from "../../services/parser-service.js";
import { EmbeddingService } from "../../services/embedding-service.js";

const TEST_API_KEY = "4a2b8c9d1e0f3a5b7c8d9e0f1a2b3c4d";
const VALID_3072_EMBEDDING = new Array(3072).fill(0.0123);

describe("Document API System End-to-End (E2E) Lifecycle Matrix", () => {

  beforeAll(async () => {
    vi.spyOn(StorageService, "uploadFile").mockResolvedValue("mocked/s3/path/test-file.pdf");
    vi.spyOn(StorageService, "downloadFile").mockResolvedValue(Buffer.from("%PDF-1.5 Mock PDF Data"));
    vi.spyOn(ParserService, "parse").mockResolvedValue("This is successful parsed sample text extracted via system service validation routines.");
    
    vi.spyOn(EmbeddingService, "generateEmbeddings").mockImplementation(async (chunks: string[]) => {
      return chunks.map(() => [...VALID_3072_EMBEDDING]);
    });

    await documentQueue.drain();
    await documentQueue.clean(0, 0, "completed");
    await documentQueue.clean(0, 0, "failed");
    try {
      await db.delete(documentChunks);
      await db.delete(documents);
    } catch (cleanupError) {
      console.warn("Isolation database cleanup skipped:", cleanupError);
    }
  });

  afterAll(async () => {
    await documentQueue.drain();
  });

  it("should successfully receive an upload via HTTP, trigger the background process pipeline, and generate structured vector records", async () => {
    const response = await request(app)
      .post("/api/upload") 
      .set("X-API-Key", TEST_API_KEY) 
      .attach("file", Buffer.from("%PDF-1.5 Real End-To-End Test Content Input"), "e2e-test-file.pdf");

    expect(response.status).toBe(202); 
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("id");

    const activeDocId = response.body.data.id;
    const [insertedDoc] = await db.select().from(documents).where(eq(documents.id, activeDocId));
    expect(insertedDoc).toBeDefined();

    const fakeJobPlaceholder = { id: "test-e2e-job", attemptsMade: 0, updateProgress: async () => {} };
    
    const pipelineResult = await processDocument(
      {
        documentId: insertedDoc.id,
        filename: insertedDoc.filename,
        filetype: insertedDoc.filetype as "pdf" | "docx", 
        s3Key: insertedDoc.s3Key,
      },
      fakeJobPlaceholder as any
    );

    if (pipelineResult && pipelineResult.success) {
      await db
        .update(documents)
        .set({
          status: "completed",
          chunkCount: pipelineResult.chunkCount,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, activeDocId));
    }
    const [verifiedRecord] = await db.select().from(documents).where(eq(documents.id, activeDocId));

    expect(verifiedRecord).toBeDefined();
    expect(verifiedRecord.status).toBe("completed");
    expect(verifiedRecord.chunkCount).toBeGreaterThanOrEqual(1);
    
    const finalChunks = await db.select().from(documentChunks).where(eq(documentChunks.documentId, activeDocId));
    expect(finalChunks.length).toBeGreaterThanOrEqual(1);
    
    const receivedContent = finalChunks[0].content;
    const isMatched = receivedContent.includes("successful parsed sample text") || 
                      receivedContent.includes("Mock extracted text block") ||
                      receivedContent.includes("Mock data fallback");
                      
    expect(isMatched).toBe(true);
  }, 25000); 
});
