import { Request, Response, NextFunction } from "express";
import {
  createReport,
  getReports,
  dismissReport,
  resolveReport,
  type ReportStatus,
} from "../services/report.service";
import { createReportSchema, validate } from "../utils/validation";
import { createError } from "../middlewares/error.middleware";

/**
 * [User] Gửi báo cáo một ảnh hoặc bình luận vi phạm.
 * POST /reports
 */
export async function createReportHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { error, value } = validate(createReportSchema, req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const report = await createReport(BigInt(req.user.userId), {
      target_type: value.target_type,
      target_id: BigInt(value.target_id),
      reason: value.reason,
      description: value.description,
    });

    res.status(201).json({
      message: "Report submitted successfully",
      data: { report },
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    next(createError(e.status || 500, e.message || "Failed to submit report"));
  }
}

/**
 * Chuẩn hoá một bản ghi report (đã include quan hệ) thành cấu trúc phẳng cho FE.
 */
function mapReport(r: any) {
  const isPhoto = r.target_type === "photo";
  const content = isPhoto
    ? r.photo?.title ?? "(Ảnh đã bị xoá)"
    : r.comment?.content ?? "(Bình luận đã bị xoá)";
  const owner = isPhoto
    ? r.photo?.users?.username ?? null
    : r.comment?.users?.username ?? null;

  return {
    id: r.id,
    target_type: r.target_type,
    reason: r.reason,
    description: r.description,
    status: r.status,
    created_at: r.created_at,
    reported_by: r.reporter?.username ?? "unknown",
    reporter: r.reporter ?? null,
    content,
    content_owner: owner,
    photo_id: r.photo_id,
    comment_id: r.comment_id,
    image_url: isPhoto ? r.photo?.image_url ?? null : null,
  };
}

/**
 * [Admin] Lấy danh sách báo cáo.
 * GET /admin/reports?status=pending&page=1&limit=20
 */
export async function getReportsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const status = (req.query.status as ReportStatus | "all") || "pending";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const skip = (page - 1) * limit;

    const { reports, total } = await getReports(status, skip, limit);

    res.status(200).json({
      message: "Reports retrieved successfully",
      data: reports.map(mapReport),
      pagination: { page, limit, total },
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    next(createError(e.status || 500, e.message || "Failed to retrieve reports"));
  }
}

/**
 * [Admin] Bỏ qua một báo cáo (xoá phiếu, giữ nội dung).
 * DELETE /admin/reports/:id
 */
export async function dismissReportHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await dismissReport(BigInt(req.params.id as string));
    res.status(200).json({ message: "Report dismissed successfully" });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    next(createError(e.status || 500, e.message || "Failed to dismiss report"));
  }
}

/**
 * [Admin] Xử lý báo cáo bằng cách xoá nội dung vi phạm.
 * PATCH /admin/reports/:id/resolve
 */
export async function resolveReportHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await resolveReport(BigInt(req.params.id as string));
    res.status(200).json({
      message: `Report resolved: reported ${result.target_type} has been removed`,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    next(createError(e.status || 500, e.message || "Failed to resolve report"));
  }
}
