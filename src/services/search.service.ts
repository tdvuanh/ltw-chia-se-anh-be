import prisma from "../config/prisma";
import { getPhotoWithDetails } from "./photo.service";

export async function searchPhotos(
  query: string,
  skip: number,
  limit: number,
  filters?: {
    tag?: string;
    username?: string;
  },
) {
  const searchQuery = query.trim();

  let where: Record<string, unknown> = {
    status: "approved",
    OR: [
      {
        title: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      {
        photo_tags: {
          some: {
            tags: {
              name: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
          },
        },
      },
      {
        users: {
          OR: [
            {
              username: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              full_name: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
          ],
        },
      },
    ],
  };

  if (filters?.tag) {
    where = {
      ...where,
      photo_tags: {
        some: {
          tags: {
            name: {
              contains: filters.tag,
              mode: "insensitive",
            },
          },
        },
      },
    };
  }

  if (filters?.username) {
    where = {
      ...where,
      users: {
        username: {
          contains: filters.username,
          mode: "insensitive",
        },
      },
    };
  }

  const photos = await prisma.photos.findMany({
    where: where as any,
    orderBy: { created_at: "desc" },
    skip,
    take: limit,
  });

  const totalCount = await prisma.photos.count({
    where: where as any,
  });

  const photosWithDetails = await Promise.all(
    photos.map((photo) => getPhotoWithDetails(photo.id)),
  );

  return {
    photos: photosWithDetails,
    total_count: totalCount,
  };
}

export async function searchUsers(query: string, skip: number, limit: number) {
  const searchQuery = query.trim();

  const users = await prisma.users.findMany({
    where: {
      OR: [
        {
          username: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          full_name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      ],
      email_verified: true,
    },
    select: {
      id: true,
      username: true,
      full_name: true,
      avatar_url: true,
      bio: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
    skip,
    take: limit,
  });

  const totalCount = await prisma.users.count({
    where: {
      OR: [
        {
          username: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          full_name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      ],
      email_verified: true,
    },
  });

  return {
    users,
    total_count: totalCount,
  };
}

export async function getTrendingPhotos(skip: number, limit: number) {
  const photos = await prisma.photos.findMany({
    where: { status: "approved" },
    orderBy: [{ likes_count: "desc" }, { created_at: "desc" }],
    skip,
    take: limit,
  });

  const totalCount = await prisma.photos.count({
    where: { status: "approved" },
  });

  const photosWithDetails = await Promise.all(
    photos.map((photo) => getPhotoWithDetails(photo.id)),
  );

  return {
    photos: photosWithDetails,
    total_count: totalCount,
  };
}

export async function searchPhotosByTag(
  tag: string,
  skip: number,
  limit: number,
) {
  const cleanTag = tag.toLowerCase().trim();

  const photos = await prisma.photos.findMany({
    where: {
      status: "approved",
      photo_tags: {
        some: {
          tags: {
            name: cleanTag,
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
    skip,
    take: limit,
  });

  const totalCount = await prisma.photos.count({
    where: {
      status: "approved",
      photo_tags: {
        some: {
          tags: {
            name: cleanTag,
          },
        },
      },
    },
  });

  const photosWithDetails = await Promise.all(
    photos.map((photo) => getPhotoWithDetails(photo.id)),
  );

  return {
    photos: photosWithDetails,
    total_count: totalCount,
  };
}
