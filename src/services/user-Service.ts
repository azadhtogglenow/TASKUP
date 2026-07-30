import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { RegisterRequest, LoginRequest, AuthResponse, JwtPayload } from '../types';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_SALT_ROUNDS = 12;


function generateToken(user: JwtPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);


  const [newUser] = await db
    .insert(users)
    .values({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: 'user',
    })
    .returning();


  const token = generateToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  const { password: _, ...userWithoutPassword } = newUser;

  return {
    user: userWithoutPassword,
    token,
  };
}


export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) {
    throw new AppError('Account has been deactivated. Contact admin.', 403);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
}

export async function getUserById(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}


export async function getAllUsers() {
  const allUsers = await db.select().from(users);

  return allUsers.map(({ password: _, ...user }) => user);
}


export async function verifyAdmin(email: string, password: string): Promise<boolean> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || user.role !== 'admin') {
    return false;
  }

  return bcrypt.compare(password, user.password);
}