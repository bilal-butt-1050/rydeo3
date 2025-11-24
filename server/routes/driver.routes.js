import express from "express";
import {updateLocation, toggleSharing} from "../controllers/driver.controller.js";

const router = express.Router();
router.post("/update-location", updateLocation);
router.post("/sharing", toggleSharing);

export default router;