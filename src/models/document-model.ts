import { query } from '../config/database';

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_path: string | null;
  status: DocumentStatus;
  created_at: Date;
  updated_at: Date;
}

export const DocumentModel = {
  async findById(id: string): Promise<Document | null> {
    const result = await query('SELECT * FROM documents WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUserId(userId: string): Promise<Document[]> {
    const result = await query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async findAll(): Promise<Document[]> {
    const result = await query('SELECT * FROM documents ORDER BY created_at DESC');
    return result.rows;
  },

  async create(userId: string, title: string, filePath?: string): Promise<Document> {
    const result = await query(
      'INSERT INTO documents (user_id, title, file_path) VALUES ($1, $2, $3) RETURNING *',
      [userId, title, filePath || null]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<Pick<Document, 'title' | 'status'>>): Promise<Document | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (data.title !== undefined) {
      fields.push(`title = $${i++}`);
      values.push(data.title);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${i++}`);
      values.push(data.status);
    }

    if (fields.length === 0) return await this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE documents SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM documents WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  },
};