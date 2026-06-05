import { Router, type Router as ExpressRouter } from "express";
import {
  getStatsHandler,
  moderatePhotoHandler,
  updateUserStatusHandler,
  deletePhotoHandler,
  deleteCommentHandler,
  getPendingPhotosHandler,
  getUsersListHandler,
} from "../controllers/admin.controller";

const router: ExpressRouter = Router();

router.get("/stats", getStatsHandler);
router.get("/moderation/pending", getPendingPhotosHandler);
router.get("/users", getUsersListHandler);
router.get("/reports", (req, res) => {
  res.status(200).json({ message: "Reports retrieved successfully", data: [] });
});
router.delete("/reports/:id", (req, res) => {
  res.status(200).json({ message: "Report deleted successfully" });
});
router.patch("/photos/:id/moderate", moderatePhotoHandler);
router.patch("/users/:id/status", updateUserStatusHandler);
router.delete("/photos/:id", deletePhotoHandler);
router.delete("/comments/:id", deleteCommentHandler);

export default router;
