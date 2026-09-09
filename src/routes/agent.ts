import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { runFunctionCallingAgent } from "../agents/function-calling/agent.js";
import { runLangGraphAgent } from "../agents/langgraph/graph.js";

const router = Router();

const bodySchema = z.object({
  message: z.string().min(1, '"message" is required'),
});

type AgentRunner = (message: string) => Promise<{
  answer: string;
  steps: unknown[];
  iterations: number;
}>;

async function handle(
  req: Request,
  res: Response,
  agentName: string,
  runner: AgentRunner
) {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Request body must be JSON like { "message": "your question" }' });
  }
  if (!env.openaiApiKey) {
    return res.status(500).json({
      error:
        "OPENAI_API_KEY is not set. Copy .env.example to .env and add your key.",
    });
  }

  const message = parsed.data.message;
  const startedAt = Date.now();

  try {
    const result = await runner(message);

    return res.json({
      agent: agentName,
      message,
      answer: result.answer,
      iterations: result.iterations,
      steps: result.steps,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error(`[agent:${agentName}] error:`, err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Agent failed" });
  }
}

router.post("/function", (req, res) =>
  void handle(req, res, "function-calling", runFunctionCallingAgent)
);
router.post("/langgraph", (req, res) =>
  void handle(req, res, "langgraph+mcp", runLangGraphAgent)
);

export default router;