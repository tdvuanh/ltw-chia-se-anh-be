import prisma from "../config/prisma";
import { deleteCommentByAdmin, deletePhotoByAdmin } from "./admin.service";

export type ReportTarget = "photo" | "comment";
export type ReportStatus = "pending" | "resolved" | "dismissed";

interface CreateReportInput {
  target_type: ReportTarget;
  target_id: bigint;
  reason: string;
  description?: string | null;
}

/**
 * Người dùng gửi một báo cáo vi phạm cho một ảnh hoặc một bình luận.
 * Kiểm tra đối tượng tồn tại và chống gửi trùng (cùng người báo cáo, cùng đối tượng, đang chờ xử lý).
 */
export async function createReport(reporterId: bigint, input: CreateReportInput) {
  const { target_type, target_id, reason, description } = input;

  let photo_id: bigint | null = null;
  let comment_id: bigint | null = null;

  if (target_type === "photo") {
    const photo = await prisma.photos.findUnique({ where: { id: target_id } });
    if (!photo) {
      throw { status: 404, message: "Photo not found" };
    }
    photo_id = target_id;
  } else {
    const comment = await prisma.comments.findUnique({ where: { id: target_id } });
    if (!comment) {
      throw { status: 404, message: "Comment not found" };
    }
    comment_id = target_id;
  }

  // Chống báo cáo trùng lặp khi vẫn đang chờ xử lý
  const existing = await prisma.reports.findFirst({
    where: {
      reporter_id: reporterId,
      status: "pending",
      ...(photo_id ? { photo_id } : { comment_id }),
    },
  });

  if (existing) {
    throw { status: 409, message: "You have already reported this content" };
  }

  const report = await prisma.reports.create({
    data: {
      reporter_id: reporterId,
      target_type,
      photo_id,
      comment_id,
      reason,
      description: description ?? null,
    },
  });

  return report;
}

/**
 * Admin lấy danh sách báo cáo, kèm thông tin người báo cáo và bản xem trước nội dung bị báo cáo.
 */
export async function getReports(
  status: ReportStatus | "all",
  skip: number,
  limit: number,
) {
  const where = status === "all" ? {} : { status };

  const [reports, total] = await Promise.all([
    prisma.reports.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: {
        reporter: {
          select: { id: true, username: true, avatar_url: true },
        },
        photo: {
          select: {
            id: true,
            title: true,
            image_url: true,
            status: true,
            users: { select: { id: true, username: true } },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            photo_id: true,
            users: { select: { id: true, username: true } },
          },
        },
      },
    }),
    prisma.reports.count({ where }),
  ]);

  return { reports, total };
}

export async function getReportById(reportId: bigint) {
  const report = await prisma.reports.findUnique({ where: { id: reportId } });
  if (!report) {
    throw { status: 404, message: "Report not found" };
  }
  return report;
}

/**
 * Admin bỏ qua (dismiss) một báo cáo: xoá phiếu báo cáo, giữ nguyên nội dung.
 */
export async function dismissReport(reportId: bigint) {
  await getReportById(reportId);
  await prisma.reports.delete({ where: { id: reportId } });
}

/**
 * Admin xử lý (resolve) một báo cáo bằng cách xoá nội dung vi phạm.
 * Việc xoá nội dung sẽ cascade xoá luôn các phiếu báo cáo liên quan.
 */
export async function resolveReport(reportId: bigint) {
  const report = await prisma.reports.findUnique({ where: { id: reportId } });
  if (!report) {
    throw { status: 404, message: "Report not found" };
  }

  if (report.target_type === "photo" && report.photo_id) {
    await deletePhotoByAdmin(BigInt(report.photo_id));
  } else if (report.target_type === "comment" && report.comment_id) {
    await deleteCommentByAdmin(BigInt(report.comment_id));
  } else {
    // Nội dung đã bị xoá trước đó -> chỉ cần xoá phiếu báo cáo
    await prisma.reports.deleteMany({ where: { id: reportId } });
  }

  return { target_type: report.target_type };
}
