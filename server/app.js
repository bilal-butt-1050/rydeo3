import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import seedAdmin from "./config/seedAdmin.js";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import studentRoutes from "./routes/student.routes.js";
import driverRoutes from "./routes/driver.routes.js";
import { protect } from "./middleware/auth.middleware.js";

dotenv.config();
connectDB();
seedAdmin();

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Rydeo API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", protect(["admin"]), adminRoutes);
app.use("/api/student",protect(["student"]), studentRoutes);
app.use("/api/driver",protect(["driver"]), driverRoutes);


export default app;