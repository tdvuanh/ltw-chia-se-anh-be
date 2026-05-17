import { Router, type Router as ExpressRouter } from "express";

import {
  getAllCommentsByPhoto,
  getComment,
  postComment,
  updateCommentHandler,
  deleteCommentHandler,
} from "../controllers/comment.controller";

const router: ExpressRouter = Router();

router.get("/photos/:photoId", getAllCommentsByPhoto);
router.get("/:id", getComment);
router.post("/", postComment);
router.put("/:id", updateCommentHandler);
router.delete("/:id", deleteCommentHandler);

export default router;
