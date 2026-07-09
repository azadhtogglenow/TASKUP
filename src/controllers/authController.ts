import { Request, Response } from "express";
import { userModel } from "../models/userModel";
import { signupSchema, loginSchema } from "../schemas/authSchema";
import { jwtUtils } from "../utils/jwt";

// Signup
export const signup = async (req: Request, res: Response): Promise<void> => {
  const result = signupSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Validation Failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const user = await userModel.create(result.data);

    const token = jwtUtils.sign({
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      message: "User created successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      res.status(409).json({
        message: "Email already exists",
      });
      return;
    }
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Validation Failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  const user = userModel.findByEmail(result.data.email);

  if (!user) {
    res.status(401).json({
      message: "Invalid email or password",
    });
    return;
  }

  const isValidPassword = await userModel.verifyPassword(
    result.data.password,
    user.passwordHash
  );

  if (!isValidPassword) {
    res.status(401).json({
      message: "Invalid email or password",
    });
    return;
  }

  const token = jwtUtils.sign({
    userId: user.id,
    email: user.email,
  });

  res.json({
    message: "Login successful",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      token,
    },
  });
};

// Get Current User (Protected)
export const getMe = (req: Request, res: Response): void => {
  const user = userModel.findById(req.user!.userId);

  if (!user) {
    res.status(404).json({
      message: "User not found",
    });
    return;
  }

  res.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
};