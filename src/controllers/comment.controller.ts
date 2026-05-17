import { Request, Response, NextFunction } from "express";
import {
  createComment,
  getCommentById,
  getCommentsByPhotoId,
  updateComment,
  deleteComment,
} from "../services/comment.service";
import {
  createCommentSchema,
  updateCommentSchema,
  validate,
} from "../utils/validation";
import { createError } from "../middlewares/error.middleware";

export async function getAllCommentsByPhoto(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const photoId = BigInt(req.params.photoId as string);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 20),
    );
    const skip = (page - 1) * limit;

    const comments = await getCommentsByPhotoId(photoId, skip, limit);

    res.status(200).json({
      message: "Comments retrieved successfully",
      data: {
        comments,
        pagination: {
          page,
          limit,
        },
      },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to retrieve comments",
      ),
    );
  }
}

export async function getComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = BigInt(req.params.id as string);
    const comment = await getCommentById(id);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    res.status(200).json({
      message: "Comment retrieved successfully",
      data: { comment },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to retrieve comment",
      ),
    );
  }
}

export async function postComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Check if user is authenticated via req.user (set by auth middleware)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any)?.user?.userId || (req as any)?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { error, value } = validate(createCommentSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const comment = await createComment({
      photo_id: value.photo_id,
      user_id: userId,
      content: value.content,
    });

    res.status(201).json({
      message: "Comment created successfully",
      data: { comment },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to create comment",
      ),
    );
  }
}

export async function updateCommentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any)?.user?.userId || (req as any)?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const id = BigInt(req.params.id as string);

    const { error, value } = validate(updateCommentSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const comment = await updateComment(id, userId, value);

    res.status(200).json({
      message: "Comment updated successfully",
      data: { comment },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to update comment",
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any)?.user?.userId || (req as any)?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const id = BigInt(req.params.id as string);

    await deleteComment(id, userId);

    res.status(200).json({
      message: "Comment deleted successfully",
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
