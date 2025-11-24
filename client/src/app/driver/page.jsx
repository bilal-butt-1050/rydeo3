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

  useEffect(() => { socketRef.current = initSocket(); }, []);

  useEffect(() => {
    async function loadDriver() {
      try {
        const res = await authAPI.getMe();
        if (!res) return router.push("/login"); // redirect if not logged in
        const routeObj = res.route?._id ? res.route : null;
        setDriverId(res._id || res.id || null);
        setRoute(routeObj);
      } catch (err) {
        console.error(err);
        router.push("/login"); // redirect if API fails
      } finally { setLoading(false); }
    }
    loadDriver();
  }, [router]);

  const startSharing = async () => {
    if (!driverId || !route?._id) return;
    try {
      await driverAPI.toggleSharing(true);
      getSocket().emit("driver:startSharing", { driverId, routeId: route._id });
      console.log("🚚 Emitted driver:startSharing");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to start sharing");
    }
  };

  const stopSharing = async () => {
    if (!driverId || !route?._id) return;
    try {
      await driverAPI.toggleSharing(false);
      getSocket().emit("driver:stopSharing", { driverId, routeId: route._id });
      console.log("🛑 Emitted driver:stopSharing");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to stop sharing");
    }
  };

  const sendLocation = async (lat, lng) => {
    if (!driverId || !route?._id) return;
    driverAPI.updateLocation({ driverId, lat, lng }).catch(e => {
      console.warn("Persist location failed:", e.message);
    });
    getSocket().emit("driver:location", { driverId, routeId: route._id, lat, lng });
  };

  const handleToggle = async () => {
    if (!driverId || !route?._id) {
      setError("Driver profile not loaded yet");
      return;
    }

    if (sharing) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      await stopSharing();
      setSharing(false);
      return;
    }

    await startSharing();

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (mapRef.current) mapRef.current.updateDriverLocation(lng, lat);
        await sendLocation(lat, lng);
      },
      (err) => { setError("Failed to fetch live location"); console.error(err); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    watchIdRef.current = id;
    setSharing(true);
  };

  if (loading) return <div className={styles.container}><p>Loading driver...</p></div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Driver Dashboard</h1>
      <LogoutButton />

      {route && <p className={styles.info}>Assigned Route: {route.name}</p>}
      {error && <p className={styles.error}>{error}</p>}

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

      {sharing && <div className={styles.mapWrapper}><Map ref={mapRef} /></div>}
    </div>
  );
}
