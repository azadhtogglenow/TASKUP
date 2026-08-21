import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { getStatus, listDocuments, getChunks } from "../../controllers/status-controller.js";
import { db } from "../../db/index.js";
import { AppError } from "../../middleware/error-handler.js";
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
  }
}));

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
  },
}));

describe("StatusController Unit Tests", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  describe("getStatus", () => {
    it("should pass AppError 404 to next middleware if document is missing", async () => {
      req = { params: { id: "invalid-id" } };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      await getStatus(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe("getChunks", () => {
    it("should pass AppError 400 to next middleware if status is not completed", async () => {
      req = { params: { id: "doc-1" } };

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "doc-1", status: "processing" }]),
      } as any);

      await getChunks(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
