import bcrypt from "bcrypt";
import { SignupInput } from "../schemas/authSchema";
import { User, UserRole } from "../types/user";
import { env } from "../config/env";

const users: Map<number, User> = new Map();
let nextId = 1;

export const userModel = {
  async create(data: SignupInput, role: UserRole = "user"): Promise<User> {
    for (const user of users.values()) {
      if (user.email === data.email) {
        throw new Error("EMAIL_EXISTS");
      }
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);

    const user: User = {
      id: nextId++,
      name: data.name,
      email: data.email,
      passwordHash,
      role,
      createdAt: new Date(),
    };

    users.set(user.id, user);
    return user;
  },

  findByEmail(email: string): User | undefined {
    for (const user of users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  },

  findById(id: number): User | undefined {
    return users.get(id);
  },

  exists(id: number): boolean {
    return users.has(id);
  },

  async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  },

  async seedAdmin(): Promise<void> {
    const adminEmail = "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123456"; // Fallback for dev only

    if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === "production") {
      console.warn("ADMIN_PASSWORD not set. Using default (unsafe in production)");
    }

    const adminExists = this.findByEmail(adminEmail);
    if (!adminExists) {
      await this.create(
        {
          name: "Admin",
          email: adminEmail,
          password: adminPassword,
        },
        "admin"
      );
      console.log("Admin user seeded");
    }
  },
};