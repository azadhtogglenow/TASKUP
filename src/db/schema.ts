import { pgTable, uuid, varchar, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { index, customType } from "drizzle-orm/pg-core"; 
const halfvec = customType<{ data: number[]; config: { dimensions: number } }>({
  dataType: (config) => `halfvec(${config?.dimensions})`,
  toDriver: (value) => {
    if (!value || !Array.isArray(value)) return null;
    return value; 
  },
  
  fromDriver: (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(Number);
    if (typeof value === 'string') {
      return value.replace(/[\[\]\{\}]/g, '').split(',').map(Number);
    }
    return [];
  },
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
  index("doc_chunks_doc_id_idx").on(table.documentId),
  
  index("doc_chunks_embed_cos_idx").using(
    "ivfflat",
    table.embedding.op("halfvec_cosine_ops")
  ),
]);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;
