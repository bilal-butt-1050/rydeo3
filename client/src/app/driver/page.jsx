"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import socket from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { driverAPI } from "@/lib/api";
import styles from "./page.module.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const PROXIMITY_THRESHOLD = 0.2; // 200 meters

export default function DriverConsole() {
  const { user } = useAuth();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  
  const [routeData, setRouteData] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [activeStopIndex, setActiveStopIndex] = useState(-1);
  const [distToNext, setDistToNext] = useState(null);
  const [eta, setEta] = useState(null);

  // Haversine Distance Helper (for proximity detection)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  // Fetch Accurate ETA from Mapbox Directions API
const fetchAccurateETA = async (startLoc, endLoc) => {
    try {
      // Use 'driving-traffic' for high-accuracy real-time calculations
      const profile = "mapbox/driving-traffic"; 
      const url = `https://api.mapbox.com/directions/v5/${profile}/${startLoc.lng},${startLoc.lat};${endLoc.lng},${endLoc.lat}?access_token=${mapboxgl.accessToken}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        // duration is in seconds
        const durationSeconds = data.routes[0].duration; 
        
        // Buses typically move 10-20% slower than the average car due to size/stops
        // If you feel Mapbox is being too conservative (6 mins vs 3 mins), 
        // you can apply a "Confidence Factor" or just use the raw data.
        const minutes = Math.round(durationSeconds / 60);
        
        setEta(minutes);
      }
    } catch (err) {
      console.error("ETA Fetch Error:", err);
    }
  };

  // 1. Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const res = await driverAPI.getAssignedRoute();
        setRouteData(res.data.data);
        
        const savedSharing = localStorage.getItem("driver_sharing_active") === "true";
        if (savedSharing) {
          startTracking(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch route", err);
      }
    };
    init();
    if (!socket.connected) socket.connect();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 2. Map Setup
  useEffect(() => {
    if (!routeData || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [routeData.route.stops[0].coordinates.lng, routeData.route.stops[0].coordinates.lat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on("load", async () => {
      // Draw Markers
      routeData.route.stops.forEach((stop, i) => {
        new mapboxgl.Marker({ color: i === 0 ? "#10b981" : i === routeData.route.stops.length - 1 ? "#ef4444" : "#3b82f6" })
          .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<b>${stop.name}</b>`))
          .addTo(map.current);
      });

      // Draw Route Polyline
      const coords = routeData.route.stops.map(s => `${s.coordinates.lng},${s.coordinates.lat}`).join(';');
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
      );
      const json = await query.json();
      
      if (json.routes && json.routes[0]) {
        map.current.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: json.routes[0].geometry } });
        map.current.addLayer({
          id: 'route',
          type: 'line', source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.75 }
        });
      }
    });
  }, [routeData]);

  // 3. Tracking Logic
  const startTracking = (data) => {
    if (watchId) return;
    let lastEtaUpdateTime = 0;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        socket.emit("driver:location", {
          driverId: user.id || user._id,
          routeId: data.route._id,
          lat: latitude, lng: longitude
        });

        if (marker.current) {
          marker.current.setLngLat([longitude, latitude]);
        } else if (map.current) {
          marker.current = new mapboxgl.Marker({ color: "#fbbf24", scale: 1.2 })
            .setLngLat([longitude, latitude]).addTo(map.current);
        }

        // Proximity Logic
        let currentActive = -1;
        data.route.stops.forEach((stop, index) => {
          const dist = getDistance(latitude, longitude, stop.coordinates.lat, stop.coordinates.lng);
          if (dist < PROXIMITY_THRESHOLD) currentActive = index;
        });

        if (currentActive !== -1) setActiveStopIndex(currentActive);

        // ETA & Distance to NEXT stop
        const nextStop = data.route.stops[currentActive + 1];
        if (nextStop) {
          const d = getDistance(latitude, longitude, nextStop.coordinates.lat, nextStop.coordinates.lng);
          setDistToNext(d.toFixed(2));

          // Throttle ETA calls to every 30 seconds
          const now = Date.now();
          if (now - lastEtaUpdateTime > 30000) {
            fetchAccurateETA({ lat: latitude, lng: longitude }, nextStop.coordinates);
            lastEtaUpdateTime = now;
          }
        } else {
          setDistToNext(null);
          setEta(null);
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );

    setWatchId(id);
    setIsSharing(true);
    localStorage.setItem("driver_sharing_active", "true");
    socket.emit("driver:startSharing", { driverId: user.id || user._id, routeId: data.route._id });
  };

  const toggleSharing = async () => {
    if (!isSharing) {
      await driverAPI.toggleSharing(true);
      startTracking(routeData);
    } else {
      await driverAPI.toggleSharing(false);
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsSharing(false);
      localStorage.setItem("driver_sharing_active", "false");
      if (marker.current) marker.current.remove();
      marker.current = null;
      setDistToNext(null);
      setEta(null);
    }
  };

  const recenter = () => {
    if (currentLocation) {
      map.current.flyTo({ center: [currentLocation.lng, currentLocation.lat], zoom: 15 });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.controls}>
          <button className={isSharing ? styles.stopBtn : styles.startBtn} onClick={toggleSharing}>
            {isSharing ? "Stop Sharing Location" : "Start Sharing Location"}
          </button>
          <button className={styles.recenterBtn} onClick={recenter} disabled={!currentLocation}>
            Recenter Map
          </button>
        </div>

        {isSharing && (
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <span>Distance</span>
              <h3>{distToNext ? `${distToNext} km` : "--"}</h3>
            </div>
            <div className={styles.infoCard}>
              <span>Est. Time</span>
              <h3>{eta ? `${eta} min` : "--"}</h3>
            </div>
          </div>
        )}

        <div className={styles.stopList}>
          <div className={styles.listHeader}>
             <h3>Route Progress</h3>
             <p>{routeData?.route.name}</p>
          </div>
          {routeData?.route.stops.map((stop, index) => {
            const isArrived = index <= activeStopIndex;
            const isNext = index === activeStopIndex + 1;
            return (
              <div key={stop._id} className={`${styles.stopItem} ${isArrived ? styles.arrived : ""} ${isNext ? styles.nextStop : ""}`}>
                 <span className={styles.order}>{isArrived ? "✓" : index + 1}</span>
                 <div className={styles.stopInfo}>
                    <p className={styles.stopName}>{stop.name}</p>
                    {isNext && <span className={styles.nextTag}>Next Stop</span>}
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