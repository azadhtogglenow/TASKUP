import express, { Application } from "express";
import documentRoutes from "../routes/documentRoutes";

const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(express.json());

  // Routes
  app.use("/documents", documentRoutes);

  return app;
};

export default createApp;