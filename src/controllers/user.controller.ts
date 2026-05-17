import { Request, Response, NextFunction } from "express";
import { getProfile, updateProfile } from "../services/user.service";
import { updateProfileSchema, validate } from "../utils/validation";
import { createError } from "../middlewares/error.middleware";

interface AuthRequest extends Request {
  userId?: bigint;
}

export async function getUserProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = BigInt(req.params.id as string);
    const user = await getProfile(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User profile retrieved successfully",
      data: { user },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to get user profile",
      ),
    );
  }
}

export async function getMyProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req?.user?.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await getProfile(req?.user?.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Your profile retrieved successfully",
      data: { user },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to get your profile",
      ),
    );
  }
}

export async function updateUserProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req?.user?.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userId = req.params.id as string;
    const currentUserId = req.user.userId.toString();

    if (currentUserId !== userId) {
      return res.status(403).json({
        message: "Forbidden: You can only update your own profile",
      });
    }

    const { error, value } = validate(updateProfileSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const user = await updateProfile(BigInt(userId), value);

    res.status(200).json({
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to update profile",
      ),
    );
  }
}
