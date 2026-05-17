import { Router, type Router as ExpressRouter } from "express";

import {
  getAllPhotos,
  getPhotoById,
  createPhoto,
  updatePhoto,
  deletePhoto,
} from "../controllers/photo.controller";

const router: ExpressRouter = Router();

router.get("/", getAllPhotos);
router.get("/:id", getPhotoById);
router.post("/", createPhoto);
router.put("/:id", updatePhoto);
router.delete("/:id", deletePhoto);

export default router;
