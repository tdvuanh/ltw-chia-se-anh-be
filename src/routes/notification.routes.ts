import { Router, type Router as ExpressRouter } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  getNotificationsHandler,
  getUnreadCountHandler,
  markReadHandler,
  markAllReadHandler,
} from "../controllers/notification.controller";

const router: ExpressRouter = Router();

router.get("/", authenticateToken, getNotificationsHandler);
router.get("/unread-count", authenticateToken, getUnreadCountHandler);
router.patch("/read-all", authenticateToken, markAllReadHandler);
router.patch("/:id/read", authenticateToken, markReadHandler);

export default router;
