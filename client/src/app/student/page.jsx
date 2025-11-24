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

  const socketRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => { socketRef.current = initSocket(); }, []);

  useEffect(() => {
    async function loadStudent() {
      try {
        const res = await authAPI.getMe();
        if (!res) return router.push("/login"); // redirect if no user
        const routeObj = res.route?._id ? res.route : null;
        const driverObj = routeObj?.assignedDriver || null;
        setRoute(routeObj);
        setDriver(driverObj);
      } catch (err) {
        console.error(err);
        router.push("/login"); // redirect if API fails
      } finally { setLoading(false); }
    }
    loadStudent();
  }, [router]);

  const attachListeners = () => {
    const sock = getSocket();
    sock.off("driver:status");
    sock.off("location:update");

    sock.on("driver:status", ({ state }) => {
      setDriverSharing(state);
      if (!state) setDriverLocation(null);
    });

    sock.on("location:update", ({ lat, lng }) => {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return;

      setDriverLocation({ lat: latNum, lng: lngNum });
      if (mapRef.current) mapRef.current.updateDriverLocation(lngNum, latNum);
    });
  };

  const startViewing = () => {
    if (!route?._id) return;
    getSocket().emit("student:joinRoute", { routeId: route._id });
    attachListeners();
    setViewing(true);
  };

  const stopViewing = () => {
    const sock = getSocket();
    sock.off("driver:status");
    sock.off("location:update");
    setViewing(false);
    setDriverSharing(false);
    setDriverLocation(null);
  };

  if (loading) return <div className={styles.container}><p>Loading student...</p></div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Student Portal</h1>
      <LogoutButton />

      {route && <p className={styles.info}>Route: {route.name}</p>}
      {driver && <p className={styles.info}>Driver: {driver.name}</p>}

      <button
        className={viewing ? styles.stopBtn : styles.startBtn}
        onClick={viewing ? stopViewing : startViewing}
        disabled={!route?._id}
      >
        {viewing ? "Stop Viewing Driver Location" : "Start Viewing Driver Location"}
      </button>

      <div className={styles.status}>
        {driverSharing ? "Driver is currently sharing location." : "Driver is not sharing location."}
      </div>

      {viewing && <div className={styles.mapWrapper}><Map ref={mapRef} /></div>}

      {driverLocation && (
        <div className={styles.status}>
          Driver Location: {driverLocation.lat.toFixed(5)}, {driverLocation.lng.toFixed(5)}
        </div>
      )}
    </div>
  );
}
