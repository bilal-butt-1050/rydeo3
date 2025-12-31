"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/logoutButton";
import styles from "./page.module.css";
import { authAPI } from "@/lib/api";
import { initSocket, getSocket } from "@/lib/socket";
import Map from "@/components/Map";

export default function StudentPage() {
  const router = useRouter();
  const [route, setRoute] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(false);
  const [driverSharing, setDriverSharing] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const mapRef = useRef(null);
  const listenersAttachedRef = useRef(false);

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

  // Load student data
  useEffect(() => {
    async function loadStudent() {
      try {
        const res = await authAPI.getMe();
        
        if (!res.success) {
          router.push("/login");
          return;
        }

        if (res.role !== "student") {
          router.push("/login");
          return;
        }

        const routeObj = res.route || null;
        const driverObj = routeObj?.assignedDriver || null;
        
        setRoute(routeObj);
        setDriver(driverObj);

        if (!routeObj) {
          setError("No route assigned to your account");
        }
      } catch (err) {
        console.error("Failed to load student:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadStudent();
  }, [router]);

  const attachListeners = () => {
    if (listenersAttachedRef.current) return;

    const sock = getSocket();
    if (!sock || !sock.connected) {
      console.error("Socket not connected");
      setError("Not connected to server");
      return;
    }

    // Remove old listeners first
    sock.off("driver:status");
    sock.off("location:update");

    sock.on("driver:status", ({ state }) => {
      console.log("📍 Driver status:", state);
      setDriverSharing(state);
      if (!state) {
        setDriverLocation(null);
      }
    });

    sock.on("location:update", ({ lat, lng }) => {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        console.error("Invalid location:", { lat, lng });
        return;
      }

      console.log("📍 Driver location:", latNum, lngNum);
      setDriverLocation({ lat: latNum, lng: lngNum });
      
      if (mapRef.current) {
        mapRef.current.updateDriverLocation(lngNum, latNum);
      }
    });

    listenersAttachedRef.current = true;
  };

  const detachListeners = () => {
    const sock = getSocket();
    if (sock) {
      sock.off("driver:status");
      sock.off("location:update");
    }
    listenersAttachedRef.current = false;
  };

  const startViewing = () => {
    if (!route?._id) {
      setError("No route assigned");
      return;
    }

    setError("");
    const sock = getSocket();
    
    if (!sock || !sock.connected) {
      setError("Not connected to server. Please refresh the page.");
      return;
    }

    sock.emit("student:joinRoute", { routeId: route._id });
    console.log("🎓 Joined route:", route._id);
    
    attachListeners();
    setViewing(true);
  };

  const stopViewing = () => {
    detachListeners();
    setViewing(false);
    setDriverSharing(false);
    setDriverLocation(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewing) {
        detachListeners();
      }
    };
  }, [viewing]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading student data...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Student Portal</h1>
      <LogoutButton />

      {route && <p>Your Route: <strong>{route.name}</strong></p>}
      {driver && <p>Driver: <strong>{driver.name}</strong></p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button
        className={viewing ? styles.stopBtn : styles.startBtn}
        onClick={viewing ? stopViewing : startViewing}
        disabled={!route?._id}
      >
        {viewing ? "Stop Viewing" : "Start Viewing Driver"}
      </button>

      <div className={styles.status}>
        {viewing && (
          driverSharing 
            ? "✅ Driver is sharing location" 
            : "❌ Driver is not sharing location"
        )}
      </div>

      {viewing && driverSharing && (
        <div className={styles.mapWrapper}>
          <Map ref={mapRef} />
        </div>
      )}

      {driverLocation && (
        <div className={styles.status}>
          📍 Driver: {driverLocation.lat.toFixed(5)}, {driverLocation.lng.toFixed(5)}
        </div>
      )}
    </div>
  );
}