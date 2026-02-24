import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

// Configurations & Database
import connectDB from "./config/db.js";
import seedAdmin from "./config/seedAdmin.js";
import setupSockets from "./socket.js";

// Routes & Middleware
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import studentRoutes from "./routes/student.routes.js";
import driverRoutes from "./routes/driver.routes.js";
import { protect } from "./middleware/auth.middleware.js";

// 1. Initialize App & Environment
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// 2. Connect Database & Seed
connectDB();
seedAdmin();

// 3. Global Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 4. API Routes
app.get("/", (req, res) => {
  res.send("Rydeo API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", protect(["admin"]), adminRoutes);
app.use("/api/student", protect(["student"]), studentRoutes);
app.use("/api/driver", protect(["driver"]), driverRoutes);

// 5. Create HTTP Server
const server = http.createServer(app);

// 6. Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

setupSockets(io);

// 7. Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});