import { Request, Response, NextFunction } from "express";
import {
  moderatePhoto,
  updateUserStatus,
  deletePhotoByAdmin,
  deleteCommentByAdmin,
  getStats,
} from "../services/admin.service";
import {
  moderatePhotoSchema,
  updateUserStatusSchema,
  validate,
} from "../utils/validation";
import { createError } from "../middlewares/error.middleware";

export async function moderatePhotoHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const { error, value } = validate(moderatePhotoSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const photo = await moderatePhoto(BigInt(id as string), value.status);

    res.status(200).json({
      message: `Photo status updated successfully to ${value.status}`,
      data: { photo },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to moderate photo",
      ),
    );
  }
}

export async function updateUserStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const { error, value } = validate(updateUserStatusSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const user = await updateUserStatus(BigInt(id as string), value.status);

    res.status(200).json({
      message: `User status updated successfully to ${value.status}`,
      data: { user },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to update user status",
      ),
    );
  }
}

export async function deletePhotoHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    await deletePhotoByAdmin(BigInt(id as string));

    res.status(200).json({
      message: "Photo deleted by administrator successfully",
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to delete photo",
      ),
    );
  }
}

export async function deleteCommentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    await deleteCommentByAdmin(BigInt(id as string));

    res.status(200).json({
      message: "Comment deleted by administrator successfully",
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to delete comment",
      ),
    );
  }
}

export async function getStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const stats = await getStats();

    res.status(200).json({
      message: "Administrative dashboard stats retrieved successfully",
      data: stats,
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to retrieve statistics",
      ),
    );
  }
}
