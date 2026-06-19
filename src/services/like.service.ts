import prisma from "../config/prisma";
import { getPhotoWithDetails } from "./photo.service";
import { createNotification } from "./notification.service";

/**
 * Lấy danh sách ảnh mà người dùng đã thích (chỉ ảnh đã được duyệt).
 */
export async function getLikedPhotos(
  userId: bigint,
  skip: number,
  limit: number,
) {
  const likes = await prisma.likes.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    skip,
    take: limit,
    select: { photo_id: true },
  });

  const photos = await Promise.all(
    likes.map((l) => getPhotoWithDetails(BigInt(l.photo_id))),
  );

  // Theo định nghĩa, tất cả ảnh ở đây đều đã được người dùng thích -> is_liked = true
  return photos
    .filter((p): p is NonNullable<typeof p> => !!p && p.status === "approved")
    .map((p) => ({ ...p, is_liked: true }));
}

export async function likePhoto(photoId: bigint, userId: bigint) {
  const photo = await prisma.photos.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw { status: 404, message: "Photo not found" };
  }

  const existingLike = await prisma.likes.findUnique({
    where: {
      user_id_photo_id: {
        user_id: userId,
        photo_id: photoId,
      },
    },
  });

  if (existingLike) {
    throw { status: 409, message: "You already liked this photo" };
  }

  await prisma.likes.create({
    data: {
      user_id: userId,
      photo_id: photoId,
    },
  });

  const updatedPhoto = await prisma.photos.update({
    where: { id: photoId },
    data: {
      likes_count: {
        increment: 1,
      },
    },
    include: {
      likes: {
        select: { user_id: true },
      },
    },
  });

  // Thông báo cho chủ ảnh có lượt thích mới
  await createNotification({
    recipientId: photo.user_id,
    actorId: userId,
    type: "like",
    photoId: photoId,
  });

  return {
    message: "Photo liked successfully",
    likes_count: updatedPhoto.likes_count,
    liked_by_count: updatedPhoto.likes.length,
  };
}

export async function unlikePhoto(photoId: bigint, userId: bigint) {
  const photo = await prisma.photos.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw { status: 404, message: "Photo not found" };
  }

  const existingLike = await prisma.likes.findUnique({
    where: {
      user_id_photo_id: {
        user_id: userId,
        photo_id: photoId,
      },
    },
  });

  if (!existingLike) {
    throw { status: 404, message: "You haven't liked this photo" };
  }

  await prisma.likes.delete({
    where: {
      user_id_photo_id: {
        user_id: userId,
        photo_id: photoId,
      },
    },
  });

  const updatedPhoto = await prisma.photos.update({
    where: { id: photoId },
    data: {
      likes_count: {
        decrement: 1,
      },
    },
    include: {
      likes: {
        select: { user_id: true },
      },
    },
  });

  return {
    message: "Photo unliked successfully",
    likes_count: updatedPhoto.likes_count,
    liked_by_count: updatedPhoto.likes.length,
  };
}

export async function getPhotoLikes(
  photoId: bigint,
  skip: number,
  limit: number,
) {
  const photo = await prisma.photos.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw { status: 404, message: "Photo not found" };
  }

  const likes = await prisma.likes.findMany({
    where: { photo_id: photoId },
    skip,
    take: limit,
    include: {
      users: {
        select: {
          id: true,
          username: true,
          full_name: true,
          avatar_url: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const totalCount = await prisma.likes.count({
    where: { photo_id: photoId },
  });

  return {
    users: likes.map((like) => like.users),
    total_count: totalCount,
  };
}

export async function checkIfUserLikedPhoto(
  photoId: bigint,
  userId: bigint,
): Promise<boolean> {
  const like = await prisma.likes.findUnique({
    where: {
      user_id_photo_id: {
        user_id: userId,
        photo_id: photoId,
      },
    },
  });

  return !!like;
}
