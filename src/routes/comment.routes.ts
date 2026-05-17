import { Router, type Router as ExpressRouter } from "express";

import {
  getAllCommentsByPhoto,
  getComment,
  postComment,
  updateCommentHandler,
  deleteCommentHandler,
} from "../controllers/comment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router: ExpressRouter = Router();

router.get("/photos/:photoId", getAllCommentsByPhoto);
router.get("/:id", getComment);
router.post("/", authenticateToken, postComment);
router.put("/:id", authenticateToken, updateCommentHandler);
router.delete("/:id", authenticateToken, deleteCommentHandler);

export default router;
