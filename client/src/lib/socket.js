// client/lib/socket.js
import { io } from "socket.io-client";

let socket = null;

export const initSocket = () => {
  if (!socket) {
    // produce server baseURL (strip trailing /api if present)
    const api = process.env.NEXT_PUBLIC_API_URL || "";
    const serverUrl = api.endsWith("/api") ? api.replace(/\/api$/, "") : api || "";

    socket = io(serverUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🔗 Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) return initSocket();
  return socket;
};
