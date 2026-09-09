import express from "express";
import { env } from "./config/env.js";
import { checkDatabase, closeDatabase, initDatabase } from "./db/index.js";
import agentRouter from "./routes/agent.js";
import { closeMcpClient } from "./mcp/client.js";

async function main() {
  await initDatabase();

  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      name: "agent-demo",
      endpoints: {
        health: "GET /health",
        functionCalling: 'POST /agent/function  { "message": "..." }',
        langgraph: 'POST /agent/langgraph { "message": "..." }',
      },
    });
  });

  app.get("/health", async (_req, res) => {
    try {
      await checkDatabase();
      res.json({
        status: "ok",
        database: "connected",
        uptimeSeconds: Math.round(process.uptime()),
      });
    } catch {
      res.status(503).json({ status: "error", database: "disconnected" });
    }
  });

  app.use("/agent", agentRouter);

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[http] unhandled error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    });
  });

  const server = app.listen(env.port, () => {
    console.log(`[server] agent-demo running at http://localhost:${env.port}`);
    console.log("[server]   GET  /health");
    console.log("[server]   POST /agent/function   (function calling, local tools)");
    console.log("[server]   POST /agent/langgraph  (LangGraph + calculator via MCP)");
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[server] received ${signal}, shutting down...`);
    server.close();
    await closeMcpClient().catch(() => undefined);
    await closeDatabase().catch(() => undefined);
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[server] fatal startup error:", err);
  process.exit(1);
});