import { Router, type Router as ExpressRouter } from "express";
import authRoutes from "./auth.routes";

const router: ExpressRouter = Router();

router.use("/auth", authRoutes);

export default router;
