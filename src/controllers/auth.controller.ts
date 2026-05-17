import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
} from "../services/auth.service";
import {
  registerSchema,
  verifyEmailSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validate,
} from "../utils/validation";
import { createError } from "../middlewares/error.middleware";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { error, value } = validate(registerSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const result = await registerUser(
      value.username,
      value.email,
      value.password,
      value.full_name,
    );

    res.status(201).json({
      message: result.message,
      data: {
        user: {
          id: result.id,
          email: result.email,
          username: result.username,
          full_name: result.full_name,
        },
      },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(error.status || 500, error.message || "Registration failed"),
    );
  }
}

export async function verify(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = validate(verifyEmailSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const result = await verifyEmail(value.token);

    res.json({
      message: result.message,
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Email verification failed",
      ),
    );
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = validate(loginSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const result = await loginUser(value.email, value.password);

    res.json({
      message: "Login successful",
      data: result,
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(createError(error.status || 500, error.message || "Login failed"));
  }
}

export async function sendForgotPasswordEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { error, value } = validate(forgotPasswordSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const result = await forgotPassword(value.email);

    res.json({
      message: result.message,
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Forgot password request failed",
      ),
    );
  }
}

export async function resetUserPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { error, value } = validate(resetPasswordSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const result = await resetPassword(value.token, value.password);

    res.json({
      message: result.message,
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Password reset failed",
      ),
    );
  }
}
