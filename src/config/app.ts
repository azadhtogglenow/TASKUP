import express, { Application } from "express";
import documentRoutes from "../routes/document-Routes";
import authRoutes from "../routes/auth-Routes";

const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(express.json());

  // Routes
  app.use("/auth", authRoutes);
  app.use("/documents", documentRoutes);

  return app;
};

export default createApp;
