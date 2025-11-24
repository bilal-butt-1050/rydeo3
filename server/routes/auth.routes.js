import express from "express";
import { login, logout, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", protect(), logout);
router.get("/me", protect(), getMe);

export default router;