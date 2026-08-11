import { Table } from "drizzle-orm"
import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";
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
});

export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documents.id, {
    onDelete: "cascade", 
  }),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: vector("embedding", { dimensions: 3072 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;