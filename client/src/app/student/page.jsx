"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import socket from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { studentAPI } from "@/lib/api";
import styles from "./page.module.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function StudentLiveTracking() {
  const { user } = useAuth();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const busMarker = useRef(null);
  
  const [routeData, setRouteData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  
  // Student-specific metrics
  const [distToUserStop, setDistToUserStop] = useState(null);
  const [etaToUserStop, setEtaToUserStop] = useState(null);

  // Helper: Calculate Haversine Distance (KM)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Helper: Fetch Mapbox ETA specifically for the student
  const fetchStudentETA = async (busLoc, stopLoc) => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${busLoc.lng},${busLoc.lat};${stopLoc.lng},${stopLoc.lat}?access_token=${mapboxgl.accessToken}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        setEtaToUserStop(Math.ceil(data.routes[0].duration / 60));
      }
    } catch (err) {
      console.error("Student ETA Error:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await studentAPI.getMyRoute();
        const data = res.data.data;
        setRouteData(data);

        if (!socket.connected) socket.connect();

        socket.on("connect", () => {
          socket.emit("student:joinRoute", { routeId: data.route._id });
        });

        if (socket.connected) {
          socket.emit("student:joinRoute", { routeId: data.route._id });
        }

        socket.on("driver:status", ({ state }) => {
          setIsOnline(state);
          if (!state) {
            setEtaToUserStop(null);
            setDistToUserStop(null);
          }
        });

        socket.on("location:update", ({ lat, lng }) => {
          setIsOnline(true);
          updateBusMarker(lat, lng);

          // Calculate distance and ETA to Student's Preferred Stop
          const myStop = data.route.stops.find(s => s._id === data.preferredStopId);
          if (myStop) {
            const d = getDistance(lat, lng, myStop.coordinates.lat, myStop.coordinates.lng);
            setDistToUserStop(d.toFixed(2));
            
            // Only call Mapbox API if the bus is somewhat close to avoid excessive API calls
            // or throttle it (here we fetch it on every update, but Mapbox is fast)
            fetchStudentETA({ lat, lng }, myStop.coordinates);
          }
        });
      } catch (err) {
        console.error("Initialization error", err);
      }
    };

    init();

    return () => {
      socket.off("location:update");
      socket.off("driver:status");
    };
  }, []);

  // Map Initialization logic
  useEffect(() => {
    if (!routeData || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [routeData.route.stops[0].coordinates.lng, routeData.route.stops[0].coordinates.lat],
      zoom: 14,
    });

    map.current.on("load", () => {
      routeData.route.stops.forEach((stop) => {
        const isMyStop = stop._id === routeData.preferredStopId;
        new mapboxgl.Marker({ color: isMyStop ? "#3b82f6" : "#cbd5e1" })
          .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
          .addTo(map.current);
      });
    });
  }, [routeData]);

  const updateBusMarker = (lat, lng) => {
    if (!map.current) return;
    if (!busMarker.current) {
      const el = document.createElement('div');
      el.className = styles.busMarker;
      el.innerHTML = '🚌';
      busMarker.current = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current);
    } else {
      busMarker.current.setLngLat([lng, lat]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.statusPanel}>
        <header className={styles.header}>
          <h1>Live Tracking</h1>
          <div className={`${styles.badge} ${isOnline ? styles.online : styles.offline}`}>
            {isOnline ? "BUS IS LIVE" : "BUS OFFLINE"}
          </div>
        </header>

        {isOnline && distToUserStop && (
          <div className={styles.studentStats}>
            <div className={styles.statCard}>
              <span>To Your Stop</span>
              <h2>{etaToUserStop || "--"} <small>min</small></h2>
            </div>
            <div className={styles.statCard}>
              <span>Distance</span>
              <h2>{distToUserStop} <small>km</small></h2>
            </div>
          </div>
        )}

        <div className={styles.stopList}>
          <h3>Route Progress</h3>
          {routeData?.route.stops.map((stop) => {
            const isMyStop = stop._id === routeData.preferredStopId;
            return (
              <div key={stop._id} className={`${styles.stopItem} ${isMyStop ? styles.myStop : ""}`}>
                <div className={styles.stopDot}></div>
                <div className={styles.stopInfo}>
                  <p className={styles.stopName}>{stop.name}</p>
                  {isMyStop && <span className={styles.myStopBadge}>Your Pickup Point</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div ref={mapContainer} className={styles.mapContainer} />
    </div>
  );
}