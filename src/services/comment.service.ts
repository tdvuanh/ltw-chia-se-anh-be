import prisma from "../config/database";

export interface CommentData {
  id: bigint;
  user_id: bigint;
  photo_id: bigint;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface CommentResponse extends Omit<
  CommentData,
  "id" | "user_id" | "photo_id"
> {
  id: string;
  user_id: string;
  photo_id: string;
}

export interface CreateCommentInput {
  photo_id: number;
  user_id: bigint;
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}

export async function createComment(
  input: CreateCommentInput,
): Promise<CommentResponse> {
  const photo = await prisma.photos.findUnique({
    where: { id: BigInt(input.photo_id) },
  });

  if (!photo) {
    const error = new Error("Photo not found") as {
      status?: number;
      message?: string;
    };
    error.status = 404;
    throw error;
  }

  const comment = await prisma.comments.create({
    data: {
      user_id: input.user_id,
      photo_id: BigInt(input.photo_id),
      content: input.content,
    },
  });

  // Update photo comments count
  await prisma.photos.update({
    where: { id: BigInt(input.photo_id) },
    data: {
      comments_count: {
        increment: 1,
      },
    },
  });

  return convertCommentToResponse(comment);
}

export async function getCommentById(
  id: bigint,
): Promise<CommentResponse | null> {
  const comment = await prisma.comments.findUnique({
    where: { id },
  });

  return comment ? convertCommentToResponse(comment) : null;
}

export async function getCommentsByPhotoId(
  photoId: bigint,
  skip: number = 0,
  take: number = 20,
): Promise<CommentResponse[]> {
  const comments = await prisma.comments.findMany({
    where: { photo_id: photoId },
    orderBy: { created_at: "desc" },
    skip,
    take,
  });

  return comments.map(convertCommentToResponse);
}

export async function updateComment(
  id: bigint,
  userId: bigint,
  input: UpdateCommentInput,
): Promise<CommentResponse> {
  const comment = await prisma.comments.findUnique({
    where: { id },
  });

  if (!comment) {
    const error = new Error("Comment not found") as {
      status?: number;
      message?: string;
    };
    error.status = 404;
    throw error;
  }

  if (comment.user_id !== userId) {
    const error = new Error(
      "Unauthorized: You can only update your own comments",
    ) as {
      status?: number;
      message?: string;
    };
    error.status = 403;
    throw error;
  }

  const updated = await prisma.comments.update({
    where: { id },
    data: {
      content: input.content,
      updated_at: new Date(),
    },
  });

  return convertCommentToResponse(updated);
}

export async function deleteComment(id: bigint, userId: bigint): Promise<void> {
  const comment = await prisma.comments.findUnique({
    where: { id },
  });

  if (!comment) {
    const error = new Error("Comment not found") as {
      status?: number;
      message?: string;
    };
    error.status = 404;
    throw error;
  }

  if (comment.user_id !== userId) {
    const error = new Error(
      "Unauthorized: You can only delete your own comments",
    ) as {
      status?: number;
      message?: string;
    };
    error.status = 403;
    throw error;
  }

  await prisma.comments.delete({
    where: { id },
  });

  // Update photo comments count
  await prisma.photos.update({
    where: { id: comment.photo_id },
    data: {
      comments_count: {
        decrement: 1,
      },
    },
  });
}

function convertCommentToResponse(comment: CommentData): CommentResponse {
  return {
    id: comment.id.toString(),
    user_id: comment.user_id.toString(),
    photo_id: comment.photo_id.toString(),
    content: comment.content,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
  };
}
