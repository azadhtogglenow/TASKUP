import { Request, Response } from 'express';
import { AuthService } from '../services/auth-Service';
import { UserModel } from '../models/user-Model';
import { registerSchema, loginSchema } from '../validators/schemas';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth-Middleware';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const input = registerSchema.parse(req.body);
      const result = await AuthService.register(input);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const input = loginSchema.parse(req.body);
      const result = await AuthService.login(input);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }

  async me(req: AuthRequest, res: Response) {
    try {
      const user = await UserModel.findById(req.user!.id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json(UserModel.toSafe(user));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async listUsers(req: AuthRequest, res: Response) {
    try {
      const users = await UserModel.findAll();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const authController = new AuthController();
export const authRoutes = {
  register: [authController.register.bind(authController)],
  login: [authController.login.bind(authController)],
  me: [authMiddleware, authController.me.bind(authController)],
  listUsers: [authMiddleware, adminMiddleware, authController.listUsers.bind(authController)],
};