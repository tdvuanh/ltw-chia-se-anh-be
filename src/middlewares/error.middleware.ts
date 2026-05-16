import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  status?: number;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error] Status: ${status}, Message: ${message}`, err.details);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: Record<string, any> = { message };
  if (err.details) {
    response.details = err.details;
  }

  res.status(status).json(response);
}

export function createError(
  status: number,
  message: string,
  details?: unknown,
): AppError {
  const error: AppError = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}
