import { Router, type Router as ExpressRouter } from "express";
import {
  getStatsHandler,
  moderatePhotoHandler,
  updateUserStatusHandler,
  deletePhotoHandler,
  deleteCommentHandler,
  getPendingPhotosHandler,
  getUsersListHandler,
  getActivityHandler,
} from "../controllers/admin.controller";
import {
  getReportsHandler,
  dismissReportHandler,
  resolveReportHandler,
} from "../controllers/report.controller";

const router: ExpressRouter = Router();

router.get("/stats", getStatsHandler);
router.get("/activity", getActivityHandler);
router.get("/moderation/pending", getPendingPhotosHandler);
router.get("/users", getUsersListHandler);

// Quản lý báo cáo nội dung vi phạm (dữ liệu thật)
router.get("/reports", getReportsHandler);
router.patch("/reports/:id/resolve", resolveReportHandler);
router.delete("/reports/:id", dismissReportHandler);

router.patch("/photos/:id/moderate", moderatePhotoHandler);
router.patch("/users/:id/status", updateUserStatusHandler);
router.delete("/photos/:id", deletePhotoHandler);
router.delete("/comments/:id", deleteCommentHandler);

export default router;
