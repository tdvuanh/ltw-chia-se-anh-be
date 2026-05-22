import { Router, type Router as ExpressRouter } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  getAllPhotos,
  getPhotoById,
  createPhoto,
  updatePhoto,
  deletePhoto,
  likePhotoHandler,
  unlikePhotoHandler,
  getPhotoLikesHandler,
  searchPhotosHandler,
  getPhotosByUserHandler,
  getFeedHandler,
} from "../controllers/photo.controller";

const router: ExpressRouter = Router();

router.get("/search", searchPhotosHandler);
router.get("/feed", authenticateToken, getFeedHandler);
router.get("/", getAllPhotos);
router.post("/", authenticateToken, createPhoto);
router.get("/:id", getPhotoById);
router.patch("/:id", authenticateToken, updatePhoto);
router.delete("/:id", authenticateToken, deletePhoto);
router.post("/:id/like", authenticateToken, likePhotoHandler);
router.delete("/:id/like", authenticateToken, unlikePhotoHandler);
router.get("/:id/likes", getPhotoLikesHandler);
router.get("/user/:userId", getPhotosByUserHandler);

export default router;
