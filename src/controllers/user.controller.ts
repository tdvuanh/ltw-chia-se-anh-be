import { Request, Response, NextFunction } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../services/user.service";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../services/follow.service";
import { searchUsers } from "../services/search.service";
import { uploadImageToSupabase } from "../services/storage.service";
import {
  updateProfileSchema,
  changePasswordSchema,
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

export async function getUserProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = BigInt(req.params.id as string);
    const viewerId = req.user?.userId
      ? BigInt(req.user.userId)
      : undefined;
    const user = await getProfile(userId, viewerId);

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

/**
 * Tải lên / thay đổi ảnh đại diện của người dùng hiện tại.
 * POST /users/me/avatar (multipart, field "avatar")
 */
export async function uploadAvatarHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req?.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const avatarUrl = await uploadImageToSupabase(req.file);
    const user = await updateProfile(BigInt(req.user.userId), {
      avatar_url: avatarUrl,
    });

    res.status(200).json({
      message: "Avatar updated successfully",
      data: { user },
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to upload avatar",
      ),
    );
  }
}

/**
 * Đổi mật khẩu của người dùng hiện tại.
 * POST /users/me/change-password
 */
export async function changePasswordHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req?.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { error, value } = validate(changePasswordSchema, req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    await changePassword(
      BigInt(req.user.userId),
      value.currentPassword,
      value.newPassword,
    );

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to change password",
      ),
    );
  }
}

export async function followUserHandler(
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

    const followingId = BigInt(req.params.id as string);

    const result = await followUser(req.user.userId, followingId);

    res.status(200).json({
      message: result.message,
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to follow user",
      ),
    );
  }
}

export async function unfollowUserHandler(
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

    const followingId = BigInt(req.params.id as string);

    const result = await unfollowUser(req.user.userId, followingId);

    res.status(200).json({
      message: result.message,
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    next(
      createError(
        error.status || 500,
        error.message || "Failed to unfollow user",
      ),
    );
  }
}

export async function getFollowersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = BigInt(req.params.id as string);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 20),
    );
    const skip = (page - 1) * limit;

    const result = await getFollowers(userId, skip, limit);

    res.status(200).json({
      message: "Followers retrieved successfully",
      data: {
        followers: result.followers,
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
        error.message || "Failed to retrieve followers",
      ),
    );
  }
}

export async function getFollowingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = BigInt(req.params.id as string);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 20),
    );
    const skip = (page - 1) * limit;

    const result = await getFollowing(userId, skip, limit);

    res.status(200).json({
      message: "Following retrieved successfully",
      data: {
        following: result.following,
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
        error.message || "Failed to retrieve following",
      ),
    );
  }
}

export async function searchUsersHandler(
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

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const result = await searchUsers(query, skip, limit);

    res.status(200).json({
      message: "Users found successfully",
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
        error.message || "Failed to search users",
      ),
    );
  }
}
