import { Router, type Router as ExpressRouter } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  getUserProfile,
  getMyProfile,
  updateUserProfile,
} from "../controllers/user.controller";

const router: ExpressRouter = Router();

router.get("/me", authenticateToken, getMyProfile);
router.get("/:id", getUserProfile);
router.patch("/:id", authenticateToken, updateUserProfile);

export default router;
