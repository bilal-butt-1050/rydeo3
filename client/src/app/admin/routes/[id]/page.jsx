"use client";
import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ArrowLeft, Navigation, MapPin } from "lucide-react";
import styles from "./page.module.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;

export default function ViewRoute({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    adminAPI.getRoute(id).then((res) => {
      setRouteData(res.data);
      initMap(res.data);
    });
    return () => map.current?.remove();
  }, [id]);

  const initMap = async (data) => {
    if (!mapContainer.current || !data.stops.length) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [data.stops[0].coordinates.lng, data.stops[0].coordinates.lat],
      zoom: 12,
    });

    map.current.on("load", async () => {
      const bounds = new mapboxgl.LngLatBounds();

      data.stops.forEach((stop, index) => {
        const coords = [stop.coordinates.lng, stop.coordinates.lat];
        
        const el = document.createElement("div");
        el.className = styles.markerPin;
        el.style.backgroundColor = index === 0 ? "#10b981" : index === data.stops.length - 1 ? "#ef4444" : "#2563eb";
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.borderRadius = "50%";
        el.style.border = "2px solid white";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.color = "white";
        el.style.fontSize = "10px";
        el.style.fontWeight = "bold";
        el.innerHTML = `<span>${index + 1}</span>`;

        new mapboxgl.Marker(el)
          .setLngLat(coords)
          .setPopup(new mapboxgl.Popup().setHTML(`<b>${stop.name}</b>`))
          .addTo(map.current);

        bounds.extend(coords);
      });

      map.current.fitBounds(bounds, { padding: 50, duration: 1000 });

      if (data.stops.length >= 2) {
        const coordinates = data.stops.map(s => [s.coordinates.lng, s.coordinates.lat]);
        try {
          const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": ORS_API_KEY },
            body: JSON.stringify({ coordinates })
          });
          const routeJson = await res.json();
          
          map.current.addSource("route", {
            type: "geojson",
            data: routeJson.features[0]
          });

          map.current.addLayer({
            id: "route-layer",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#2563eb", "line-width": 5, "line-opacity": 0.7 }
          });
        } catch (err) {
          console.error("Could not fetch road geometry:", err);
        }
      }
    });
  };

  if (!routeData) return <div className={styles.loading}>Loading Route Map...</div>;

  return (
    <div className={styles.viewContainer}>
      <div className={styles.viewHeader}>
        <div className={styles.headerLeft}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className={styles.viewTitle}>{routeData.name}</h2>
            <span className={styles.routeBadge}>{routeData.code}</span>
          </div>
        </div>
        <div className={styles.routeStats}>
          <span><strong>{routeData.stops.length}</strong> Stops</span>
        </div>
      </div>

      <div className={styles.viewMain}>
        <div ref={mapContainer} className={styles.viewMap} />
        
        <div className={styles.stopSidebar}>
          <h3>Stop Sequence</h3>
          <div className={styles.timeline}>
            {routeData.stops.map((s, i) => (
              <div key={s._id} className={styles.timelineItem}>
                <div className={styles.timelinePoint} style={{backgroundColor: i === 0 ? "#10b981" : i === routeData.stops.length - 1 ? "#ef4444" : "#2563eb"}} />
                <div className={styles.timelineContent}>
                  <strong>{s.name}</strong>
                  <p>{s.coordinates.lat.toFixed(4)}, {s.coordinates.lng.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}