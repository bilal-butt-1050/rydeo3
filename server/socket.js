import { Driver } from "./models/user.model.js";

export default function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    // STUDENT: Join a route room
    socket.on("student:joinRoute", async ({ routeId }) => {
      const room = `route_${routeId}`;
      socket.join(room);
      console.log(`🎓 Student ${socket.id} joined room: ${room}`);

      const driver = await Driver.findOne({ route: routeId }).select("isSharingLocation location");
      if (driver) {
        socket.emit("driver:status", { state: driver.isSharingLocation });
        if (driver.isSharingLocation && driver.location.lat) {
          socket.emit("location:update", driver.location);
        }
      }
    });

    // DRIVER: Start Session
    socket.on("driver:startSharing", async ({ driverId, routeId }) => {
      socket.data.driverId = driverId;
      socket.data.routeId = routeId;

      const room = `route_${routeId}`;
      socket.join(room);

      await Driver.findByIdAndUpdate(driverId, { isSharingLocation: true });
      io.to(room).emit("driver:status", { state: true });
      
      // Notify admins a new driver started
      io.to("admin_room").emit("admin:driverStarted", { driverId, routeId });
    });

    // DRIVER: Live Location Update (FIXED SCOPE HERE)
    socket.on("driver:location", ({ driverId, routeId, lat, lng, totalDistance, duration, driverName, routeName }) => {
      const room = `route_${routeId}`;

      // 1. Send to Students on that route
      io.to(room).emit("location:update", { lat, lng });

      // 2. Send to Admins (NOW IN SCOPE)
      io.to("admin_room").emit("admin:locationUpdate", { 
        driverId, 
        routeId, 
        lat, 
        lng, 
        totalDistance, // Passing the stats we added to the Driver Console
        duration,
        driverName,
        routeName
      });

      // Lazy Update to DB
      Driver.updateOne({ _id: driverId }, {
        $set: { "location.lat": lat, "location.lng": lng }
      }).catch(e => console.error("DB Sync Error", e));
    });

    // DRIVER: Trigger Emergency
    socket.on("driver:emergency", ({ routeId, message }) => {
      const room = `route_${routeId}`;
      io.to(room).emit("emergency:alert", {
        message: message || "Emergency reported by driver. Please expect delays.",
        timestamp: new Date()
      });
      // Also alert admins
      io.to("admin_room").emit("admin:emergency", { routeId, message });
    });

    // ADMIN: Join global room
    socket.on("admin:join", () => {
      socket.join("admin_room");
      console.log("🛡️ Admin joined monitoring room");
    });

    // STUDENT: Signal presence at stop
    socket.on("student:signalWaiting", ({ routeId, stopId, studentName }) => {
      const room = `route_${routeId}`;
      io.to(room).emit("driver:studentWaiting", { stopId, studentName });
    });

    // DISCONNECT: Auto-Offline
    socket.on("disconnect", async () => {
      const { driverId, routeId } = socket.data;
      if (driverId) {
        await Driver.findByIdAndUpdate(driverId, { isSharingLocation: false });
        io.to(`route_${routeId}`).emit("driver:status", { state: false });
        // Notify admins
        io.to("admin_room").emit("admin:driverStopped", { driverId });
        console.log(`🛑 Driver ${driverId} forced offline`);
      }
    });
  });
}