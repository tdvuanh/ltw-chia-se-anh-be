import express from "express";
import {
  getAllPhotos,
  getPhotoById,
  createPhoto,
  updatePhoto,
  deletePhoto,
} from "../controllers/photo.controller";

const router = express.Router();

router.get("/", getAllPhotos);
router.get("/:id", getPhotoById);
router.post("/", createPhoto);
router.put("/:id", updatePhoto);
router.delete("/:id", deletePhoto);

export default router;
