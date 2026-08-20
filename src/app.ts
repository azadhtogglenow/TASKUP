import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/index.js";
import { authMiddleware } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import uploadRoutes from "./routes/upload-routes.js";
import statusRoutes from "./routes/status-routes.js";
import searchRoutes from "./routes/search-routes.js";
import { logger } from "./utils/logger.js";
import summarizeRouter from "./routes/summarize-routes.js"

const app = express();

app.use(helmet());
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "X-API-Key"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.server.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api/upload", authMiddleware, uploadRoutes);
app.use("/api/status", authMiddleware, statusRoutes);
app.use("/api",searchRoutes);
app.use("/api/summarize", summarizeRouter);

export async function setupBullBoard() {
  try {
    const { createBullBoard } = await import("@bull-board/api");
    const { ExpressAdapter } = await import("@bull-board/express");
    const { BullMQAdapter } = await import("@bull-board/api/bullMQAdapter.js");
    const { documentQueue } = await import("./queue/producer.js");

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath(config.bullBoard.path);

    createBullBoard({
      queues: [new BullMQAdapter(documentQueue)] as any[],
      serverAdapter,
    });

    app.use(config.bullBoard.path, serverAdapter.getRouter());

    logger.info(` Bull Board available at http://localhost:${config.server.port}${config.bullBoard.path}`);
  } catch (error) {
    logger.error(`Failed to setup Bull Board: ${error}`);
  }
}

export function initErrorHandlers() {
  app.use(notFoundHandler);
  app.use(errorHandler);
}

export default app;
