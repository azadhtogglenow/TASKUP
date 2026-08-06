import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, User, NewUser } from '../db/schemas.js';
import { getFromCache, setInCache, deleteFromCache, CacheKeys } from '../redis/cache.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken, JwtPayload } from '../utils/jwt.js';
import { RegisterInput, LoginInput, AuthResponse } from '../types/index.js';


async function findUserByEmail(email: string): Promise<User | null> {
  
  const cacheKey = CacheKeys.userByEmail(email);
  const cachedUser = await getFromCache<User>(cacheKey);
  
  if (cachedUser) {
    console.log(` Cache HIT for user: ${email}`);
    return cachedUser;
  }
  
  
  console.log(` Cache MISS for user: ${email}, querying database...`);
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  
  if (user) {
    await setInCache(cacheKey, user);
  }
  
  return user || null;
}


async function findUserById(id: string): Promise<User | null> {
  
  const cacheKey = CacheKeys.userById(id);
  const cachedUser = await getFromCache<User>(cacheKey);
  
  if (cachedUser) {
    console.log(` Cache HIT for user ID: ${id}`);
    return cachedUser;
  }
  
  
  console.log(` Cache MISS for user ID: ${id}, querying database...`);
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  
  
  if (user) {
    await setInCache(cacheKey, user);
  }
  
  return user || null;
}


export async function deleteUserCache(user: { id: string; email: string; role: string }): Promise<void> {
  const emailCacheKey = CacheKeys.userByEmail(user.email);
  const idCacheKey = CacheKeys.userById(user.id);

  await deleteFromCache(emailCacheKey);
  await deleteFromCache(idCacheKey);
}


export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  
  const existingUser = await findUserByEmail(input.email);
  if (existingUser) {
    const error = new Error('User with this email already exists') as Error & { statusCode: number; code: string };
    error.statusCode = 409;
    error.code = 'USER_EXISTS';
    throw error;
  }
  
  
  const hashedPassword = await hashPassword(input.password);
  
  
  const newUser: NewUser = {
    email: input.email,
    password: hashedPassword,
    name: input.name,
    role: input.role || 'user',
  };
  
  const [createdUser] = await db.insert(users).values(newUser).returning();
  
  
  await setInCache(CacheKeys.userByEmail(createdUser.email), createdUser);
  await setInCache(CacheKeys.userById(createdUser.id), createdUser);
  
  
  const payload: JwtPayload = {
    userId: createdUser.id,
    email: createdUser.email,
    role: createdUser.role,
  };
  
  const token = generateToken(payload);
  
  return {
    token,
    user: {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
    },
  };
}


export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  
  const user = await findUserByEmail(input.email);
  
  if (!user) {
    const error = new Error('Invalid email or password') as Error & { statusCode: number; code: string };
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }
  
  const isPasswordValid = await comparePassword(input.password, user.password);
  
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password') as Error & { statusCode: number; code: string };
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }
  
 
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  
  const token = generateToken(payload);
  
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}


export async function getUserProfile(userId: string) {
  const user = await findUserById(userId);
  
  if (!user) {
    const error = new Error('User not found') as Error & { statusCode: number; code: string };
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

