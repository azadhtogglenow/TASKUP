import { query } from '../config/database';

export interface Chunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  created_at: Date;
}

export const ChunkModel = {
  async findByDocumentId(documentId: string): Promise<Chunk[]> {
    const result = await query(
      'SELECT * FROM chunks WHERE document_id = $1 ORDER BY chunk_index ASC',
      [documentId]
    );
    return result.rows;
  },

  async findById(id: string): Promise<Chunk | null> {
    const result = await query('SELECT * FROM chunks WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(documentId: string, content: string, chunkIndex: number): Promise<Chunk> {
    const result = await query(
      'INSERT INTO chunks (document_id, content, chunk_index) VALUES ($1, $2, $3) RETURNING *',
      [documentId, content, chunkIndex]
    );
    return result.rows[0];
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM chunks WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  },

  async deleteByDocumentId(documentId: string): Promise<number> {
    const result = await query('DELETE FROM chunks WHERE document_id = $1', [documentId]);
    return result.rowCount || 0;
  },
};