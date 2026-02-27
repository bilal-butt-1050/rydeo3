"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import socket from "@/lib/socket";
import { adminAPI } from "@/lib/api";
import styles from "./page.module.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function AdminDashboard() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({}); 
  const stopMarkers = useRef([]); 

  const [activeDrivers, setActiveDrivers] = useState({});
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [inspectedRouteData, setInspectedRouteData] = useState(null);
  const [activeStopIndex, setActiveStopIndex] = useState(-1);

  // Helper: Haversine distance
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [74.3587, 31.5204],
        zoom: 12,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      
      // Fixes the "Grey Map" issue by forcing a resize calculation
      map.current.on('load', () => {
        map.current.resize();
      });
    }

    if (!socket.connected) socket.connect();
    socket.emit("admin:join");

    socket.on("admin:locationUpdate", (data) => {
      const { driverId, lat, lng } = data;
      setActiveDrivers(prev => ({ ...prev, [driverId]: { ...data, lastUpdate: new Date() } }));

      if (!markers.current[driverId]) {
        const el = document.createElement('div');
        el.className = styles.adminBusMarker;
        el.innerHTML = '🚌';
        markers.current[driverId] = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current);
      } else {
        markers.current[driverId].setLngLat([lng, lat]);
      }
    });

    return () => {
      socket.off("admin:locationUpdate");
    };
  }, []);

  // 2. Separate Effect to handle Route Inspection Progress
  useEffect(() => {
    if (selectedDriverId && activeDrivers[selectedDriverId]) {
      const driver = activeDrivers[selectedDriverId];
      updateInspectionProgress(driver.lat, driver.lng);
    }
  }, [activeDrivers, selectedDriverId]);

  const updateInspectionProgress = async (lat, lng) => {
    if (!inspectedRouteData || !map.current.getSource('inspect-route')) return;

    // Logic for passed stops
    let nearestIdx = -1;
    inspectedRouteData.stops.forEach((stop, idx) => {
      const d = getDistance(lat, lng, stop.coordinates.lat, stop.coordinates.lng);
      if (d < 0.3) nearestIdx = idx; // Threshold 300m
    });
    if (nearestIdx > activeStopIndex) setActiveStopIndex(nearestIdx);

    // Draw Dynamic Polyline
    const remainingStops = inspectedRouteData.stops.slice(activeStopIndex + 1);
    const coords = [`${lng},${lat}`, ...remainingStops.map(s => `${s.coordinates.lng},${s.coordinates.lat}`)].join(';');

    try {
      const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${mapboxgl.accessToken}`);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        map.current.getSource('inspect-route').setData(data.routes[0].geometry);
      }
    } catch (e) { console.error("Mapbox Route Error", e); }
  };

  const handleSelectDriver = async (driverId, routeId) => {
    setSelectedDriverId(driverId);
    try {
      // Adjusted for your backend which returns the object directly
      const res = await adminAPI.getRoute(routeId);
      const route = res.data; // Changed from res.data.data to res.data
      setInspectedRouteData(route);
      setupInspectionMap(route, activeDrivers[driverId]);
    } catch (err) {
      console.error("Fetch Route Error:", err);
    }
  };

  const setupInspectionMap = (route, driver) => {
    clearInspectionAssets();

    // Add Stops and Labels
    route.stops.forEach((stop) => {
      const el = document.createElement('div');
      el.className = styles.stopMarker;
      const label = document.createElement('div');
      label.className = styles.stopLabel;
      label.innerText = stop.name;
      el.appendChild(label);

      const m = new mapboxgl.Marker(el).setLngLat([stop.coordinates.lng, stop.coordinates.lat]).addTo(map.current);
      stopMarkers.current.push(m);
    });

    // Add Route Source/Layer
    map.current.addSource('inspect-route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
    });

    map.current.addLayer({
      id: 'inspect-line',
      type: 'line',
      source: 'inspect-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#3b82f6', 'line-width': 6, 'line-opacity': 0.8 }
    });

    if (driver) map.current.flyTo({ center: [driver.lng, driver.lat], zoom: 14 });
    
    // Ensure map is not greyed out after sidebar transition
    setTimeout(() => map.current.resize(), 300);
  };

  const clearInspectionAssets = () => {
    if (map.current.getLayer('inspect-line')) map.current.removeLayer('inspect-line');
    if (map.current.getSource('inspect-route')) map.current.removeSource('inspect-route');
    stopMarkers.current.forEach(m => m.remove());
    stopMarkers.current = [];
  };

  const handleBack = () => {
    setSelectedDriverId(null);
    setInspectedRouteData(null);
    setActiveStopIndex(-1);
    clearInspectionAssets();
    map.current.flyTo({ center: [74.3587, 31.5204], zoom: 12 });
  };

  const recenter = () => {
    const driver = activeDrivers[selectedDriverId];
    if (driver) map.current.flyTo({ center: [driver.lng, driver.lat], zoom: 15 });
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <header className={styles.header}>
          <h2>{selectedDriverId ? "Inspection" : "Live Fleet"}</h2>
          {selectedDriverId && <button onClick={handleBack} className={styles.backBtn}>← All Buses</button>}
        </header>

        {!selectedDriverId ? (
          <div className={styles.list}>
            {Object.values(activeDrivers).length === 0 && <p className={styles.empty}>No buses active</p>}
            {Object.values(activeDrivers).map(driver => (
              <div key={driver.driverId} className={styles.card} onClick={() => handleSelectDriver(driver.driverId, driver.routeId)}>
                <div className={styles.cardInfo}>
                  <strong>{driver.driverName}</strong>
                  <span>{driver.routeName}</span>
                </div>
                <div className={styles.pulse} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.inspection}>
            <div className={styles.inspectInfo}>
              <strong>{activeDrivers[selectedDriverId]?.driverName}</strong>
              <small>{activeDrivers[selectedDriverId]?.routeName}</small>
            </div>
            
            <div className={styles.progressList}>
              {inspectedRouteData?.stops.map((stop, i) => (
                <div key={stop._id} className={`${styles.stopItem} ${i <= activeStopIndex ? styles.passed : ""}`}>
                  <div className={styles.dot} />
                  <div className={styles.stopText}>
                    <p>{stop.name}</p>
                    {i === activeStopIndex + 1 && <span className={styles.statusBadge}>NEXT STOP</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className={styles.mapWrapper}>
        <div ref={mapContainer} className={styles.mapView} />
        {selectedDriverId && (
          <button className={styles.recenterBtn} onClick={recenter}>🎯 Recenter on Bus</button>
        )}
      </main>
    </div>
  );
}