import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '../types/index.js';
import * as authService from '../services/auth-Service.js';


export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedData: RegisterInput = registerSchema.parse(req.body);
  
    const result = await authService.registerUser(validatedData);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}


export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
  
    const validatedData: LoginInput = loginSchema.parse(req.body);
    const result = await authService.loginUser(validatedData);
    
    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}


export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.user is set by authMiddleware
    const userId = req.user!.userId;
    
    // Call service
    const result = await authService.getUserProfile(userId);
    
    // Send response
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

//

export async function deleteUserCache(req: Request, res: Response, next: NextFunction): Promise<void> {
   const userId = req.user?.userId;
   if (!userId) {
     res.status(400).json({
       success: false,
       message: 'User information is missing in the request.',
       error: 'MISSING_USER',
     });
     return;
   }
   await authService.deleteUserCache({ id: userId, email: req.user!.email, role: req.user!.role });
   res.status(200).json({
     success: true,
     message: 'User cache deleted successfully',
   });
}

//logout
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
       res.status(200).json({
     success: true,
     message: 'Logout successful',
     user: req.user
   });
}