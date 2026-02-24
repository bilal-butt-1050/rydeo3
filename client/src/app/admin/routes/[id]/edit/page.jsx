"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Trash2, Save, Search, ArrowLeft } from "lucide-react";
import styles from "../../page.module.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;

export default function EditRoute({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  const [routeName, setRouteName] = useState("");
  const [routeCode, setRouteCode] = useState("");
  const [stops, setStops] = useState([]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const markers = useRef({});

  useEffect(() => {
    fetchRouteDetails();
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [74.3587, 31.5204],
        zoom: 12,
      });

      map.current.on("load", () => {
        map.current.getCanvas().style.cursor = "crosshair";
        
        map.current.addSource("route-line", { 
          type: "geojson", 
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } } 
        });
        map.current.addLayer({ 
          id: "route-layer", 
          type: "line", 
          source: "route-line", 
          paint: { "line-color": "#2563eb", "line-width": 5 } 
        });

        map.current.on("click", async (e) => {
          const { lng, lat } = e.lngLat;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            const name = data.display_name ? data.display_name.split(',')[0] : `Manual Pin`;
            
            const newStopData = {
              name: name,
              coordinates: { lat, lng: lng },
              order: stops.length
            };
            await adminAPI.addStop(id, newStopData);
            fetchRouteDetails();
          } catch (err) { console.error(err); }
        });
      });
    }
  }, [id, stops.length]);

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

  const fetchRouteDetails = async () => {
    try {
      const res = await adminAPI.getRoute(id);
      setRouteName(res.data.name);
      setRouteCode(res.data.code || "");
      setStops(res.data.stops.sort((a, b) => a.order - b.order));
    } catch (err) { router.push("/admin/routes"); }
  };

  useEffect(() => {
    if (stops.length >= 2) updateMapPath();
    syncMarkers();
  }, [stops]);

  const updateMapPath = async () => {
    const coordinates = stops.map(s => [s.coordinates.lng, s.coordinates.lat]);
    try {
      const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": ORS_API_KEY },
        body: JSON.stringify({ coordinates })
      });
      const data = await res.json();
      if (data.features) map.current.getSource("route-line").setData(data.features[0].geometry);
    } catch (e) { console.error(e); }
  };

  const syncMarkers = () => {
    Object.values(markers.current).forEach(m => m.remove());
    stops.forEach((stop, i) => {
      const el = document.createElement('div');
      el.className = styles.markerPin;
      el.style.backgroundColor = i === 0 ? "#10b981" : i === stops.length - 1 ? "#ef4444" : "#2563eb";
      el.innerHTML = `<span>${i + 1}</span>`;
      markers.current[i] = new mapboxgl.Marker(el).setLngLat([stop.coordinates.lng, stop.coordinates.lat]).addTo(map.current);
    });
  };

  const handleAddStop = async (item) => {
    try {
      const newStopData = {
        name: item.display_name.split(',')[0],
        coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
        order: stops.length
      };
      await adminAPI.addStop(id, newStopData);
      setSearch("");
      setSuggestions([]);
      fetchRouteDetails();
    } catch (err) { alert("Error adding stop"); }
  };

  const handleDeleteStop = async (stopId) => {
    if (!confirm("Delete stop?")) return;
    try {
      await adminAPI.deleteStop(stopId);
      fetchRouteDetails();
    } catch (err) { alert("Delete failed"); }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(stops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setStops(items);
    try {
      await Promise.all(items.map((s, i) => adminAPI.updateStop(s._id, { order: i })));
    } catch (err) { console.error(err); }
  };

  const saveRouteInfo = async () => {
    try {
      await adminAPI.updateRoute(id, { name: routeName, code: routeCode });
      alert("Updated!");
    } catch (err) { alert("Failed"); }
  };

  return (
    <div className={styles.architectWrapper}>
      <aside className={styles.panel}>
        <div className={styles.section}>
          <button onClick={() => router.back()} className={styles.backBtn}><ArrowLeft size={16}/> Back</button>
          <h2>Edit Route</h2>
          <input className={styles.mainInput} value={routeName} onChange={e => setRouteName(e.target.value)} />
          <input className={styles.mainInput} value={routeCode} onChange={e => setRouteCode(e.target.value)} />
          <button className={styles.saveInfoBtn} onClick={saveRouteInfo}>Update Info</button>

          <div className={styles.searchBox}>
             <label><Search size={14}/> Add Stop (Search or Click Map)</label>
             <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
             {suggestions.length > 0 && (
               <ul className={styles.suggestionList}>
                 {suggestions.map((s, i) => (
                   <li key={i} onClick={() => handleAddStop(s)}><strong>{s.display_name.split(',')[0]}</strong></li>
                 ))}
               </ul>
             )}
          </div>

          <div className={styles.itinerary}>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="stops">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {stops.map((stop, index) => (
                      <Draggable key={stop._id} draggableId={stop._id} index={index}>
                        {(p) => (
                          <div ref={p.innerRef} {...p.draggableProps} className={styles.stopCard}>
                            <div {...p.dragHandleProps}><GripVertical size={16}/></div>
                            <div className={styles.index}>{index+1}</div>
                            <div className={styles.details}><strong>{stop.name}</strong></div>
                            <button onClick={() => handleDeleteStop(stop._id)} className={styles.iconBtn}><Trash2 size={14}/></button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </aside>
      <div ref={mapContainer} className={styles.mapFrame} />
    </div>
  );
}