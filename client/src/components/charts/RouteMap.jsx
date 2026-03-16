import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MAP_LAYERS = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
};

function FitBounds({ coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates?.length > 0) {
      const latLngs = coordinates.map(coord => [coord[1], coord[0]]);
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, coordinates]);

  return null;
}

function CurrentPositionMarker({ position }) {
  const map = useMap();

  if (!position) return null;

  return (
    <>
      {/* Outer pulsing ring */}
      <CircleMarker
        center={position}
        radius={16}
        pathOptions={{
          color: "#a855f7",
          fillColor: "#a855f7",
          fillOpacity: 0.2,
          weight: 0,
        }}
      />
      {/* Inner dot */}
      <CircleMarker
        center={position}
        radius={6}
        pathOptions={{
          color: "white",
          fillColor: "#7c3aed",
          fillOpacity: 1,
          weight: 2,
        }}
      />
    </>
  );
}

export default function RouteMap({ route, hoverPosition }) {
  const [mapLayer, setMapLayer] = useState("standard");
  const coordinates = route?.coordinates;

  if (!coordinates?.length) {
    return (
      <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
        No route data available
      </div>
    );
  }

  // Convert [lng, lat] to [lat, lng] for Leaflet
  const positions = useMemo(() =>
    coordinates.map(coord => [coord[1], coord[0]]),
    [coordinates]
  );

  const startPosition = positions[0];
  const endPosition = positions[positions.length - 1];

  // Calculate current position based on hover ratio
  const currentPosition = useMemo(() => {
    if (hoverPosition === null || hoverPosition === undefined) return null;
    const index = Math.floor(hoverPosition * (positions.length - 1));
    return positions[Math.min(index, positions.length - 1)];
  }, [hoverPosition, positions]);

  // Calculate center
  const center = useMemo(() => {
    if (positions.length === 0) return [0, 0];
    return [
      positions.reduce((sum, p) => sum + p[0], 0) / positions.length,
      positions.reduce((sum, p) => sum + p[1], 0) / positions.length,
    ];
  }, [positions]);

  const layer = MAP_LAYERS[mapLayer];

  return (
    <div className="relative h-64 rounded-xl overflow-hidden">
      {/* Layer toggle button */}
      <button
        onClick={() => setMapLayer(mapLayer === "standard" ? "satellite" : "standard")}
        className="absolute top-2 right-2 z-1000 bg-white px-2 py-1 rounded shadow text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {mapLayer === "standard" ? "Satellite" : "Map"}
      </button>

      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          key={mapLayer}
          attribution={layer.attribution}
          url={layer.url}
        />

        {/* Route line */}
        <Polyline
          positions={positions}
          pathOptions={{
            color: "#3b82f6",
            weight: 3,
            opacity: 0.8,
          }}
        />

        {/* Start marker */}
        <CircleMarker
          center={startPosition}
          radius={6}
          pathOptions={{
            color: "white",
            fillColor: "#22c55e",
            fillOpacity: 1,
            weight: 2,
          }}
        />

        {/* End marker */}
        <CircleMarker
          center={endPosition}
          radius={6}
          pathOptions={{
            color: "white",
            fillColor: "#ef4444",
            fillOpacity: 1,
            weight: 2,
          }}
        />

        {/* Current position marker */}
        <CurrentPositionMarker position={currentPosition} />

        <FitBounds coordinates={coordinates} />
      </MapContainer>
    </div>
  );
}
