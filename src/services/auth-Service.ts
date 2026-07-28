import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, User, UserSafe } from '../models/user-Model';
import { RegisterInput, LoginInput } from '../validators/schemas';

export interface AuthPayload {
  user: UserSafe;
  token: string;
}

export const AuthService = {
  async register(input: RegisterInput): Promise<AuthPayload> {
    const existing = await UserModel.findByEmail(input.email);
    if (existing) {
      throw new Error('Email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await UserModel.create(input.email, passwordHash);
    const token = this.generateToken(user);
    return { user, token };
  },

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await UserModel.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const safeUser = UserModel.toSafe(user);
    const token = this.generateToken(safeUser);
    return { user: safeUser, token };
  },

  generateToken(user: UserSafe): string {
    return jwt.sign(
      { id: user.id, email: user.role }, // Payload
      process.env.JWT_SECRET || 'secret', // Secret
      { 
    
        expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any 
      }
    );
  },

  verifyToken(token: string): UserSafe {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret') as UserSafe;
  },
};