import bcrypt from "bcrypt";
import { SignupInput } from "../schemas/auth-Schema";
import { User, UserRole } from "../types/user";

const users: Map<number, User> = new Map();
let nextId = 1;

export const userModel = {
  async create(data: SignupInput, role: UserRole = "user"): Promise<User> {
    for (const user of users.values()) {
      if (user.email === data.email) {
        throw new Error("EMAIL_EXISTS");
      }
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
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

  async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  },

  async seedAdmin(): Promise<void> {
    const adminExists = this.findByEmail("admin@example.com");
    if (!adminExists) {
      await this.create(
        {
          name: "Admin",
          email: "admin@example.com",
          password: "admin123456",
        },
        "admin"
      );
      console.log("Admin user seeded: admin@example.com / admin123456");
    }
  },
};