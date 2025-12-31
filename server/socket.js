import { Driver } from "./models/user.model.js";

export default function setupSocket(io) {
  // Map driverId -> socketId for tracking
  const driverSockets = new Map();

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    /* =============== STUDENT EVENTS =============== */
    
    socket.on("student:joinRoute", async ({ routeId }) => {
      try {
        if (!routeId) {
          console.warn("student:joinRoute - missing routeId");
          return;
        }

        const room = `route_${routeId}`;
        socket.join(room);
        console.log(`🎓 ${socket.id} joined ${room}`);

        // Find driver for this route and send current status
        const driver = await Driver.findOne({ route: routeId }).select(
          "_id isSharingLocation location name"
        );

        if (driver) {
          // Send driver sharing status
          socket.emit("driver:status", {
            driverId: driver._id.toString(),
            state: Boolean(driver.isSharingLocation),
          });

          // If driver is sharing and has location, send it
          if (
            driver.isSharingLocation &&
            driver.location?.lat != null &&
            driver.location?.lng != null
          ) {
            socket.emit("location:update", {
              driverId: driver._id.toString(),
              lat: driver.location.lat,
              lng: driver.location.lng,
            });
          }
        }
      } catch (err) {
        console.error("student:joinRoute error:", err);
      }
    });

    /* =============== DRIVER EVENTS =============== */
    
    socket.on("driver:startSharing", async ({ driverId, routeId }) => {
      try {
        if (!driverId || !routeId) {
          console.warn("driver:startSharing - missing driverId or routeId");
          return;
        }

        // Validate driver exists
        const driver = await Driver.findById(driverId).select("route");
        if (!driver) {
          console.warn("driver:startSharing - driver not found:", driverId);
          return;
        }

        // Check if route matches (optional but recommended)
        if (driver.route && driver.route.toString() !== routeId.toString()) {
          console.warn(
            `driver:startSharing - route mismatch: expected ${driver.route}, got ${routeId}`
          );
        }

        // Track driver socket
        driverSockets.set(driverId.toString(), socket.id);

        // Join route room
        const room = `route_${routeId}`;
        socket.join(room);

        // Update DB
        await Driver.findByIdAndUpdate(driverId, { isSharingLocation: true });

        // Notify all students in the room
        io.to(room).emit("driver:status", {
          driverId: driverId.toString(),
          state: true,
        });

        console.log(`🚚 Driver ${driverId} started sharing in ${room}`);
      } catch (err) {
        console.error("driver:startSharing error:", err);
      }
    });

    socket.on("driver:stopSharing", async ({ driverId, routeId }) => {
      try {
        if (!driverId || !routeId) {
          console.warn("driver:stopSharing - missing driverId or routeId");
          return;
        }

        const room = `route_${routeId}`;
        socket.leave(room);

        // Update DB
        await Driver.findByIdAndUpdate(driverId, { isSharingLocation: false });

        // Notify students
        io.to(room).emit("driver:status", {
          driverId: driverId.toString(),
          state: false,
        });

        // Remove from tracking
        driverSockets.delete(driverId.toString());

        console.log(`🛑 Driver ${driverId} stopped sharing in ${room}`);
      } catch (err) {
        console.error("driver:stopSharing error:", err);
      }
    });

    socket.on("driver:location", async ({ driverId, routeId, lat, lng }) => {
      try {
        if (!driverId || !routeId) {
          console.warn("driver:location - missing driverId or routeId");
          return;
        }

        // Validate coordinates
        const latNum = Number(lat);
        const lngNum = Number(lng);
        
        if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
          console.warn("driver:location - invalid coordinates:", { lat, lng });
          return;
        }

        // Update DB (non-blocking)
        Driver.findByIdAndUpdate(driverId, {
          location: { lat: latNum, lng: lngNum },
        }).catch(err => {
          console.error("Failed to persist driver location:", err);
        });

        // Broadcast to room
        const room = `route_${routeId}`;
        io.to(room).emit("location:update", {
          driverId: driverId.toString(),
          lat: latNum,
          lng: lngNum,
        });
      } catch (err) {
        console.error("driver:location error:", err);
      }
    });

    /* =============== DISCONNECT =============== */
    
    socket.on("disconnect", async () => {
      try {
        console.log("⚰️ Socket disconnected:", socket.id);

        // Find if this was a driver socket
        for (const [driverId, sId] of driverSockets.entries()) {
          if (sId === socket.id) {
            console.log("Driver socket disconnected:", driverId);

            // Get driver to find route
            const driver = await Driver.findById(driverId).select("route");
            if (driver && driver.route) {
              const room = `route_${driver.route}`;

              // Mark as not sharing
              await Driver.findByIdAndUpdate(driverId, { 
                isSharingLocation: false 
              });

              // Notify students
              io.to(room).emit("driver:status", {
                driverId: driverId.toString(),
                state: false,
              });
            }

            driverSockets.delete(driverId);
            break;
          }
        }
      } catch (err) {
        console.error("disconnect handler error:", err);
      }
    });
  });

  return io;
}