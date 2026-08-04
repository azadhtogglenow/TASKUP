import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user-Service';
import { ApiResponse, AuthResponse } from '../types';


export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, name } = req.body;

    const result = await userService.registerUser({ email, password, name });

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'User registered successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}


export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const result = await userService.loginUser({ email, password });

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'Login successful',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}


export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    const user = await userService.getUserById(req.user.userId);

    const response: ApiResponse = {
      success: true,
      data: user,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'admin') {
      const response: ApiResponse = {
        success: false,
        error: 'Admin privileges required',
      };
      res.status(403).json(response);
      return;
    }

    const users = await userService.getAllUsers();

    const response: ApiResponse = {
      success: true,
      data: users,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}