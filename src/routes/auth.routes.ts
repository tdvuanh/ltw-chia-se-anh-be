import { Router, type Router as ExpressRouter } from "express";
import {
  register,
  verify,
  login,
  sendForgotPasswordEmail,
  resetUserPassword,
} from "../controllers/auth.controller";

const router: ExpressRouter = Router();

router.post("/register", register);
router.get("/verify-email", verify);
router.post("/login", login);
router.post("/forgot-password", sendForgotPasswordEmail);
router.post("/reset-password", resetUserPassword);

export default router;
