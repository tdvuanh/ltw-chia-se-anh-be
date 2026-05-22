import { Router, type Router as ExpressRouter } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  getUserProfile,
  getMyProfile,
  updateUserProfile,
  followUserHandler,
  unfollowUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  searchUsersHandler,
} from "../controllers/user.controller";

const router: ExpressRouter = Router();

router.get("/search", searchUsersHandler);
router.get("/me", authenticateToken, getMyProfile);
router.post("/:id/follow", authenticateToken, followUserHandler);
router.delete("/:id/follow", authenticateToken, unfollowUserHandler);
router.get("/:id/followers", getFollowersHandler);
router.get("/:id/following", getFollowingHandler);
router.get("/:id", getUserProfile);
router.patch("/:id", authenticateToken, updateUserProfile);

export default router;
