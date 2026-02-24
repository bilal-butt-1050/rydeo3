import express from "express";
import { getStudentRouteInfo } from "../controllers/student.controller.js";

const router = express.Router();

router.get("/my-route", getStudentRouteInfo);

export default router;