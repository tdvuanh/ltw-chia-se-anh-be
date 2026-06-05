import { Request, Response, NextFunction } from "express";
import {
  createPhotoWithTags,
  getPhotoWithDetails,
  updatePhotoData,
  deletePhotoByOwner,
  getPhotosByUser,
  getPhotosFeed,
} from "../services/photo.service";
import { uploadImageToSupabase } from "../services/storage.service";
import {
  likePhoto,
  unlikePhoto,
  getPhotoLikes,
} from "../services/like.service";
import { searchPhotos, getTrendingPhotos } from "../services/search.service";
import {
  createPhotoSchema,
  updatePhotoSchema,
  validate,
} from "../utils/validation";
import { createError } from "../middlewares/error.middleware";

interface AuthRequest extends Request {
  user?: {
    userId: bigint;
    email: string;
    role: string;
  };
}

export async function getAllPhotos(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 20),
    );
    const skip = (page - 1) * limit;

    const photos = await getTrendingPhotos(skip, limit);

    res.status(200).json({
      message: "Photos retrieved successfully",
      data: {
        photos: photos.photos,
        pagination: {
          page,
          limit,
          total: photos.total_count,
        },
      },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to retrieve photos",
      ),
    );
  }
}

export async function getPhotoById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const photo = await getPhotoWithDetails(BigInt(id as string));

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    res.status(200).json({
      message: "Photo retrieved successfully",
      data: { photo },
    });
  } catch (error) {
    next(error);
  }
}

export async function createPhoto(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "Validation error",
        details: [
          {
            field: "image",
            message: "Image file is required",
          },
        ],
      });
    }

    // Pre-process tags if they are sent as JSON string or comma-separated string (common in multipart/form-data)
    if (req.body.tags && typeof req.body.tags === "string") {
      try {
        req.body.tags = JSON.parse(req.body.tags);
      } catch {
        req.body.tags = req.body.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);
      }
    }

    const { error, value } = validate(createPhotoSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    // Upload the photo to Supabase Storage
    const imageUrl = await uploadImageToSupabase(req.file);

    const photo = await createPhotoWithTags({
      title: value.title,
      description: value.description,
      image_url: imageUrl,
      user_id: req.user.userId,
      tags: value.tags,
    });

    res.status(201).json({
      message: "Photo created successfully",
      data: { photo },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to create photo",
      ),
    );
  }
}

export async function updatePhoto(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const { error, value } = validate(updatePhotoSchema, req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const photo = await updatePhotoData(
      BigInt(id as string),
      req.user.userId,
      value,
    );

    res.status(200).json({
      message: "Photo updated successfully",
      data: { photo },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to update photo",
      ),
    );
  }
}

export async function deletePhoto(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    await deletePhotoByOwner(BigInt(id as string), req.user.userId);

    res.status(200).json({ message: "Photo deleted successfully" });
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

export async function likePhotoHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const result = await likePhoto(BigInt(id as string), req.user.userId);

    res.status(200).json({
      message: result.message,
      data: {
        likes_count: result.likes_count,
      },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(error.status || 500, error.message || "Failed to like photo"),
    );
  }
}

export async function unlikePhotoHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const result = await unlikePhoto(BigInt(id as string), req.user.userId);

    res.status(200).json({
      message: result.message,
      data: {
        likes_count: result.likes_count,
      },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to unlike photo",
      ),
    );
  }
}

export async function getPhotoLikesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 20),
    );
    const skip = (page - 1) * limit;

    const result = await getPhotoLikes(BigInt(id as string), skip, limit);

    res.status(200).json({
      message: "Likes retrieved successfully",
      data: {
        users: result.users,
        pagination: {
          page,
          limit,
          total: result.total_count,
        },
      },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to retrieve likes",
      ),
    );
  }
}

export async function searchPhotosHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 20),
    );
    const skip = (page - 1) * limit;

    const query = req.query.q as string;
    const tag = req.query.tag as string | undefined;
    const username = req.query.username as string | undefined;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const result = await searchPhotos(query, skip, limit, { tag, username });

    res.status(200).json({
      message: "Search results retrieved successfully",
      data: {
        photos: result.photos,
        pagination: {
          page,
          limit,
          total: result.total_count,
        },
      },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to search photos",
      ),
    );
  }
}

export async function getPhotosByUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 20),
    );
    const skip = (page - 1) * limit;

    const photos = await getPhotosByUser(BigInt(userId as string), skip, limit);

    res.status(200).json({
      message: "User photos retrieved successfully",
      data: {
        photos,
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
        error.message || "Failed to retrieve user photos",
      ),
    );
  }
}

export async function getFeedHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 20),
    );
    const skip = (page - 1) * limit;

    const photos = await getPhotosFeed(req.user.userId, skip, limit);

    res.status(200).json({
      message: "Feed retrieved successfully",
      data: {
        photos,
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
        error.message || "Failed to retrieve feed",
      ),
    );
  }
}
