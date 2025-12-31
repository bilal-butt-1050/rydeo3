"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Map from "@/components/Map";
import LogoutButton from "@/components/logoutButton";
import { driverAPI, authAPI } from "@/lib/api";
import { initSocket, getSocket } from "@/lib/socket";

export default function DriverPage() {
  const router = useRouter();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [driverId, setDriverId] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  const watchIdRef = useRef(null);
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket
  useEffect(() => {
    const setupSocket = async () => {
      try {
        socketRef.current = await initSocket();
      } catch (err) {
        console.error("Socket initialization failed:", err);
        setError("Failed to connect to server");
      }
    };
    setupSocket();
  }, []);

  // Load driver data
  useEffect(() => {
    async function loadDriver() {
      try {
        const res = await authAPI.getMe();
        
        if (!res.success) {
          router.push("/login");
          return;
        }

        if (res.role !== "driver") {
          router.push("/login");
          return;
        }

        setDriverId(res.id);
        setRoute(res.route || null);

        if (!res.route) {
          setError("No route assigned to this driver");
        }
      } catch (err) {
        console.error("Failed to load driver:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadDriver();
  }, [router]);

  const startSharing = async () => {
    if (!driverId || !route?._id) {
      setError("Driver data not loaded");
      return;
    }

    try {
      await driverAPI.toggleSharing(true);
      const socket = getSocket();
      
      if (socket && socket.connected) {
        socket.emit("driver:startSharing", { 
          driverId, 
          routeId: route._id 
        });
        console.log("🚚 Started sharing location");
      } else {
        throw new Error("Socket not connected");
      }
    } catch (err) {
      console.error("Start sharing failed:", err);
      setError(err.message || "Failed to start sharing");
      throw err;
    }
  };

  const stopSharing = async () => {
    if (!driverId || !route?._id) return;

    try {
      await driverAPI.toggleSharing(false);
      const socket = getSocket();
      
      if (socket && socket.connected) {
        socket.emit("driver:stopSharing", { 
          driverId, 
          routeId: route._id 
        });
        console.log("🛑 Stopped sharing location");
      }
    } catch (err) {
      console.error("Stop sharing failed:", err);
      setError(err.message || "Failed to stop sharing");
      throw err;
    }
  };

  const sendLocation = (lat, lng) => {
    if (!driverId || !route?._id) return;

    // Validate coordinates
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.error("Invalid coordinates:", { lat, lng });
      return;
    }

    // Persist to database (non-blocking)
    driverAPI.updateLocation({ lat, lng }).catch(e => {
      console.warn("Failed to persist location:", e.message);
    });

    // Emit via socket
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit("driver:location", { 
        driverId, 
        routeId: route._id, 
        lat, 
        lng 
      });
    }
  };

  const handleToggle = async () => {
    if (!driverId || !route?._id) {
      setError("Driver profile not loaded");
      return;
    }

    setError(""); // Clear previous errors

    if (sharing) {
      // Stop sharing
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      try {
        await stopSharing();
        setSharing(false);
      } catch (err) {
        // Error already logged
      }
      return;
    }

    // Start sharing
    try {
      await startSharing();

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          if (mapRef.current) {
            mapRef.current.updateDriverLocation(lng, lat);
          }
          
          sendLocation(lat, lng);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Failed to get location: " + err.message);
          setSharing(false);
          watchIdRef.current = null;
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 0, 
          timeout: 10000 
        }
      );

      watchIdRef.current = id;
      setSharing(true);
    } catch (err) {
      // Error already logged
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (sharing && driverId && route?._id) {
        stopSharing().catch(console.error);
      }
    };
  }, [sharing, driverId, route]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading driver data...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Driver Dashboard</h1>
      <LogoutButton />

      {route && <p>Assigned Route: <strong>{route.name}</strong></p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className={styles.toggleWrapper}>
        <span className={sharing ? styles.activeText : styles.inactiveText}>
          {sharing ? "Location Sharing: ON" : "Location Sharing: OFF"}
        </span>
        <button
          className={sharing ? styles.stopBtn : styles.startBtn}
          onClick={handleToggle}
          disabled={!driverId || !route?._id}
        >
          {sharing ? "Stop Sharing" : "Start Sharing"}
        </button>
      </div>

      {sharing && (
        <div className={styles.mapWrapper}>
          <Map ref={mapRef} />
        </div>
      )}
    </div>
  );
}