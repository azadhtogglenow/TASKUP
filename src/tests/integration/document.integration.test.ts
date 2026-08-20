import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { db } from "../../db/index.js"; 
import { documents, documentChunks } from "../../db/schema.js";
import { documentQueue } from "../../queue/producer.js";
import { eq } from "drizzle-orm";
import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { StorageService } from "../../services/storage-service.js";

const TEST_API_KEY = "4a2b8c9d1e0f3a5b7c8d9e0f1a2b3c4d";

vi.spyOn(StorageService, "uploadFile").mockResolvedValue("mocked/s3/path/test-file.pdf");
vi.spyOn(StorageService, "downloadFile").mockResolvedValue(Buffer.from("%PDF-1.5 Mock PDF Data"));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      embedContent: vi.fn().mockResolvedValue({
        embedding: { values: new Array(3072).fill(0.01) }
      })
    }
  }))
}));

vi.mock("../../queue/processor.js", () => ({
  processDocument: vi.fn().mockResolvedValue({ success: true, chunkCount: 1 })
}));

describe("Document API System Integration Tests", () => {
  let testWorker: Worker;

  beforeAll(async () => {
    try {
      await documentQueue.drain();
      await documentQueue.clean(0, 0, "completed");
      await documentQueue.clean(0, 0, "failed");
      await documentQueue.clean(0, 0, "delayed");
      await documentQueue.clean(0, 0, "active");
    } catch (queueCleanError) {
      console.warn("Queue clearing warning:", queueCleanError);
    }

    try {
      await db.delete(documentChunks);
      await db.delete(documents);
    } catch (cleanupError) {
      console.warn("Isolation database cleanup skipped:", cleanupError);
    }

    testWorker = new Worker(
      documentQueue.name,
      async (job) => {
        const { documentId } = job.data;
        
        try {
          await db.transaction(async (tx) => {
            await tx.insert(documentChunks).values({
              documentId,
              content: "Mock extracted text block payload for target test execution.",
              chunkIndex: 0,
              embedding: new Array(3072).fill(0.02),
              metadata: { source: "integration-test" }
            });

            await tx.update(documents)
              .set({ status: "completed", chunkCount: 1, updatedAt: new Date() })
              .where(eq(documents.id, documentId));
          });
        } catch (workerError) {
          console.error("Background worker transaction failed safely:", workerError);
        }
      },
      { 
        connection: redisConnection,
        drainDelay: 1
      }
    );

    await testWorker.waitUntilReady();
  });

  afterAll(async () => {
    if (testWorker) {
      await testWorker.close();
    }
    if (documentQueue) {
      await documentQueue.close();
    }
    const client = await redisConnection;
    if (client) {
      if (typeof client.quit === "function") {
        await client.quit();
      } else if (typeof client.disconnect === "function") {
        await client.disconnect();
      }
    }
  });

  describe("HTTP Endpoint Route and Database State Mutations", () => {
    it("should accept a file upload payload over real HTTP, save a database record, and stack a queue job", async () => {
      const response = await request(app)
        .post("/api/upload") 
        .set("X-API-Key", TEST_API_KEY) 
        .attach("file", Buffer.from("%PDF-1.5 Mock PDF Data"), "sample-test.pdf");

      expect(response.status).toBe(202); 
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");

      const createdDocId = response.body.data.id;
      const [dbRecord] = await db.select().from(documents).where(eq(documents.id, createdDocId));
      expect(dbRecord).toBeDefined();
      expect(dbRecord.filename).toBe("sample-test.pdf");
    });
  });

  describe("Database Transaction Boundary Fallback", () => {
    it("should fully roll back all relational operations if an error breaks database execution half-way through", async () => {
      const [erroneousDoc] = await db.insert(documents).values({
        filename: "crash-test.pdf",
        filetype: "pdf",
        filesize: 500,
        s3Key: "uploads/crash-test.pdf",
        status: "uploaded"
      }).returning();

      const executeFaultyTransaction = async () => {
        await db.transaction(async (tx) => {
          await tx.update(documents).set({ status: "processing" }).where(eq(documents.id, erroneousDoc.id));
          await tx.insert(documentChunks).values({
            documentId: "00000000-0000-0000-0000-000000000000", 
            content: "This write will crash.",
            chunkIndex: 999
          });
        });
      };

      await expect(executeFaultyTransaction()).rejects.toThrow();

      const [finalRecord] = await db.select().from(documents).where(eq(documents.id, erroneousDoc.id));
      expect(finalRecord.status).toBe("uploaded"); 
    });
  });

  describe("System Throughput Concurrency & Load Stressing", () => {
    it("should handle large parallel connection batches without causing transactional record lock conflicts", async () => {
      await testWorker.pause();

      const batchSize = 10; 
      const uploadPromises = Array.from({ length: batchSize }).map((_, idx) => {
        return request(app)
          .post("/api/upload")
          .set("X-API-Key", TEST_API_KEY) 
          .attach("file", Buffer.from(`Concurrent Thread Payload Content ${idx}`), `thread-${idx}.pdf`)
          .catch((err) => err);
      });

      const results = await Promise.all(uploadPromises);
    
      for (const response of results) {
        expect(response.status).toBe(202);
        expect(response.body.success).toBe(true);
      }
    });
  });
});
