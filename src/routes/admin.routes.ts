import { Router, type Router as ExpressRouter } from "express";
import {
  getStatsHandler,
  moderatePhotoHandler,
  updateUserStatusHandler,
  deletePhotoHandler,
  deleteCommentHandler,
} from "../controllers/admin.controller";

const router: ExpressRouter = Router();

router.get("/stats", getStatsHandler);
router.patch("/photos/:id/moderate", moderatePhotoHandler);
router.patch("/users/:id/status", updateUserStatusHandler);
router.delete("/photos/:id", deletePhotoHandler);
router.delete("/comments/:id", deleteCommentHandler);

export default router;
