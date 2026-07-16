import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import documentRoutes from "./routes/documentRoutes";
import authRoutes from "./routes/authRoutes";
import { userModel } from "./models/userModel";
import { env, isDev } from "./config/env";
import { generalLimiter, authLimiter } from "./middleware/rateLimiter";

const createApp = async (): Promise<Application> => {
  const app = express();
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          frameAncestors: ["'none'"], 
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "same-origin" },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
    })
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

       
        const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) =>
          o.trim()
        );

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS not allowed"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["RateLimit-Remaining", "RateLimit-Reset"],
      credentials: true,
      maxAge: 86400, 
    })
  );
  app.use(express.json({ limit: "10kb" })); 
  app.use(generalLimiter);
  await userModel.seedAdmin();
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });
  app.get("/", (req, res) => {
    res.json({
      message: "API is running",
      version: "1.0.0",
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
  app.use("/auth", authLimiter, authRoutes);
  app.use("/documents", documentRoutes);
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.message === "CORS not allowed") {
      res.status(403).json({
        message: "CORS: Origin not allowed",
      });
      return;
    }
    next(err);
  });
  app.use((req, res) => {
    res.status(404).json({
      message: `Route ${req.method} ${req.path} not found`,
    });
  });
  app.use(
    (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(" Error:", err.message);

     
      const message = isDev ? err.message : "Internal server error";

      res.status(500).json({
        message,
        ...(isDev && { stack: err.stack }),
      });
    }
  );

  return app;
};
export default createApp;