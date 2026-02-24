import express from "express";
import {toggleSharing, getAssignedRoute} from "../controllers/driver.controller.js";

const router = express.Router();
router.post("/sharing", toggleSharing);
router.get("/assigned-route", getAssignedRoute);


export default router;