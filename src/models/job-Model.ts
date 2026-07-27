import { query } from '../config/database';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  user_id: string;
  document_id: string | null;
  type: string;
  status: JobStatus;
  result: string | null;
  created_at: Date;
  completed_at: Date | null;
}

export const JobModel = {
  async findById(id: string): Promise<Job | null> {
    const result = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUserId(userId: string): Promise<Job[]> {
    const result = await query(
      'SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async findByDocumentId(documentId: string): Promise<Job[]> {
    const result = await query(
      'SELECT * FROM jobs WHERE document_id = $1 ORDER BY created_at DESC',
      [documentId]
    );
    return result.rows;
  },

  async findAll(): Promise<Job[]> {
    const result = await query('SELECT * FROM jobs ORDER BY created_at DESC');
    return result.rows;
  },

  async create(userId: string, type: string, documentId?: string): Promise<Job> {
    const result = await query(
      'INSERT INTO jobs (user_id, document_id, type) VALUES ($1, $2, $3) RETURNING *',
      [userId, documentId || null, type]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<Pick<Job, 'status' | 'result'>>): Promise<Job | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${i++}`);
      values.push(data.status);
      if (data.status === 'completed' || data.status === 'failed') {
        fields.push(`completed_at = NOW()`);
      }
    }
    if (data.result !== undefined) {
      fields.push(`result = $${i++}`);
      values.push(data.result);
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    const result = await query(
      `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },
};