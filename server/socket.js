// server/socket.js
import { Server } from "socket.io";
import { Driver } from "./models/user.model.js"; // your Driver discriminator
import mongoose from "mongoose";

export default function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // map driverId -> socketId
  const driverSockets = new Map();

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // STUDENT JOIN
    socket.on("student:joinRoute", async ({ routeId }) => {
      try {
        if (!routeId) return;
        const room = `route_${routeId}`;
        socket.join(room);
        console.log(`🎓 ${socket.id} joined ${room}`);

        // find any driver assigned to this route
        const driver = await Driver.findOne({ route: routeId }).select(
          "_id isSharingLocation location name"
        );

        if (driver) {
          // notify this student of current driver sharing state
          socket.emit("driver:status", {
            driverId: driver._id.toString(),
            state: Boolean(driver.isSharingLocation),
          });

          // if driver is sharing and has last known coords, send them
          if (
            driver.isSharingLocation &&
            driver.location &&
            driver.location.lat != null &&
            driver.location.lng != null
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

    // DRIVER START SHARING
    socket.on("driver:startSharing", async ({ driverId, routeId }) => {
      try {
        if (!driverId || !routeId) {
          console.warn("driver:startSharing missing driverId/routeId");
          return;
        }

        // validate driver exists and route matches
        const driver = await Driver.findById(driverId).select("route");
        if (!driver) {
          console.warn("driver not found:", driverId);
          return;
        }
        // If driver.route exists and doesn't match provided routeId, log but continue
        if (driver.route && driver.route.toString() !== routeId.toString()) {
          console.warn(
            `Driver route mismatch: driver.route=${driver.route} provided=${routeId}`
          );
          // optional: you could reject here
        }

        // store driver socket
        driverSockets.set(driverId.toString(), socket.id);

        const room = `route_${routeId}`;
        socket.join(room);

        // update DB flag
        await Driver.findByIdAndUpdate(driverId, { isSharingLocation: true });

        // broadcast to students in room that driver started sharing
        io.to(room).emit("driver:status", {
          driverId,
          state: true,
        });

        console.log(`🚚 Driver ${driverId} joined ${room} and started sharing`);
      } catch (err) {
        console.error("driver:startSharing error:", err);
      }
    });

    // DRIVER STOP SHARING
    socket.on("driver:stopSharing", async ({ driverId, routeId }) => {
      try {
        if (!driverId || !routeId) return;

        const room = `route_${routeId}`;
        socket.leave(room);

        await Driver.findByIdAndUpdate(driverId, { isSharingLocation: false });

        io.to(room).emit("driver:status", {
          driverId,
          state: false,
        });

        driverSockets.delete(driverId.toString());

        console.log(`🛑 Driver ${driverId} left ${room} and stopped sharing`);
      } catch (err) {
        console.error("driver:stopSharing error:", err);
      }
    });

    // DRIVER LOCATION UPDATE (live)
    socket.on("driver:location", async ({ driverId, routeId, lat, lng }) => {
      try {
        if (!driverId || !routeId) return;
        // validate numbers
        const latNum = Number(lat);
        const lngNum = Number(lng);
        if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return;

        // Persist last known location to DB (non-blocking if you want)
        await Driver.findByIdAndUpdate(driverId, {
          location: { lat: latNum, lng: lngNum },
        });

        // Broadcast to everyone in route room
        const room = `route_${routeId}`;
        io.to(room).emit("location:update", {
          driverId,
          lat: latNum,
          lng: lngNum,
        });
      } catch (err) {
        console.error("driver:location error:", err);
      }
    });

    // DISCONNECT: if a driver socket disconnects, try to find driver and mark stopped
    socket.on("disconnect", async () => {
      try {
        console.log("⚰️ Socket disconnected:", socket.id);
        // find driver entry in driverSockets map
        for (const [driverId, sId] of driverSockets.entries()) {
          if (sId === socket.id) {
            console.log("Driver socket disconnected -> clearing sharing flag:", driverId);
            // set DB flag false and notify route room
            const driver = await Driver.findById(driverId).select("route");
            if (driver) {
              const room = `route_${driver.route}`;
              await Driver.findByIdAndUpdate(driverId, { isSharingLocation: false });
              io.to(room).emit("driver:status", {
                driverId,
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
