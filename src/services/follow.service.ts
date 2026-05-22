import prisma from "../config/prisma";

export async function followUser(followerId: bigint, followingId: bigint) {
  if (followerId === followingId) {
    throw { status: 400, message: "You cannot follow yourself" };
  }

  const userToFollow = await prisma.users.findUnique({
    where: { id: followingId },
  });

  if (!userToFollow) {
    throw { status: 404, message: "User not found" };
  }

  const existingFollow = await prisma.follows.findUnique({
    where: {
      follower_id_following_id: {
        follower_id: followerId,
        following_id: followingId,
      },
    },
  });

  if (existingFollow) {
    throw { status: 409, message: "You already follow this user" };
  }

  await prisma.follows.create({
    data: {
      follower_id: followerId,
      following_id: followingId,
    },
  });

  return {
    message: "Followed successfully",
  };
}

export async function unfollowUser(followerId: bigint, followingId: bigint) {
  if (followerId === followingId) {
    throw { status: 400, message: "You cannot unfollow yourself" };
  }

  const existingFollow = await prisma.follows.findUnique({
    where: {
      follower_id_following_id: {
        follower_id: followerId,
        following_id: followingId,
      },
    },
  });

  if (!existingFollow) {
    throw { status: 404, message: "You don't follow this user" };
  }

  await prisma.follows.delete({
    where: {
      follower_id_following_id: {
        follower_id: followerId,
        following_id: followingId,
      },
    },
  });

  return {
    message: "Unfollowed successfully",
  };
}

export async function getFollowers(
  userId: bigint,
  skip: number,
  limit: number,
) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const followers = await prisma.follows.findMany({
    where: { following_id: userId },
    skip,
    take: limit,
    include: {
      users_follows_follower_idTousers: {
        select: {
          id: true,
          username: true,
          full_name: true,
          avatar_url: true,
          bio: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const totalCount = await prisma.follows.count({
    where: { following_id: userId },
  });

  return {
    followers: followers.map((f) => f.users_follows_follower_idTousers),
    total_count: totalCount,
  };
}

export async function getFollowing(
  userId: bigint,
  skip: number,
  limit: number,
) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const following = await prisma.follows.findMany({
    where: { follower_id: userId },
    skip,
    take: limit,
    include: {
      users_follows_following_idTousers: {
        select: {
          id: true,
          username: true,
          full_name: true,
          avatar_url: true,
          bio: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const totalCount = await prisma.follows.count({
    where: { follower_id: userId },
  });

  return {
    following: following.map((f) => f.users_follows_following_idTousers),
    total_count: totalCount,
  };
}

export async function checkIfFollowing(
  followerId: bigint,
  followingId: bigint,
): Promise<boolean> {
  const follow = await prisma.follows.findUnique({
    where: {
      follower_id_following_id: {
        follower_id: followerId,
        following_id: followingId,
      },
    },
  });

  return !!follow;
}

export async function getFollowersCount(userId: bigint): Promise<number> {
  return prisma.follows.count({
    where: { following_id: userId },
  });
}

export async function getFollowingCount(userId: bigint): Promise<number> {
  return prisma.follows.count({
    where: { follower_id: userId },
  });
}
