import { pgTable, uuid, varchar, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { index, customType } from "drizzle-orm/pg-core"; 

// 1. Create a custom type handler to support pgvector's halfvec data type
const halfvec = customType<{ data: number[]; config: { dimensions: number } }>({
  dataType: (config) => `halfvec(${config?.dimensions})`,
  toDriver: (value) => JSON.stringify(value),
  fromDriver: (value) => JSON.parse(value as string),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: varchar("filename", { length: 255 }).notNull(),
  filetype: varchar("filetype", { length: 10 }).notNull(),
  filesize: integer("filesize").notNull(),
  s3Key: varchar("s3_key", { length: 500 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("uploaded"),
  errorMessage: text("error_message"),
  chunkCount: integer("chunk_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("documents_status_idx").on(table.status),
  index("documents_created_at_idx").on(table.createdAt),
]);

export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documents.id, {
    onDelete: "cascade", 
  }),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  
  // 3072 dimensions allowed through half-precision storage
  embedding: halfvec("embedding", { dimensions: 3072 }), 
  
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("document_chunks_document_id_idx").on(table.documentId),
  
  // FIXED: Changed vector_cosine_ops to halfvec_cosine_ops
  index("document_chunks_embedding_ivfflat_idx").using(
    "ivfflat",
    table.embedding.op("halfvec_cosine_ops")
  ),
]);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;
