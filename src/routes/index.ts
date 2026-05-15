import express from "express";
import photoRoutes from "./photo.routes";

const router = express.Router();

router.use("/photos", photoRoutes);

export default router;
