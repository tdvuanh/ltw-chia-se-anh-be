import prisma from "../config/prisma";
import bcrypt from "bcrypt";

interface UserProfile {
  id: bigint;
  username: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email_verified: boolean;
  created_at: Date;
}

interface UpdateProfileData {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

/**
 * Lấy hồ sơ người dùng kèm số liệu thống kê (ảnh, follower, following, tổng like)
 * và trạng thái is_following so với người xem (viewerId, nếu có).
 */
export async function getProfile(
  userId: bigint,
  viewerId?: bigint,
): Promise<(UserProfile & Record<string, unknown>) | null> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      full_name: true,
      avatar_url: true,
      bio: true,
      email_verified: true,
      role: true,
      created_at: true,
    },
  });

  if (!user) return null;

  const [photosCount, followersCount, followingCount, likesAgg, isFollowing] =
    await Promise.all([
      prisma.photos.count({
        where: { user_id: userId, status: "approved" },
      }),
      prisma.follows.count({ where: { following_id: userId } }),
      prisma.follows.count({ where: { follower_id: userId } }),
      prisma.photos.aggregate({
        where: { user_id: userId, status: "approved" },
        _sum: { likes_count: true },
      }),
      viewerId
        ? prisma.follows
            .findUnique({
              where: {
                follower_id_following_id: {
                  follower_id: viewerId,
                  following_id: userId,
                },
              },
            })
            .then((f) => !!f)
        : Promise.resolve(false),
    ]);

  return {
    ...(user as UserProfile),
    photos_count: photosCount,
    followers_count: followersCount,
    following_count: followingCount,
    likes_count: likesAgg._sum.likes_count ?? 0,
    is_following: isFollowing,
  };
}

/**
 * Đổi mật khẩu: xác minh mật khẩu hiện tại rồi cập nhật mật khẩu mới.
 */
export async function changePassword(
  userId: bigint,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.users.findUnique({ where: { id: userId } });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw { status: 400, message: "Current password is incorrect" };
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.users.update({
    where: { id: userId },
    data: {
      password_hash: hashed,
      last_password_changed_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function updateProfile(
  userId: bigint,
  data: UpdateProfileData,
): Promise<UserProfile> {
  const user = await prisma.users.update({
    where: { id: userId },
    data: {
      ...(data.full_name !== undefined && { full_name: data.full_name }),
      ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
      ...(data.bio !== undefined && { bio: data.bio }),
      updated_at: new Date(),
    },
    select: {
      id: true,
      username: true,
      email: true,
      full_name: true,
      avatar_url: true,
      bio: true,
      email_verified: true,
      created_at: true,
    },
  });

  return user as UserProfile;
}
