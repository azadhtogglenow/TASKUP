export const config = {
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    apiKey: process.env.API_KEY || "",
  },
  database: {
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "documents",
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/documents",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    accessKey: process.env.S3_ACCESS_KEY || "minioadmin",
    secretKey: process.env.S3_SECRET_KEY || "minioadmin",
    bucket: process.env.S3_BUCKET || "documents",
    region: process.env.S3_REGION || "us-east-1",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  },
  bullBoard: {
    path: process.env.BULL_BOARD_PATH || "/admin/queues",
  },
  processing: {
    chunkSize: parseInt(process.env.CHUNK_SIZE || "1000", 10),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || "200", 10),
  },
  embedding: {
  model: process.env.EMBEDDING_MODEL || "gemini-embedding-2",
  dimension: parseInt(process.env.EMBEDDING_DIMENSION || "3072", 10),
},

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
} as const;

export type Config = typeof config;