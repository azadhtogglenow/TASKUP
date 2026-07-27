import { query } from '../config/database';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface UserSafe {
  id: string;
  email: string;
  role: UserRole;
  created_at: Date;
}

export const UserModel = {
  async findById(id: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async create(email: string, passwordHash: string, role: UserRole = 'user'): Promise<UserSafe> {
    const result = await query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email, passwordHash, role]
    );
    return result.rows[0];
  },

  async findAll(): Promise<UserSafe[]> {
    const result = await query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
    return result.rows;
  },

  toSafe(user: User): UserSafe {
    const { password_hash, ...safe } = user;
    return safe;
  },
};