import prisma from "../config/prisma";

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
  ]);

  return {
    total_photos: totalPhotos,
    total_users: totalUsers,
    banned_users: bannedUsers,
    active_users: activeUsers,
    photos_by_status: {
      pending: pendingPhotos,
      approved: approvedPhotos,
      rejected: rejectedPhotos,
    },
  };
}
