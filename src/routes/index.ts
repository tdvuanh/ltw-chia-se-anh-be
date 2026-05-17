import { Router, type Router as ExpressRouter } from "express";

import photoRouter from "./photo.routes";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";

const router: ExpressRouter = Router();

router.use("/photos", photoRouter);
router.use("/auth", authRouter);
router.use("/users", userRouter);

export default router;
