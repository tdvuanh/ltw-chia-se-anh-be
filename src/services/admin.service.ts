import prisma from "../config/prisma";
import { getPhotoWithDetails } from "./photo.service";

export async function moderatePhoto(photoId: bigint, status: "approved" | "rejected") {
  const photo = await prisma.photos.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw { status: 404, message: "Photo not found" };
  }

  const updatedPhoto = await prisma.photos.update({
    where: { id: photoId },
    data: { status },
  });

  return updatedPhoto;
}

export async function updateUserStatus(userId: bigint, status: "active" | "banned") {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const updatedUser = await prisma.users.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      username: true,
      email: true,
      full_name: true,
      status: true,
      role: true,
    },
  });

  return updatedUser;
}

export async function deletePhotoByAdmin(photoId: bigint) {
  const photo = await prisma.photos.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw { status: 404, message: "Photo not found" };
  }

  await prisma.photos.delete({
    where: { id: photoId },
  });
}

export async function deleteCommentByAdmin(commentId: bigint) {
  const comment = await prisma.comments.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw { status: 404, message: "Comment not found" };
  }

  await prisma.comments.delete({
    where: { id: commentId },
  });

  // Decrement comment count on the associated photo
  await prisma.photos.update({
    where: { id: comment.photo_id },
    data: {
      comments_count: {
        decrement: 1,
      },
    },
  });
}

export async function getStats() {
  const [
    totalPhotos,
    totalUsers,
    bannedUsers,
    pendingPhotos,
    approvedPhotos,
    rejectedPhotos,
    activeUsers,
    totalLikes,
    totalComments,
    pendingReports,
    topTags,
  ] = await Promise.all([
    prisma.photos.count(),
    prisma.users.count(),
    prisma.users.count({ where: { status: "banned" } }),
    prisma.photos.count({ where: { status: "pending" } }),
    prisma.photos.count({ where: { status: "approved" } }),
    prisma.photos.count({ where: { status: "rejected" } }),
    prisma.users.count({
      where: {
        status: "active",
        OR: [
          { photos: { some: {} } },
          { comments: { some: {} } },
          { likes: { some: {} } },
          { follows_follows_follower_idTousers: { some: {} } },
        ],
      },
    }),
    prisma.likes.count(),
    prisma.comments.count(),
    prisma.reports.count({ where: { status: "pending" } }),
    getTopTags(8),
  ]);

  return {
    total_photos: totalPhotos,
    total_users: totalUsers,
    banned_users: bannedUsers,
    active_users: activeUsers,
    total_likes: totalLikes,
    total_comments: totalComments,
    pending_reports: pendingReports,
    photos_by_status: {
      pending: pendingPhotos,
      approved: approvedPhotos,
      rejected: rejectedPhotos,
    },
    top_tags: topTags,
  };
}

/**
 * Thẻ (tag) phổ biến nhất theo số lượng ảnh được gắn — dữ liệu thật.
 */
export async function getTopTags(limit = 8) {
  const tags = await prisma.tags.findMany({
    select: {
      name: true,
      _count: { select: { photo_tags: true } },
    },
    orderBy: { photo_tags: { _count: "desc" } },
    take: limit,
  });

  return tags
    .map((t) => ({ name: t.name, count: t._count.photo_tags }))
    .filter((t) => t.count > 0);
}

/**
 * Dòng hoạt động gần đây của hệ thống (đăng ảnh, bình luận, theo dõi) — dữ liệu thật.
 */
export async function getRecentActivity(limit = 10) {
  const [photos, comments, follows] = await Promise.all([
    prisma.photos.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        created_at: true,
        users: { select: { username: true } },
      },
    }),
    prisma.comments.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        created_at: true,
        users: { select: { username: true } },
        photos: { select: { title: true } },
      },
    }),
    prisma.follows.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        created_at: true,
        users_follows_follower_idTousers: { select: { username: true } },
        users_follows_following_idTousers: { select: { username: true } },
      },
    }),
  ]);

  const activity = [
    ...photos.map((p) => ({
      type: "photo" as const,
      user: p.users?.username ?? "ai đó",
      action: "đã đăng ảnh mới",
      target: p.title,
      created_at: p.created_at,
    })),
    ...comments.map((c) => ({
      type: "comment" as const,
      user: c.users?.username ?? "ai đó",
      action: "đã bình luận ảnh",
      target: c.photos?.title ?? "",
      created_at: c.created_at,
    })),
    ...follows.map((f) => ({
      type: "follow" as const,
      user: f.users_follows_follower_idTousers?.username ?? "ai đó",
      action: "đã theo dõi",
      target: f.users_follows_following_idTousers?.username ?? "",
      created_at: f.created_at,
    })),
  ];

  return activity
    .sort(
      (a, b) =>
        new Date(b.created_at as unknown as string).getTime() -
        new Date(a.created_at as unknown as string).getTime(),
    )
    .slice(0, limit);
}

export async function getPendingPhotos() {
  const photos = await prisma.photos.findMany({
    where: { status: "pending" },
    orderBy: { created_at: "desc" },
  });
  return Promise.all(photos.map((p) => getPhotoWithDetails(p.id)));
}

export async function getUsersList() {
  const users = await prisma.users.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      full_name: true,
      avatar_url: true,
      bio: true,
      role: true,
      status: true,
      created_at: true,
      _count: {
        select: {
          photos: true,
        },
      },
    },
  });
  return users.map((user) => ({
    ...user,
    photos_count: user._count.photos,
  }));
}
