import http from "http";
import app from "./app.js";
import dotenv from "dotenv";
import { Server } from "socket.io";
import setupSockets from "./socket.js";

dotenv.config();

const PORT = process.env.PORT;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:true,
    credentials: true,
  },
});

setupSockets(io);


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
