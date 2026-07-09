import express, { Application } from "express";
import documentRoutes from "../routes/documentRoutes";
import authRoutes from "../routes/authRoutes";

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