import { io } from "socket.io-client";

let socket = null;
let connectionPromise = null;

export const initSocket = () => {
  if (socket) return socket;

  // If connection is in progress, return the promise
  if (connectionPromise) return connectionPromise;

  connectionPromise = new Promise((resolve, reject) => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || "";
      const serverUrl = api.endsWith("/api") ? api.replace(/\/api$/, "") : api || "";

      socket = io(serverUrl, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      socket.on("connect", () => {
        console.log("🔗 Socket connected:", socket.id);
        resolve(socket);
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
      });

      socket.on("connect_error", (error) => {
        console.error("🔴 Socket connection error:", error.message);
        reject(error);
      });

      socket.on("error", (error) => {
        console.error("🔴 Socket error:", error);
      });

    } catch (error) {
      console.error("Failed to initialize socket:", error);
      reject(error);
    }
  });

  return socket;
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
    console.warn("Socket not connected, initializing...");
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionPromise = null;
  }
};