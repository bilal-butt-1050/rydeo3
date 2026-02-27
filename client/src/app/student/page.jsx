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
  const stopMarkers = useRef([]);
  const hasNotified = useRef(false); // Track if alert already sent

  const [routeData, setRouteData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentBusLoc, setCurrentBusLoc] = useState(null);
  const [notifPermission, setNotifPermission] = useState("default");

  const [distToUserStop, setDistToUserStop] = useState(null);
  const [etaToUserStop, setEtaToUserStop] = useState(null);
  const [emergencyMessage, setEmergencyMessage] = useState(null);
  const [isWaitingSignaled, setIsWaitingSignaled] = useState(false);

  const signalDriver = () => {
    if (!routeData) return;

    socket.emit("student:signalWaiting", {
      routeId: routeData.route._id,
      stopId: routeData.preferredStopId,
      studentName: user.name
    });

    setIsWaitingSignaled(true);
    // Auto-reset after 5 minutes or when bus passes
    setTimeout(() => setIsWaitingSignaled(false), 300000);
  };

  // Helper: Haversine Distance
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  };

  const sendArrivalAlert = (dist) => {
    if (Notification.permission === "granted" && !hasNotified.current) {
      new Notification("🚌 Bus is Arriving!", {
        body: `The bus is only ${dist}km away from your stop. Get ready!`,
        icon: "/bus-icon.png" // Ensure you have an icon in /public
      });
      hasNotified.current = true; // Prevents spam
    }
  };

  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }

    const init = async () => {
      try {
        const res = await studentAPI.getMyRoute();
        const data = res.data.data;
        setRouteData(data);

        if (!socket.connected) socket.connect();

        socket.on("connect", () => {
          socket.emit("student:joinRoute", { routeId: data.route._id });
        });

        socket.on("driver:status", ({ state }) => {
          setIsOnline(state);
          if (!state) {
            setEtaToUserStop(null);
            setDistToUserStop(null);
            hasNotified.current = false; // Reset when bus goes offline
            if (busMarker.current) busMarker.current.remove();
            busMarker.current = null;
          }
        });

        socket.on("emergency:alert", ({ message }) => {
          // Show a browser alert + update local state for a UI banner
          alert(`⚠️ BUS EMERGENCY: ${message}`);
          setEmergencyMessage(message);
        });

        socket.on("location:update", ({ lat, lng }) => {
          setIsOnline(true);
          setCurrentBusLoc({ lat, lng });
          updateBusMarker(lat, lng);

          const myStop = data.route.stops.find(s => s._id === data.preferredStopId);
          if (myStop) {
            const d = getDistance(lat, lng, myStop.coordinates.lat, myStop.coordinates.lng);
            setDistToUserStop(d.toFixed(2));

            // Notification Trigger: Less than 2km away
            if (parseFloat(d) < 3.0) {
              sendArrivalAlert(d.toFixed(2));
            }

            fetchStudentETA({ lat, lng }, myStop.coordinates);
          }
        });
      } catch (err) { console.error("Init error", err); }
    };

    init();
    return () => {
      socket.off("location:update");
      socket.off("driver:status");
      socket.off("emergency:alert");
    };
  }, []);

  // Map Initialization + Polyline + Stops (Same as before)
  useEffect(() => {
    if (!routeData || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [routeData.route.stops[0].coordinates.lng, routeData.route.stops[0].coordinates.lat],
      zoom: 13,
    });

    map.current.on("load", async () => {
      routeData.route.stops.forEach((stop) => {
        const isMyStop = stop._id === routeData.preferredStopId;
        const el = document.createElement('div');
        el.className = isMyStop ? styles.myStopMarker : styles.regularStopMarker;
        const label = document.createElement('span');
        label.className = styles.markerLabel;
        label.innerText = stop.name;
        el.appendChild(label);

        new mapboxgl.Marker(el)
          .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
          .addTo(map.current);
      });

      const coords = routeData.route.stops.map(s => `${s.coordinates.lng},${s.coordinates.lat}`).join(';');
      try {
        const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${mapboxgl.accessToken}`);
        const json = await res.json();
        const data = json.routes[0].geometry;
        map.current.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: data } });
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.6 }
        });
      } catch (e) { console.error("Polyline Error", e); }
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

  const handleRecenter = () => {
    if (!map.current || !currentBusLoc || !routeData) return;
    const myStop = routeData.route.stops.find(s => s._id === routeData.preferredStopId);
    const bounds = new mapboxgl.LngLatBounds()
      .extend([currentBusLoc.lng, currentBusLoc.lat])
      .extend([myStop.coordinates.lng, myStop.coordinates.lat]);
    map.current.fitBounds(bounds, { padding: 80, duration: 1500 });
  };

  const fetchStudentETA = async (busLoc, stopLoc) => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${busLoc.lng},${busLoc.lat};${stopLoc.lng},${stopLoc.lat}?access_token=${mapboxgl.accessToken}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        setEtaToUserStop(Math.ceil(data.routes[0].duration / 60));
      }
    } catch (err) { console.error("ETA Error:", err); }
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

        {/* Notification Permission Banner */}
        {notifPermission === "default" && (
          <div className={styles.notifPrompt}>
            <p>Get alerted when bus is near!</p>
            <button onClick={requestNotificationPermission}>Enable Notifications</button>
          </div>
        )}

        {emergencyMessage && (
          <div className={styles.emergencyOverlay}>
            <div className={styles.emergencyContent}>
              <h3>⚠️ EMERGENCY ALERT</h3>
              <p>{emergencyMessage}</p>
              <button onClick={() => setEmergencyMessage(null)}>Acknowledge</button>
            </div>
          </div>
        )}

        {isOnline && distToUserStop ? (
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
        ) : (
          <div className={styles.waitingState}>
            <p>Waiting for driver to start sharing location...</p>
          </div>
        )}

        {isOnline && (
          <button
            className={`${styles.signalBtn} ${isWaitingSignaled ? styles.signalActive : ""}`}
            onClick={signalDriver}
            disabled={isWaitingSignaled}
          >
            {isWaitingSignaled ? "✅ Driver Notified" : "🙋‍♂️ I'm at the Stop"}
          </button>
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

      <button className={styles.recenterBtn} onClick={handleRecenter} disabled={!isOnline}>
        📍 Recenter to Bus
      </button>

      <div ref={mapContainer} className={styles.mapContainer} />
    </div>
  );
}