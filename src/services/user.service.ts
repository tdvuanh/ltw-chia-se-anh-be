import prisma from "../config/prisma";

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

export async function getProfile(userId: bigint): Promise<UserProfile | null> {
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
      created_at: true,
    },
  });

  return user as UserProfile | null;
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
