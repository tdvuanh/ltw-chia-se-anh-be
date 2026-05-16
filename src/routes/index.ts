import { Router, type Router as ExpressRouter } from "express";
import authRoutes from "./auth.routes";
import photoRoutes from "./photo.routes";

const router: ExpressRouter = Router();

router.use("/auth", authRoutes);
router.use("/photos", photoRoutes);

export default router;
