import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { uploadSingle } from "../../controllers/upload-controller.js";
import { db } from "../../db/index.js";
import { AppError } from "../../middleware/error-handler.js";
import { StorageService } from "../../services/storage-service.js"; // Import to reference in mocked()

vi.mock('ioredis', () => {
  const MockRedis = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    quit: vi.fn().mockResolvedValue('OK'),
  }));

  return {
    default: MockRedis,
    Redis: MockRedis,
  };
});

vi.mock("../../queue/producer.js", () => ({
  addDocumentJob: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
}));

vi.mock("../../services/storage-service.js", () => ({
  StorageService: {
    uploadFile: vi.fn().mockResolvedValue("mocked/s3/key/path.pdf"),
  },
}));
vi.mock("../../db/index.js", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue({}),
    })),
  },
}));

describe("UploadController Unit Tests", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it("should forward 400 AppError to next() if req.file is empty", async () => {
    req = { file: undefined };

    await uploadSingle(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });

  it("should process and accept supported application/pdf uploads", async () => {
    req = {
      file: {
        mimetype: "application/pdf",
        originalname: "doc.pdf",
        buffer: Buffer.from("pdf-data"),
        size: 1024,
      } as any,
    };

    await uploadSingle(req as Request, res as Response, next);
    expect(StorageService.uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      "doc.pdf",
      "application/pdf"
    );
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
