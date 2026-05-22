import prisma from "../config/prisma";

interface CreatePhotoData {
  title: string;
  description?: string;
  image_url: string;
  user_id: bigint;
  tags?: string[];
}

interface UpdatePhotoData {
  title?: string;
  description?: string;
}

export async function createPhotoWithTags(data: CreatePhotoData) {
  const { title, description, image_url, user_id, tags = [] } = data;

  const photo = await prisma.photos.create({
    data: {
      title,
      description: description || null,
      image_url,
      user_id,
    },
  });

  if (tags.length > 0) {
    await assignTagsToPhoto(photo.id, tags);
  }

  return getPhotoWithDetails(photo.id);
}

export async function getPhotoWithDetails(photoId: bigint) {
  const photo = await prisma.photos.findUnique({
    where: { id: photoId },
    include: {
      users: {
        select: {
          id: true,
          username: true,
          full_name: true,
          avatar_url: true,
        },
      },
      photo_tags: {
        include: {
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      comments: {
        include: {
          users: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 5,
      },
      likes: {
        select: {
          user_id: true,
        },
      },
    },
  });

  if (!photo) return null;

  return {
    ...photo,
    tags: photo.photo_tags.map((pt) => ({
      id: pt.tags.id,
      name: pt.tags.name,
    })),
    photo_tags: undefined,
    user: photo.users,
    users: undefined,
    liked_by: photo.likes.map((l) => l.user_id),
    likes: undefined,
  };
}

export async function updatePhotoData(
  photoId: bigint,
  userId: bigint,
  data: UpdatePhotoData,
) {
  const photo = await prisma.photos.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw { status: 404, message: "Photo not found" };
  }

  if (photo.user_id !== userId) {
    throw { status: 403, message: "You can only update your own photos" };
  }

  const updated = await prisma.photos.update({
    where: { id: photoId },
    data: {
      title: data.title !== undefined ? data.title : photo.title,
      description:
        data.description !== undefined ? data.description : photo.description,
    },
  });

  return getPhotoWithDetails(updated.id);
}

export async function deletePhotoByOwner(photoId: bigint, userId: bigint) {
  const photo = await prisma.photos.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw { status: 404, message: "Photo not found" };
  }

  if (photo.user_id !== userId) {
    throw { status: 403, message: "You can only delete your own photos" };
  }

  await prisma.photos.delete({
    where: { id: photoId },
  });
}

export async function assignTagsToPhoto(photoId: bigint, tags: string[]) {
  for (const tagName of tags) {
    const cleanName = tagName.toLowerCase().trim();

    let tag = await prisma.tags.findUnique({
      where: { name: cleanName },
    });

    if (!tag) {
      tag = await prisma.tags.create({
        data: { name: cleanName },
      });
    }

    await prisma.photo_tags.upsert({
      where: {
        photo_id_tag_id: {
          photo_id: photoId,
          tag_id: tag.id,
        },
      },
      update: {},
      create: {
        photo_id: photoId,
        tag_id: tag.id,
      },
    });
  }
}

export async function getPhotosByUser(
  userId: bigint,
  skip: number,
  limit: number,
) {
  const photos = await prisma.photos.findMany({
    where: {
      user_id: userId,
      status: "approved",
    },
    orderBy: { created_at: "desc" },
    skip,
    take: limit,
  });

  return Promise.all(
    photos.map(async (photo) => getPhotoWithDetails(photo.id)),
  );
}

export async function getPhotosFeed(
  userId: bigint,
  skip: number,
  limit: number,
) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      follows_follows_follower_idTousers: {
        select: { following_id: true },
      },
    },
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const followingIds = user.follows_follows_follower_idTousers.map(
    (f) => f.following_id,
  );

  const photos = await prisma.photos.findMany({
    where: {
      AND: [
        {
          OR: [{ user_id: { in: followingIds } }, { user_id: userId }],
        },
        { status: "approved" },
      ],
    },
    orderBy: { created_at: "desc" },
    skip,
    take: limit,
  });

  return Promise.all(
    photos.map(async (photo) => getPhotoWithDetails(photo.id)),
  );
}
