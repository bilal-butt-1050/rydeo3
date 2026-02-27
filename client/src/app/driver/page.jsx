"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import socket from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { driverAPI } from "@/lib/api";
import styles from "./page.module.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function DriverConsole() {
  const { user } = useAuth();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const driverMarker = useRef(null);
  const watchId = useRef(null);
  const prevLocation = useRef(null);

  const [routeData, setRouteData] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeStopIndex, setActiveStopIndex] = useState(-1);
  const [distToNext, setDistToNext] = useState(null);
  const [eta, setEta] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [waitingList, setWaitingList] = useState({});

  // Summary States
  const [startTime, setStartTime] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // Helper: Haversine Distance (KM)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const triggerEmergency = () => {
    const confirmApp = confirm("Are you sure you want to trigger an Emergency Alert? All students will be notified.");
    if (confirmApp) {
      setIsEmergency(true);
      socket.emit("driver:emergency", {
        routeId: routeData.route._id,
        message: "Technical issue with the bus. Please stay at your stops; we are coordinating a backup."
      });
      setTimeout(() => setIsEmergency(false), 10000);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await driverAPI.getAssignedRoute();
        setRouteData(res.data.data);
      } catch (err) { console.error("Failed to fetch route", err); }
    };
    init();
    if (!socket.connected) socket.connect();

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      socket.emit("driver:stopSharing", { driverId: user?.id, routeId: routeData?.route._id });
    };
  }, []);

  useEffect(() => {
    if (!routeData || map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-night-v1",
      center: [routeData.route.stops[0].coordinates.lng, routeData.route.stops[0].coordinates.lat],
      zoom: 13,
    });

    map.current.on("load", () => {
      routeData.route.stops.forEach((stop) => {
        const el = document.createElement('div');
        el.className = styles.stopMarker;
        const label = document.createElement('span');
        label.className = styles.markerLabel;
        label.innerText = stop.name;
        el.appendChild(label);
        new mapboxgl.Marker(el).setLngLat([stop.coordinates.lng, stop.coordinates.lat]).addTo(map.current);
      });

      map.current.addSource('dynamic-route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'dynamic-route',
        paint: { 'line-color': '#3b82f6', 'line-width': 6, 'line-opacity': 0.8 }
      });
    });
  }, [routeData]);

  useEffect(() => {
    if (!socket.connected) return;
    socket.on("driver:studentWaiting", ({ stopId }) => {
      setWaitingList(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) + 1 }));
      new Audio('/notification.mp3').play().catch(() => { });
    });
    return () => socket.off("driver:studentWaiting");
  }, []);

  const updateDynamicRoute = async (driverLoc, stops, currentIndex) => {
    const remainingStops = stops.slice(currentIndex + 1);
    if (remainingStops.length === 0) return;
    const coords = [`${driverLoc.lng},${driverLoc.lat}`, ...remainingStops.map(s => `${s.coordinates.lng},${s.coordinates.lat}`)].join(';');
    try {
      const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${mapboxgl.accessToken}`);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        map.current.getSource('dynamic-route').setData(data.routes[0].geometry);
        setEta(Math.round(data.routes[0].duration / 60));
        setDistToNext((data.routes[0].distance / 1000).toFixed(2));
      }
    } catch (e) { console.error("Routing error", e); }
  };

  const startTracking = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc = { lat: latitude, lng: longitude };
        setCurrentLocation(loc);

        // Calculate Total Distance for Summary
        if (prevLocation.current) {
          const d = getDistance(prevLocation.current.lat, prevLocation.current.lng, latitude, longitude);
          setTotalDistance(prev => prev + d);
        }
        prevLocation.current = loc;

        socket.emit("driver:location", {
          driverId: user.id || user._id,
          routeId: routeData.route._id,
          lat: latitude,
          lng: longitude,
          // Add these for the Admin dashboard:
          totalDistance: totalDistance.toFixed(2),
          duration: Math.floor((Date.now() - startTime) / 60000),
          driverName: user.name,
          routeName: routeData.route.name
        });

        if (!driverMarker.current) {
          const el = document.createElement('div');
          el.className = styles.driverPointer;
          driverMarker.current = new mapboxgl.Marker(el).setLngLat([longitude, latitude]).addTo(map.current);
        } else {
          driverMarker.current.setLngLat([longitude, latitude]);
        }

        let nearestIdx = activeStopIndex;
        routeData.route.stops.forEach((stop, idx) => {
          const d = getDistance(latitude, longitude, stop.coordinates.lat, stop.coordinates.lng);
          if (d < 0.2) nearestIdx = idx;
        });

        setActiveStopIndex(nearestIdx);
        updateDynamicRoute(loc, routeData.route.stops, nearestIdx);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  };

  const toggleSharing = async () => {
    const nextState = !isSharing;
    try {
      await driverAPI.toggleSharing(nextState);
      setIsSharing(nextState);

      if (nextState) {
        setStartTime(Date.now());
        setTotalDistance(0);
        prevLocation.current = null;
        socket.emit("driver:startSharing", { driverId: user.id || user._id, routeId: routeData.route._id });
        startTracking();
      } else {
        if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
        socket.disconnect();
        setShowSummary(true);
        setTimeout(() => socket.connect(), 1000);

        if (driverMarker.current) driverMarker.current.remove();
        driverMarker.current = null;
        setDistToNext(null);
        setEta(null);
        if (map.current.getSource('dynamic-route')) {
          map.current.getSource('dynamic-route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
        }
      }
    } catch (err) { alert("Toggle failed"); }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.card}>
          <h2 className={styles.routeTitle}>{routeData?.route.name || "Loading..."}</h2>
          <button className={isSharing ? styles.stopBtn : styles.startBtn} onClick={toggleSharing}>
            {isSharing ? "⏹ End Session" : "▶ Start Sharing"}
          </button>
        </div>

        {isSharing && (
          <>
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <small>NEXT STOP</small>
                <p>{distToNext || "--"} km</p>
              </div>
              <div className={styles.statBox}>
                <small>ETA</small>
                <p>{eta || "--"} min</p>
              </div>
            </div>
            <button
              className={`${styles.emergencyBtn} ${isEmergency ? styles.emergencyActive : ""}`}
              onClick={triggerEmergency}
            >
              {isEmergency ? "⚠️ ALERT SENT" : "🚨 EMERGENCY ALERT"}
            </button>
          </>
        )}

        <div className={styles.timeline}>
          {routeData?.route.stops.map((stop, index) => {
            const isPassed = index <= activeStopIndex;
            return (
              <div key={stop._id} className={`${styles.timelineItem} ${isPassed ? styles.passed : ""}`}>
                <div className={styles.dot} />
                <div className={styles.info}>
                  <p className={styles.name}>{stop.name}</p>
                  {waitingList[stop._id] > 0 && (
                    <span className={styles.waitingBadge}>👥 {waitingList[stop._id]} waiting</span>
                  )}
                  {index === activeStopIndex + 1 && <span className={styles.nextBadge}>UP NEXT</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div ref={mapContainer} className={styles.map} />

      {/* SHIFT SUMMARY OVERLAY */}
      {showSummary && (
        <div className={styles.summaryOverlay}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <div className={styles.checkIcon}>✓</div>
              <h2>Shift Completed!</h2>
              <p>{new Date().toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>

            <div className={styles.summaryStats}>
              <div className={styles.sumStat}>
                <span>Duration</span>
                <p>{startTime ? Math.floor((Date.now() - startTime) / 60000) : 0} mins</p>
              </div>
              <div className={styles.sumStat}>
                <span>Distance</span>
                <p>{totalDistance.toFixed(2)} km</p>
              </div>
              <div className={styles.sumStat}>
                <span>Stops</span>
                <p>{activeStopIndex + 1} / {routeData?.route.stops.length}</p>
              </div>
            </div>

            <button className={styles.closeSummaryBtn} onClick={() => setShowSummary(false)}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}