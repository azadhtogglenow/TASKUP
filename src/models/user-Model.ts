import bcrypt from "bcrypt";
import { SignupInput } from "../schemas/auth-schema";

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const users: Map<number, User> = new Map();
let nextId = 1;

export const userModel = {
  async create(data: SignupInput): Promise<User> {
    // Check if email already exists
    for (const user of users.values()) {
      if (user.email === data.email) {
        throw new Error("EMAIL_EXISTS");
      }
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    const user: User = {
      id: nextId++,
      name: data.name,
      email: data.email,
      passwordHash,
      createdAt: new Date(),
    };

    users.set(user.id, user);
    return user;
  },

  findByEmail(email: string): User | undefined {
    for (const user of users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  },

  findById(id: number): User | undefined {
    return users.get(id);
  },

  exists(id: number): boolean {
    return users.has(id);
  },

  async verifyPassword(
    plainPassword: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  },
};