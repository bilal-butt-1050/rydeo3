import express from "express";
import {getStudent, createStudent, updateStudent, deleteStudent, listStudents} from "../controllers/admin/student.controller.js";
import {getDriver, createDriver, updateDriver, deleteDriver, listDrivers} from "../controllers/admin/driver.controller.js";
import {getRoute, createRoute, updateRoute, deleteRoute, listRoutes} from "../controllers/admin/route.controller.js";
import {getStopsByRoute, addStop, updateStop, deleteStop} from "../controllers/admin/stop.controller.js";


const router = express.Router();

// Protect all admin actions

/* ---------------- STUDENTS ---------------- */
router.post("/students", createStudent);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);
router.get("/students", listStudents);
router.get("/students/:id", getStudent);

/* ---------------- DRIVERS ---------------- */
router.post("/drivers", createDriver);
router.put("/drivers/:id", updateDriver);
router.delete("/drivers/:id", deleteDriver);
router.get("/drivers", listDrivers);
router.get("/drivers/:id", getDriver);

/* ---------------- ROUTES ---------------- */
router.post("/routes", createRoute);
router.put("/routes/:id", updateRoute);
router.delete("/routes/:id", deleteRoute);
router.get("/routes", listRoutes);  
router.get("/routes/:id", getRoute);

/* ---------------- ROUTE STOPS ---------------- */
router.post("/routes/:routeId/stops", addStop);
router.put("/routes/stops/:id", updateStop);
router.delete("/routes/stops/:id", deleteStop);
router.get("/routes/:routeId/stops", getStopsByRoute);


export default router;
