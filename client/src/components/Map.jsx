"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const Map = forwardRef(({ center = [74.3587, 31.5204], zoom = 12 }, ref) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom,
    });

    mapRef.current = map;

    markerRef.current = new mapboxgl.Marker({ color: "red" })
      .setLngLat(center)
      .addTo(map);

  }, []);

  // expose function to parent
  useImperativeHandle(ref, () => ({
    updateDriverLocation: (lng, lat) => {
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      }
      if (mapRef.current) {
        mapRef.current.setCenter([lng, lat]);
      }
    }
  }));

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "8px",
      }}
    />
  );
});

export default Map;
