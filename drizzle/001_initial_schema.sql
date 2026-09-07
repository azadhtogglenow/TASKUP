-- migrations/001_initial_schema.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  filetype VARCHAR(10) NOT NULL,
  filesize INTEGER NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'uploaded',
  error_message TEXT,
  chunk_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(3072),
  content_search tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce("content", ''))) STORED,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

CREATE INDEX IF NOT EXISTS document_chunks_content_search_idx 
ON document_chunks USING gin(content_search);

CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx 
ON document_chunks(document_id);

CREATE INDEX IF NOT EXISTS document_chunks_doc_chunk_idx 
ON document_chunks(document_id, chunk_index);