import { Router, type Router as ExpressRouter } from "express";
import { authenticateToken, optionalAuth } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import {
  getUserProfile,
  getMyProfile,
  updateUserProfile,
  uploadAvatarHandler,
  changePasswordHandler,
  followUserHandler,
  unfollowUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  searchUsersHandler,
} from "../controllers/user.controller";

const router: ExpressRouter = Router();

router.get("/search", searchUsersHandler);
router.get("/me", authenticateToken, getMyProfile);
router.post(
  "/me/avatar",
  authenticateToken,
  upload.single("avatar"),
  uploadAvatarHandler,
);
router.post("/me/change-password", authenticateToken, changePasswordHandler);
router.post("/:id/follow", authenticateToken, followUserHandler);
router.delete("/:id/follow", authenticateToken, unfollowUserHandler);
router.get("/:id/followers", getFollowersHandler);
router.get("/:id/following", getFollowingHandler);
router.get("/:id", optionalAuth, getUserProfile);
router.patch("/:id", authenticateToken, updateUserProfile);

export default router;
