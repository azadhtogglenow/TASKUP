import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { SearchController } from "../../controllers/search.controller.js";
import { EmbeddingService } from "../../services/embedding-service.js";
import { VectorService } from "../../services/vector-service.js";


vi.mock("../../services/embedding-service.js", () => ({
  EmbeddingService: {
    generateEmbeddings: vi.fn(),
  },
}));

vi.mock("../../services/vector-service.js", () => ({
  VectorService: {
    hybridSearch: vi.fn(),
  },
}));

describe("SearchController Unit Tests", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it("should return 400 if query parameter is empty string", async () => {
    req = { body: { query: "   " } };

    await SearchController.search(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it("should respond with matched vector chunks on success", async () => {
    req = { body: { query: "AI models", limit: "3", threshold: "0.2" } };

    vi.mocked(EmbeddingService.generateEmbeddings).mockResolvedValue([[0.1, 0.2, 0.3]]);
    vi.mocked(VectorService.hybridSearch).mockResolvedValue([
      { id: "chunk-1", content: "AI data chunk text", score: 0.9 } as any,
    ]);

    await SearchController.search(req as Request, res as Response);

    expect(VectorService.hybridSearch).toHaveBeenCalledWith("AI models", [0.1, 0.2, 0.3], 3, 0.2, undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 1 })
    );
  });
});
