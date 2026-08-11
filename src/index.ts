import { config } from "./config";
import { testConnection, closePool } from "./db";
import { closeRedisConnection } from "./config/redis";
import app from "./app";
import { setupBullBoard } from "./app";
import { logger } from "./utils/logger";
import { Server } from "tls";

async function startServer() {
  logger.separator();
  logger.info(" Starting Document API Server...");
  logger.separator();

  try {
    await testConnection();
    await setupBullBoard();
    const { initErrorHandlers } = await import("./app.js");
    initErrorHandlers();

    app.listen(config.server.port, () => {
      logger.separator();
      logger.info("Server started successfully!");
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info(`Port: ${config.server.port}`);
      logger.info(`API: http://localhost:${config.server.port}/api`);
      logger.info(`Health: http://localhost:${config.server.port}/health`);
      logger.info(`Bull Board: http://localhost:${config.server.port}${config.bullBoard.path}`);
      logger.separator();
      logger.info(" Note: Start the worker in a separate terminal:");
      logger.info("npm run worker && npx tsx src/queue/worker.ts");
      logger.separator();
    });

  } catch (error) {
    logger.error(` Failed to start server: ${error}`);
    process.exit(1);
  }
}


async function gracefulShutdown(signal: string) {
  logger.info(`\n${signal} received. Shutting down gracefully...`);
  
  try {
    await closePool();
    await closeRedisConnection();
    logger.info("Cleanup complete. Goodbye!");
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error}`);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error}`);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  gracefulShutdown("unhandledRejection");
});
startServer();