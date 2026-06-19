import { Request, Response, NextFunction } from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../services/notification.service";
import { createError } from "../middlewares/error.middleware";

/**
 * GET /notifications?unread=true&page=1&limit=20
 */
export async function getNotificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 30);
    const skip = (page - 1) * limit;
    const onlyUnread = req.query.unread === "true";

    const result = await getNotifications(
      BigInt(req.user.userId),
      skip,
      limit,
      onlyUnread,
    );

    res.status(200).json({
      message: "Notifications retrieved successfully",
      data: result.notifications,
      meta: { total: result.total, unread: result.unread },
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    next(createError(e.status || 500, e.message || "Failed to get notifications"));
  }
}

/**
 * GET /notifications/unread-count
 */
export async function getUnreadCountHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const count = await getUnreadCount(BigInt(req.user.userId));
    res.status(200).json({ message: "OK", data: { unread: count } });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    next(createError(e.status || 500, e.message || "Failed to get unread count"));
  }
}

/**
 * PATCH /notifications/:id/read
 */
export async function markReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await markAsRead(BigInt(req.user.userId), BigInt(req.params.id as string));
    res.status(200).json({ message: "Notification marked as read" });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    next(createError(e.status || 500, e.message || "Failed to mark as read"));
  }
}

/**
 * PATCH /notifications/read-all
 */
export async function markAllReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await markAllAsRead(BigInt(req.user.userId));
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    next(createError(e.status || 500, e.message || "Failed to mark all as read"));
  }
}
