import prisma from "../config/prisma";

export type NotificationType = "like" | "comment" | "follow";

interface CreateNotificationInput {
  recipientId: bigint;
  actorId: bigint;
  type: NotificationType;
  photoId?: bigint | null;
  commentId?: bigint | null;
}

/**
 * Tạo một thông báo. Bỏ qua nếu người nhận trùng người tạo (tự tương tác).
 * Hàm này được gọi nội bộ từ các luồng comment/follow/like và không nên
 * làm fail request chính nếu lỗi (nuốt lỗi, chỉ log).
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  try {
    const recipientId = BigInt(input.recipientId as unknown as string);
    const actorId = BigInt(input.actorId as unknown as string);

    if (recipientId === actorId) {
      return; // không tự thông báo cho chính mình
    }

    await prisma.notifications.create({
      data: {
        recipient_id: recipientId,
        actor_id: actorId,
        type: input.type,
        photo_id:
          input.photoId != null ? BigInt(input.photoId as unknown as string) : null,
        comment_id:
          input.commentId != null
            ? BigInt(input.commentId as unknown as string)
            : null,
      },
    });
  } catch (err) {
    console.error("[notifications] Failed to create notification:", err);
  }
}

/**
 * Lấy danh sách thông báo của người dùng (kèm thông tin người tạo và ảnh liên quan).
 */
export async function getNotifications(
  userId: bigint,
  skip: number,
  limit: number,
  onlyUnread = false,
) {
  const where = {
    recipient_id: userId,
    ...(onlyUnread ? { is_read: false } : {}),
  };

  const [notifications, total, unread] = await Promise.all([
    prisma.notifications.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: {
        actor: {
          select: { id: true, username: true, full_name: true, avatar_url: true },
        },
      },
    }),
    prisma.notifications.count({ where }),
    prisma.notifications.count({
      where: { recipient_id: userId, is_read: false },
    }),
  ]);

  // Kiểu tối giản cho một dòng notification (an toàn dù Prisma Client đã/chưa generate)
  interface NotifRow {
    id: bigint | string;
    type: NotificationType;
    is_read: boolean;
    created_at: Date;
    actor: unknown;
    photo_id: bigint | string | null;
    comment_id: bigint | string | null;
  }
  const rows = notifications as unknown as NotifRow[];

  // Lấy tiêu đề ảnh liên quan (nếu có) để hiển thị
  const photoIds: bigint[] = Array.from(
    new Set(
      rows
        .map((n) => n.photo_id)
        .filter((id): id is NonNullable<typeof id> => id != null)
        .map((id) => BigInt(id as unknown as string).toString()),
    ),
  ).map((s) => BigInt(s));

  const photos = photoIds.length
    ? await prisma.photos.findMany({
        where: { id: { in: photoIds } },
        select: { id: true, title: true },
      })
    : [];
  const photoTitle = new Map(
    (photos as Array<{ id: bigint | string; title: string }>).map((p) => [
      String(p.id),
      p.title,
    ]),
  );

  const data = rows.map((n) => ({
    id: n.id,
    type: n.type,
    is_read: n.is_read,
    created_at: n.created_at,
    actor: n.actor,
    photo_id: n.photo_id,
    comment_id: n.comment_id,
    photo_title: n.photo_id ? photoTitle.get(String(n.photo_id)) ?? null : null,
  }));

  return { notifications: data, total, unread };
}

export async function getUnreadCount(userId: bigint): Promise<number> {
  return prisma.notifications.count({
    where: { recipient_id: userId, is_read: false },
  });
}

export async function markAsRead(userId: bigint, id: bigint): Promise<void> {
  await prisma.notifications.updateMany({
    where: { id, recipient_id: userId },
    data: { is_read: true },
  });
}

export async function markAllAsRead(userId: bigint): Promise<void> {
  await prisma.notifications.updateMany({
    where: { recipient_id: userId, is_read: false },
    data: { is_read: true },
  });
}
