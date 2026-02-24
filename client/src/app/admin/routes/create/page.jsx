"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Save, Trash2, Search, Navigation } from "lucide-react";
import styles from "../page.module.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;

export default function RouteArchitect() {
  const router = useRouter();
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  const [routeName, setRouteName] = useState("");
  const [routeCode, setRouteCode] = useState("");
  const [stops, setStops] = useState([]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const markers = useRef([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [74.3587, 31.5204],
      zoom: 12,
    });

    map.current.on("load", () => {
      map.current.getCanvas().style.cursor = "crosshair";
      
      map.current.addSource("route-source", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } }
      });

      map.current.addLayer({
        id: "route-layer",
        type: "line",
        source: "route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#3b82f6", "line-width": 5, "line-opacity": 0.8 }
      });

      map.current.on("click", async (e) => {
        const { lng, lat } = e.lngLat;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const name = data.display_name ? data.display_name.split(',')[0] : `Manual Pin`;
          handleAddStop(name, lat, lng);
        } catch (err) {
          handleAddStop(`Pin ${stops.length + 1}`, lat, lng);
        }
      });
    });

    return () => map.current?.remove();
  }, [stops.length]); // Re-bind listener to access updated stops length if needed

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (search.length < 3) return setSuggestions([]);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&addressdetails=1&limit=5&viewbox=74.0,31.8,74.6,31.2&bounded=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) { console.error("Geocoding error:", error); }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const fetchRoadRoute = async (currentStops) => {
    if (currentStops.length < 2) return;
    const coordinates = currentStops.map(s => [s.coordinates.lng, s.coordinates.lat]);
    try {
      const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": ORS_API_KEY },
        body: JSON.stringify({ coordinates })
      });
      const data = await response.json();
      if (data.features?.length > 0) {
        map.current.getSource("route-source").setData(data.features[0].geometry);
      }
    } catch (error) { console.error("Routing error:", error); }
  };

  const handleAddStop = (displayName, lat, lon) => {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const newStop = {
      name: displayName,
      coordinates: { lat: latNum, lng: lonNum },
      order: stops.length
    };

    const updatedStops = [...stops, newStop];
    setStops(updatedStops);

    const marker = new mapboxgl.Marker({ color: "#3b82f6" })
      .setLngLat([lonNum, latNum])
      .addTo(map.current);
    
    markers.current.push(marker);
    fetchRoadRoute(updatedStops);
    setSearch("");
    setSuggestions([]);
  };

  const clearStops = () => {
    markers.current.forEach(m => m.remove());
    markers.current = [];
    setStops([]);
    map.current.getSource("route-source").setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] } });
  };

  const handleSave = async () => {
    if (!routeName || stops.length < 2) return alert("Add name and at least 2 stops.");
    setIsLoading(true);
    try {
      await adminAPI.createRoute({ name: routeName, code: routeCode, stops });
      router.push("/admin/routes");
    } catch (err) { alert("Save failed"); }
    finally { setIsLoading(false); }
  };

  return (
    <div className={styles.architectWrapper}>
      <aside className={styles.panel}>
        <div className={styles.section}>
          <h3>Route Architect</h3>
          <input className={styles.mainInput} value={routeName} onChange={e => setRouteName(e.target.value)} placeholder="Route Name" />
          <input className={styles.mainInput} value={routeCode} onChange={e => setRouteCode(e.target.value)} placeholder="Route Code" />
          <div className={styles.searchBox}>
            <label><Search size={14}/> Find or Click Map</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search location..." />
            {suggestions.length > 0 && (
              <ul className={styles.suggestionList}>
                {suggestions.map((item, idx) => (
                  <li key={idx} onClick={() => handleAddStop(item.display_name.split(',')[0], item.lat, item.lon)}>
                    <strong>{item.display_name.split(',')[0]}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.itinerary}>
            <div className={styles.itinHeader}>
              <label>Sequence</label>
              {stops.length > 0 && <button onClick={clearStops} className={styles.clearBtn}>Clear</button>}
            </div>
            {stops.map((s, i) => (
              <div key={i} className={styles.stopCard}>
                <div className={styles.index}>{i + 1}</div>
                <div className={styles.details}><strong>{s.name}</strong></div>
              </div>
            ))}
          </div>
          <button className={styles.primaryBtn} disabled={isLoading} onClick={handleSave}>
            <Save size={18}/> {isLoading ? "Saving..." : "Publish Route"}
          </button>
        </div>
      </aside>
      <div ref={mapContainer} className={styles.mapFrame} />
    </div>
  );
}