import { Driver } from "./models/user.model.js";

export default function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    // STUDENT: Join a route room
    socket.on("student:joinRoute", async ({ routeId }) => {
      const room = `route_${routeId}`;
      socket.join(room);
      console.log(`🎓 Student ${socket.id} joined room: ${room}`);

      // Fetch current driver status once and send to the joining student
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
    });

    // DRIVER: Live Location Update
    socket.on("driver:location", ({ driverId, routeId, lat, lng }) => {
      const room = `route_${routeId}`;

      // FIXED: Use io.to(room) to ensure the message is broadcasted to everyone in the room
      io.to(room).emit("location:update", { lat, lng });

      // Lazy Update to DB
      Driver.updateOne({ _id: driverId }, {
        $set: { "location.lat": lat, "location.lng": lng }
      }).catch(e => console.error("DB Sync Error", e));
    });

    // DISCONNECT: Auto-Offline
    socket.on("disconnect", async () => {
      const { driverId, routeId } = socket.data;
      if (driverId) {
        await Driver.findByIdAndUpdate(driverId, { isSharingLocation: false });
        io.to(`route_${routeId}`).emit("driver:status", { state: false });
        console.log(`🛑 Driver ${driverId} forced offline`);
      }
    });
  });
}