import { Router, type Router as ExpressRouter } from "express";
import { createReportHandler } from "../controllers/report.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router: ExpressRouter = Router();

// Người dùng đã đăng nhập gửi báo cáo nội dung vi phạm
router.post("/", authenticateToken, createReportHandler);

export default router;
