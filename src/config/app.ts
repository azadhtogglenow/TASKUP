import express, { Application } from "express";
import documentRoutes from "../routes/documentRoutes";
import authRoutes from "../routes/authRoutes";
import { userModel } from "../models/userModel";

const createApp = async (): Promise<Application> => {
  const app: Application = express();

  // Middleware
  app.use(express.json());

  // Seed admin user
  await userModel.seedAdmin();

  // Root route
  app.get("/", (req, res) => {
    res.json({
      message: "API is running",
      endpoints: {
        auth: {
          signup: "POST /auth/signup",
          login: "POST /auth/login",
          me: "GET /auth/me (protected)",
        },
        documents: {
          create: "POST /documents (protected)",
          getAll: "GET /documents (protected)",
          getById: "GET /documents/:id (protected)",
          update: "PUT /documents/:id (protected, owner only)",
          delete: "DELETE /documents/:id (protected, owner only)",
        },
      },
    });
  });

  // Routes
  app.use("/auth", authRoutes);
  app.use("/documents", documentRoutes);

  return app;
};

export default createApp;