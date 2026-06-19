import { Router, type Router as ExpressRouter } from "express";

import photoRouter from "./photo.routes";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";
import commentRouter from "./comment.routes";
import adminRouter from "./admin.routes";
import reportRouter from "./report.routes";
import notificationRouter from "./notification.routes";
import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware";

const router: ExpressRouter = Router();

router.use("/photos", photoRouter);
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/comments", commentRouter);
router.use("/reports", reportRouter);
router.use("/notifications", notificationRouter);
router.use("/admin", authenticateToken, requireAdmin, adminRouter);

export default router;
